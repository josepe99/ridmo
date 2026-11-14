// Promotes an EXISTING user to ADMIN. This is the only way to create the first administrator:
// there is no admin email in the environment and registration order grants nothing.
//
//   pnpm admin:promote someone@example.com
//
// - The person must already have registered (or signed in with Google once).
// - It refuses to run against a non-local DATABASE_URL unless ADMIN_PROMOTE_ALLOW_REMOTE=1.
// - It never creates users and never prints the database url or any secret.
import { pathToFileURL } from "node:url"

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "host.docker.internal"])
const ACTOR = "cli:promote-admin"

/** Host names of a mongodb:// url (possibly several, comma separated). `mongodb+srv` is never local. */
function hostsOf(url) {
  const match = /^mongodb:\/\/([^/?#]*)/i.exec(String(url ?? "").trim())
  if (!match) return []
  const authority = match[1]
  const hostList = authority.slice(authority.lastIndexOf("@") + 1)
  return hostList
    .split(",")
    .map((entry) => {
      const bracketed = /^\[([^\]]+)\](?::\d+)?$/.exec(entry)
      return (bracketed ? bracketed[1] : entry.replace(/:\d+$/, "")).toLowerCase()
    })
    .filter(Boolean)
}

export function isLocalDatabaseUrl(url) {
  const hosts = hostsOf(url)
  return hosts.length > 0 && hosts.every((host) => LOCAL_HOSTS.has(host))
}

export function assertSafeTarget({ databaseUrl, allowRemote }) {
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set. Run through `pnpm admin:promote` so .env is loaded.")
  }
  if (!isLocalDatabaseUrl(databaseUrl) && allowRemote !== "1") {
    throw new Error(
      "DATABASE_URL does not point to a local database. Refusing to continue. " +
        "If you really mean to promote a user on that database, set ADMIN_PROMOTE_ALLOW_REMOTE=1."
    )
  }
}

export function normalizeEmailArg(value) {
  if (typeof value !== "string") return null
  const email = value.normalize("NFKC").trim().toLowerCase()
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254 ? email : null
}

export async function promoteAdmin({ prisma, email }) {
  const normalized = normalizeEmailArg(email)
  if (!normalized) return { status: "invalid_email" }

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { email: normalized },
      select: { id: true, role: true },
    })
    if (!user) return { status: "not_found" }
    if (user.role === "ADMIN") return { status: "already_admin" }

    await tx.user.update({ where: { id: user.id }, data: { role: "ADMIN" } })
    await tx.roleChange.create({
      data: { actorId: ACTOR, targetId: user.id, fromRole: user.role, toRole: "ADMIN" },
    })
    return { status: "promoted" }
  })
}

const MESSAGES = {
  promoted: "Done: the user is now an ADMIN.",
  already_admin: "Nothing to do: the user is already an ADMIN.",
  not_found: "No user with that email. They must register (or sign in with Google) first.",
  invalid_email: "That does not look like an email address.",
}

async function main() {
  const email = process.argv[2]
  if (!email) {
    console.error("Usage: pnpm admin:promote <email>")
    process.exitCode = 1
    return
  }

  try {
    assertSafeTarget({ databaseUrl: process.env.DATABASE_URL, allowRemote: process.env.ADMIN_PROMOTE_ALLOW_REMOTE })
  } catch (error) {
    console.error(error.message)
    process.exitCode = 1
    return
  }

  const { PrismaClient } = await import("@prisma/client")
  const prisma = new PrismaClient()
  try {
    const { status } = await promoteAdmin({ prisma, email })
    console.log(MESSAGES[status])
    if (status === "not_found" || status === "invalid_email") process.exitCode = 1
  } finally {
    await prisma.$disconnect()
  }
}

// Run only when executed directly, not when imported by the tests.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main()
}
