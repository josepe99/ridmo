import { vi } from "vitest"

/**
 * Prisma stand-in for the authentication tests (users, accounts, rate limiter, audit log,
 * orders). Same idea as tests/mocks/prisma.ts: every model method is a `vi.fn()` and
 * `$transaction` runs its callback against `authTxMock` so tests can assert what happened
 * inside the transaction.
 *
 *   vi.mock("@/shared/lib/prisma", async () => (await import("@/tests/mocks/auth-prisma")).authPrismaModule)
 */
type Fn = ReturnType<typeof vi.fn>

const METHODS = [
  "findMany",
  "findUnique",
  "findFirst",
  "create",
  "update",
  "updateMany",
  "upsert",
  "delete",
  "deleteMany",
  "count",
] as const

const MODELS = ["user", "account", "loginAttempt", "roleChange", "order", "counter"] as const

type ModelMock = Record<(typeof METHODS)[number], Fn>

function createModels() {
  return Object.fromEntries(
    MODELS.map((name) => [name, Object.fromEntries(METHODS.map((m) => [m, vi.fn()]))])
  ) as Record<(typeof MODELS)[number], ModelMock>
}

export const authTxMock = createModels()

export const authPrismaMock = {
  ...createModels(),
  $transaction: vi.fn() as Fn,
}

export function resetAuthPrismaMock() {
  for (const target of [authPrismaMock, authTxMock] as Array<Record<string, unknown>>) {
    for (const value of Object.values(target)) {
      if (typeof value === "function") (value as Fn).mockReset()
      else if (value && typeof value === "object") {
        for (const fn of Object.values(value as Record<string, Fn>)) fn.mockReset()
      }
    }
  }
  authPrismaMock.$transaction.mockImplementation(
    async (callback: (tx: typeof authTxMock) => unknown) => callback(authTxMock)
  )
}

resetAuthPrismaMock()

export const authPrismaModule = {
  prisma: authPrismaMock,
  disconnectPrisma: async () => undefined,
}
