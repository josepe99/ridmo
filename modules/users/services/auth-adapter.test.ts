import { beforeEach, describe, expect, it } from "vitest"
import { authPrismaMock, resetAuthPrismaMock } from "@/tests/mocks/auth-prisma"
import { createAuthAdapter } from "./auth-adapter"

const row = (overrides: Record<string, unknown> = {}) => ({
  id: "u1",
  name: "Ana",
  email: "ana@example.com",
  emailVerified: null,
  image: null,
  role: "USER",
  disabledAt: null,
  passwordHash: "$argon2id$leak",
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})

const adapter = () => createAuthAdapter(authPrismaMock as never) as Required<ReturnType<typeof createAuthAdapter>>

beforeEach(() => resetAuthPrismaMock())

describe("auth adapter", () => {
  it("creates OAuth users as USER with a normalized email and no password", async () => {
    authPrismaMock.user.create.mockResolvedValue(row())
    const created = await adapter().createUser!({
      id: "ignored",
      name: "Ana",
      email: "Ana@Example.COM",
      image: null,
      emailVerified: new Date(),
      role: "ADMIN",
    } as never)

    const data = authPrismaMock.user.create.mock.calls[0][0].data
    expect(data).toMatchObject({ email: "ana@example.com", role: "USER" })
    expect(data).not.toHaveProperty("passwordHash")
    expect(data).not.toHaveProperty("id")
    expect(JSON.stringify(created)).not.toMatch(/argon2|passwordHash/)
  })

  it("returns users without the password hash from every lookup", async () => {
    authPrismaMock.user.findUnique.mockResolvedValue(row())
    authPrismaMock.account.findUnique.mockResolvedValue({ user: row() })
    const a = adapter()

    for (const user of [
      await a.getUser!("u1"),
      await a.getUserByEmail!("ANA@example.com"),
      await a.getUserByAccount!({ provider: "google", providerAccountId: "g1" }),
    ]) {
      expect(user).toMatchObject({ id: "u1", email: "ana@example.com", role: "USER" })
      expect(JSON.stringify(user)).not.toMatch(/argon2|passwordHash/)
    }
  })

  it("looks users up by normalized email", async () => {
    authPrismaMock.user.findUnique.mockResolvedValue(null)
    await adapter().getUserByEmail!("  ANA@Example.com ")
    expect(authPrismaMock.user.findUnique.mock.calls[0][0].where).toEqual({ email: "ana@example.com" })
  })

  it("returns null when the account or user does not exist", async () => {
    authPrismaMock.user.findUnique.mockResolvedValue(null)
    authPrismaMock.account.findUnique.mockResolvedValue(null)
    expect(await adapter().getUser!("nope")).toBeNull()
    expect(await adapter().getUserByAccount!({ provider: "google", providerAccountId: "x" })).toBeNull()
  })

  it("links an account storing identifiers only, never provider tokens", async () => {
    authPrismaMock.account.create.mockResolvedValue({})
    await adapter().linkAccount!({
      userId: "u1",
      type: "oidc",
      provider: "google",
      providerAccountId: "g1",
      access_token: "ya29.secret",
      refresh_token: "1//secret",
      id_token: "eyJ.secret",
      expires_at: 123,
      scope: "openid email",
      token_type: "bearer",
    } as never)

    const data = authPrismaMock.account.create.mock.calls[0][0].data
    expect(data).toEqual({ userId: "u1", type: "oidc", provider: "google", providerAccountId: "g1" })
    expect(JSON.stringify(data)).not.toMatch(/secret/)
  })

  it("never lets updateUser change role, password or disabled state", async () => {
    authPrismaMock.user.update.mockResolvedValue(row({ name: "New" }))
    await adapter().updateUser!({ id: "u1", name: "New", role: "ADMIN", passwordHash: "x", disabledAt: null } as never)
    const data = authPrismaMock.user.update.mock.calls[0][0].data
    expect(data).toEqual({ name: "New" })
  })
})
