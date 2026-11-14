import { describe, expect, it, vi } from "vitest"
import { assertSafeTarget, isLocalDatabaseUrl, normalizeEmailArg, promoteAdmin } from "./promote-admin.mjs"

describe("isLocalDatabaseUrl", () => {
  it.each([
    "mongodb://localhost:27017/ridmo?replicaSet=rs0",
    "mongodb://127.0.0.1:27017/ridmo",
    "mongodb://user:pass@localhost:27017/ridmo?authSource=admin",
    "mongodb://[::1]:27017/ridmo",
    "mongodb://host.docker.internal:27017/ridmo",
    "mongodb://localhost:27017,127.0.0.1:27018/ridmo?replicaSet=rs0",
    "MONGODB://LOCALHOST/ridmo",
  ])("accepts the local url %s", (url) => {
    expect(isLocalDatabaseUrl(url)).toBe(true)
  })

  it.each([
    "mongodb+srv://user:pass@cluster0.abcde.mongodb.net/ridmo",
    "mongodb://cluster0-shard-00-00.abcde.mongodb.net:27017/ridmo",
    "mongodb://db.example.com:27017/ridmo",
    "mongodb://10.0.0.5:27017/ridmo",
    // credentials that merely look local must not fool the check
    "mongodb://localhost:pass@evil.example.com:27017/ridmo",
    "mongodb://user:pw@evil.example.com/ridmo?host=localhost",
    "mongodb://localhost.evil.com:27017/ridmo",
    "mongodb://localhost:27017,db.example.com:27017/ridmo",
    "",
    "not a url",
    undefined,
  ])("rejects %s", (url) => {
    expect(isLocalDatabaseUrl(url as string)).toBe(false)
  })
})

describe("assertSafeTarget", () => {
  const remote = "mongodb+srv://user:pass@cluster0.abcde.mongodb.net/ridmo"
  const local = "mongodb://localhost:27017/ridmo"

  it("refuses a non-local database by default without echoing the url", () => {
    let message = ""
    try {
      assertSafeTarget({ databaseUrl: remote, allowRemote: undefined })
    } catch (error) {
      message = (error as Error).message
    }
    expect(message).toMatch(/ADMIN_PROMOTE_ALLOW_REMOTE=1/)
    expect(message).not.toContain("pass")
    expect(message).not.toContain("cluster0")
  })

  it("refuses when DATABASE_URL is missing", () => {
    expect(() => assertSafeTarget({ databaseUrl: undefined, allowRemote: "1" })).toThrow(/DATABASE_URL/)
  })

  it("allows a local database", () => {
    expect(() => assertSafeTarget({ databaseUrl: local, allowRemote: undefined })).not.toThrow()
  })

  it("allows a remote database only with the explicit flag set to exactly 1", () => {
    expect(() => assertSafeTarget({ databaseUrl: remote, allowRemote: "1" })).not.toThrow()
    for (const value of ["0", "true", "yes", "", "11"]) {
      expect(() => assertSafeTarget({ databaseUrl: remote, allowRemote: value })).toThrow()
    }
  })
})

describe("normalizeEmailArg", () => {
  it("trims and lowercases", () => {
    expect(normalizeEmailArg("  Ana@Example.COM ")).toBe("ana@example.com")
  })

  it.each(["", "   ", "nope", undefined, "a@b"])("returns null for %j", (value) => {
    expect(normalizeEmailArg(value as string)).toBeNull()
  })
})

function fakePrisma(user: { id: string; role: string } | null) {
  const tx = {
    user: { findUnique: vi.fn().mockResolvedValue(user), update: vi.fn().mockResolvedValue({}) },
    roleChange: { create: vi.fn().mockResolvedValue({}) },
  }
  return { tx, prisma: { $transaction: vi.fn(async (cb: (t: typeof tx) => unknown) => cb(tx)) } }
}

describe("promoteAdmin", () => {
  it("promotes an existing USER, and records the change", async () => {
    const { prisma, tx } = fakePrisma({ id: "64b7f0a0a0a0a0a0a0a0a0a1", role: "USER" })
    const result = await promoteAdmin({ prisma, email: "Ana@Example.com" })

    expect(result).toEqual({ status: "promoted" })
    expect(tx.user.findUnique.mock.calls[0][0].where).toEqual({ email: "ana@example.com" })
    expect(tx.user.update).toHaveBeenCalledWith({
      where: { id: "64b7f0a0a0a0a0a0a0a0a0a1" },
      data: { role: "ADMIN" },
    })
    expect(tx.roleChange.create).toHaveBeenCalledWith({
      data: { actorId: "cli:promote-admin", targetId: "64b7f0a0a0a0a0a0a0a0a0a1", fromRole: "USER", toRole: "ADMIN" },
    })
  })

  it("never creates a user: an unknown email is reported and nothing is written", async () => {
    const { prisma, tx } = fakePrisma(null)
    expect(await promoteAdmin({ prisma, email: "ghost@example.com" })).toEqual({ status: "not_found" })
    expect(tx.user.update).not.toHaveBeenCalled()
    expect(tx.roleChange.create).not.toHaveBeenCalled()
  })

  it("is idempotent for an existing admin", async () => {
    const { prisma, tx } = fakePrisma({ id: "64b7f0a0a0a0a0a0a0a0a0a1", role: "ADMIN" })
    expect(await promoteAdmin({ prisma, email: "ana@example.com" })).toEqual({ status: "already_admin" })
    expect(tx.user.update).not.toHaveBeenCalled()
  })

  it("rejects an invalid email before touching the database", async () => {
    const { prisma } = fakePrisma(null)
    expect(await promoteAdmin({ prisma, email: "nope" })).toEqual({ status: "invalid_email" })
    expect(prisma.$transaction).not.toHaveBeenCalled()
  })
})
