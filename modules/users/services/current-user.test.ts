import { beforeEach, describe, expect, it, vi } from "vitest"
import { authPrismaMock, resetAuthPrismaMock } from "@/tests/mocks/auth-prisma"

vi.mock("@/shared/lib/prisma", async () => (await import("@/tests/mocks/auth-prisma")).authPrismaModule)
vi.mock("../auth", () => ({ auth: vi.fn() }))

import { auth } from "../auth"
import { AuthorizationError } from "../errors"
import { getCurrentUser, requireAdmin, requireUser } from "./current-user"

const USER_ID = "64b7f0a0a0a0a0a0a0a0a0a0"

const session = (user: Record<string, unknown> | null) =>
  vi.mocked(auth as unknown as () => Promise<unknown>).mockResolvedValue(user ? { user, expires: "2099" } : null)

const dbUser = (overrides: Record<string, unknown> = {}) => ({
  id: USER_ID,
  name: "Ana",
  email: "ana@example.com",
  image: null,
  role: "USER",
  disabledAt: null,
  ...overrides,
})

beforeEach(() => {
  resetAuthPrismaMock()
  vi.mocked(auth as unknown as () => Promise<unknown>).mockReset()
})

describe("requireAdmin (DB-authoritative)", () => {
  it("allows an ADMIN according to the database and returns the user id", async () => {
    session({ id: USER_ID, role: "ADMIN" })
    authPrismaMock.user.findUnique.mockResolvedValue(dbUser({ role: "ADMIN" }))
    await expect(requireAdmin()).resolves.toBe(USER_ID)
  })

  it("denies when the JWT says ADMIN but the database says USER (demotion is immediate)", async () => {
    session({ id: USER_ID, role: "ADMIN" })
    authPrismaMock.user.findUnique.mockResolvedValue(dbUser({ role: "USER" }))
    await expect(requireAdmin()).rejects.toMatchObject({ name: "AuthorizationError", code: "FORBIDDEN" })
  })

  it("allows an ADMIN in the database even when the JWT still says USER (promotion is immediate)", async () => {
    session({ id: USER_ID, role: "USER" })
    authPrismaMock.user.findUnique.mockResolvedValue(dbUser({ role: "ADMIN" }))
    await expect(requireAdmin()).resolves.toBe(USER_ID)
  })

  it("denies when the user no longer exists", async () => {
    session({ id: USER_ID, role: "ADMIN" })
    authPrismaMock.user.findUnique.mockResolvedValue(null)
    await expect(requireAdmin()).rejects.toMatchObject({ code: "UNAUTHENTICATED" })
  })

  it("denies a disabled admin", async () => {
    session({ id: USER_ID, role: "ADMIN" })
    authPrismaMock.user.findUnique.mockResolvedValue(dbUser({ role: "ADMIN", disabledAt: new Date() }))
    await expect(requireAdmin()).rejects.toMatchObject({ code: "FORBIDDEN" })
  })

  it("denies without a session and never queries the database", async () => {
    session(null)
    await expect(requireAdmin()).rejects.toMatchObject({ code: "UNAUTHENTICATED" })
    expect(authPrismaMock.user.findUnique).not.toHaveBeenCalled()
  })

  it.each([undefined, "", "not-an-object-id", 42, { $ne: "" }])(
    "denies a session whose id is %j without hitting the database",
    async (id) => {
      session({ id, role: "ADMIN" })
      await expect(requireAdmin()).rejects.toBeInstanceOf(AuthorizationError)
      expect(authPrismaMock.user.findUnique).not.toHaveBeenCalled()
    }
  )

  it("fails closed when the database errors", async () => {
    session({ id: USER_ID, role: "ADMIN" })
    authPrismaMock.user.findUnique.mockRejectedValue(new Error("db down"))
    await expect(requireAdmin()).rejects.toThrow("db down")
  })

  it("reads only safe columns", async () => {
    session({ id: USER_ID })
    authPrismaMock.user.findUnique.mockResolvedValue(dbUser({ role: "ADMIN" }))
    await requireAdmin()
    const args = authPrismaMock.user.findUnique.mock.calls[0][0]
    expect(args.where).toEqual({ id: USER_ID })
    expect(args.select).not.toHaveProperty("passwordHash")
    expect(args.select).toMatchObject({ role: true, disabledAt: true })
  })
})

describe("requireUser / getCurrentUser", () => {
  it("returns the database user for a valid session, with the DB role", async () => {
    session({ id: USER_ID, role: "ADMIN" })
    authPrismaMock.user.findUnique.mockResolvedValue(dbUser({ role: "USER" }))
    await expect(requireUser()).resolves.toEqual({
      id: USER_ID,
      name: "Ana",
      email: "ana@example.com",
      image: null,
      role: "USER",
    })
  })

  it("requireUser rejects anonymous visitors", async () => {
    session(null)
    await expect(requireUser()).rejects.toMatchObject({ code: "UNAUTHENTICATED" })
  })

  it("getCurrentUser returns null for guests, deleted users and disabled users", async () => {
    session(null)
    await expect(getCurrentUser()).resolves.toBeNull()

    session({ id: USER_ID })
    authPrismaMock.user.findUnique.mockResolvedValue(null)
    await expect(getCurrentUser()).resolves.toBeNull()

    authPrismaMock.user.findUnique.mockResolvedValue(dbUser({ disabledAt: new Date() }))
    await expect(getCurrentUser()).resolves.toBeNull()
  })

  it("never exposes the password hash or the disabled flag", async () => {
    session({ id: USER_ID })
    authPrismaMock.user.findUnique.mockResolvedValue({ ...dbUser(), passwordHash: "$argon2id$leak" })
    const user = await getCurrentUser()
    expect(JSON.stringify(user)).not.toMatch(/argon2|passwordHash|disabledAt/)
  })
})
