import { beforeEach, describe, expect, it, vi } from "vitest"
import { authPrismaMock, resetAuthPrismaMock } from "@/tests/mocks/auth-prisma"

vi.mock("@/shared/lib/prisma", async () => (await import("@/tests/mocks/auth-prisma")).authPrismaModule)

import { listUsers, USERS_PAGE_SIZE } from "./list-users"

const createdAt = new Date("2026-01-02T03:04:05.000Z")

beforeEach(() => {
  resetAuthPrismaMock()
  authPrismaMock.user.findMany.mockResolvedValue([])
  authPrismaMock.user.count.mockResolvedValue(0)
})

describe("listUsers", () => {
  it("maps rows to DTOs without any credential material", async () => {
    authPrismaMock.user.findMany.mockResolvedValue([
      {
        id: "u1",
        name: "Ana",
        email: "ana@example.com",
        role: "ADMIN",
        disabledAt: null,
        createdAt,
        passwordHash: "$argon2id$leak",
        _count: { accounts: 1 },
      },
    ])
    authPrismaMock.user.count.mockResolvedValue(1)

    const result = await listUsers({})

    expect(result).toEqual({
      users: [
        {
          id: "u1",
          name: "Ana",
          email: "ana@example.com",
          role: "ADMIN",
          disabled: false,
          hasGoogle: true,
          createdAt: "2026-01-02T03:04:05.000Z",
        },
      ],
      total: 1,
      page: 1,
      pageSize: USERS_PAGE_SIZE,
      pageCount: 1,
    })
    expect(JSON.stringify(result)).not.toMatch(/argon2|passwordHash/)
  })

  it("never selects the password hash", async () => {
    await listUsers({})
    expect(authPrismaMock.user.findMany.mock.calls[0][0].select).not.toHaveProperty("passwordHash")
  })

  it("searches by normalized email fragment, case-insensitively", async () => {
    await listUsers({ query: "  ANA@Exam " })
    const where = authPrismaMock.user.findMany.mock.calls[0][0].where
    expect(where).toEqual({ email: { contains: "ana@exam", mode: "insensitive" } })
    expect(authPrismaMock.user.count).toHaveBeenCalledWith({ where })
  })

  it("applies no filter for an empty search and caps an oversized one", async () => {
    await listUsers({ query: "   " })
    expect(authPrismaMock.user.findMany.mock.calls[0][0].where).toEqual({})

    await listUsers({ query: "x".repeat(500) })
    const contains = authPrismaMock.user.findMany.mock.calls[1][0].where.email.contains
    expect(contains.length).toBeLessThanOrEqual(100)
  })

  it("paginates with a fixed page size", async () => {
    authPrismaMock.user.count.mockResolvedValue(45)
    const result = await listUsers({ page: 3 })
    expect(authPrismaMock.user.findMany.mock.calls[0][0]).toMatchObject({
      skip: 2 * USERS_PAGE_SIZE,
      take: USERS_PAGE_SIZE,
      orderBy: { createdAt: "desc" },
    })
    expect(result).toMatchObject({ page: 3, pageCount: Math.ceil(45 / USERS_PAGE_SIZE) })
  })

  it.each([0, -4, 1.5, Number.NaN, "2", undefined])("treats the page %j safely", async (page) => {
    await listUsers({ page: page as never })
    const { skip } = authPrismaMock.user.findMany.mock.calls[0][0]
    expect(skip).toBeGreaterThanOrEqual(0)
    expect(Number.isInteger(skip)).toBe(true)
  })
})
