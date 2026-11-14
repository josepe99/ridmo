import { PrismaAdapter } from "@auth/prisma-adapter"
import type { Adapter, AdapterUser } from "next-auth/adapters"
import type { PrismaClient } from "@prisma/client"
import { normalizeEmail } from "../domain/email"
import { toRole } from "../domain/roles"

type UserRow = {
  id: string
  name: string | null
  email: string
  emailVerified: Date | null
  image: string | null
  role: unknown
  disabledAt: Date | null
}

/** The only user shape that ever leaves the adapter: no password hash, explicit role. */
function toAdapterUser(row: UserRow): AdapterUser & { role: "USER" | "ADMIN"; disabledAt: Date | null } {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    emailVerified: row.emailVerified,
    image: row.image,
    role: toRole(row.role),
    disabledAt: row.disabledAt,
  }
}

const SAFE_USER_SELECT = {
  id: true,
  name: true,
  email: true,
  emailVerified: true,
  image: true,
  role: true,
  disabledAt: true,
} as const

/**
 * Auth.js adapter for Google users, on top of `@auth/prisma-adapter` but hardened:
 *  - every returned user is stripped of `passwordHash` (the stock adapter returns whole rows);
 *  - emails are normalised the same way as for credentials accounts;
 *  - users created through OAuth are always `USER`, with no password;
 *  - `updateUser` can only touch profile fields, never role/password/disabled state;
 *  - linking an account stores identifiers only: Google access/refresh/id tokens are discarded.
 */
export function createAuthAdapter(prisma: PrismaClient): Adapter {
  const base = PrismaAdapter(prisma)

  return {
    ...base,

    async createUser(user) {
      const row = await prisma.user.create({
        data: {
          name: user.name ?? null,
          email: normalizeEmail(user.email),
          emailVerified: user.emailVerified ?? null,
          image: user.image ?? null,
          role: "USER",
        },
        select: SAFE_USER_SELECT,
      })
      return toAdapterUser(row)
    },

    async getUser(id) {
      const row = await prisma.user.findUnique({ where: { id }, select: SAFE_USER_SELECT })
      return row ? toAdapterUser(row) : null
    },

    async getUserByEmail(email) {
      const row = await prisma.user.findUnique({ where: { email: normalizeEmail(email) }, select: SAFE_USER_SELECT })
      return row ? toAdapterUser(row) : null
    },

    async getUserByAccount({ provider, providerAccountId }) {
      const account = await prisma.account.findUnique({
        where: { provider_providerAccountId: { provider, providerAccountId } },
        select: { user: { select: SAFE_USER_SELECT } },
      })
      return account?.user ? toAdapterUser(account.user) : null
    },

    async updateUser(user) {
      const data: { name?: string | null; image?: string | null; emailVerified?: Date | null } = {}
      if (user.name !== undefined) data.name = user.name
      if (user.image !== undefined) data.image = user.image
      if (user.emailVerified !== undefined) data.emailVerified = user.emailVerified
      const row = await prisma.user.update({ where: { id: user.id }, data, select: SAFE_USER_SELECT })
      return toAdapterUser(row)
    },

    async linkAccount(account) {
      await prisma.account.create({
        data: {
          userId: account.userId,
          type: account.type,
          provider: account.provider,
          providerAccountId: account.providerAccountId,
        },
      })
    },
  }
}
