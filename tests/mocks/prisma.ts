import { vi, type Mock } from "vitest"

/**
 * Hand-built Prisma stand-in. Tests never touch a real database: every model method is a
 * `vi.fn()` the test configures, and `$transaction` runs its callback against `txMock`
 * (a second, independent set of model mocks) so tests can assert what happened inside it.
 *
 * Usage in a test file:
 *   vi.mock("@/shared/lib/prisma", async () => (await import("@/tests/mocks/prisma")).prismaModule)
 *   import { prismaMock, txMock } from "@/tests/mocks/prisma"
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Fn = Mock<(...args: any[]) => any>
const fn = (): Fn => vi.fn()

const MODEL_METHODS = [
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
  "aggregate",
  "aggregateRaw",
] as const

const MODEL_NAMES = ["collection", "item", "order", "pushSubscription"] as const

export type ModelMock = Record<(typeof MODEL_METHODS)[number], Fn>

function createModelMock(): ModelMock {
  return Object.fromEntries(MODEL_METHODS.map((method) => [method, fn()])) as ModelMock
}

function createModels() {
  return Object.fromEntries(MODEL_NAMES.map((name) => [name, createModelMock()])) as Record<
    (typeof MODEL_NAMES)[number],
    ModelMock
  >
}

export const txMock = {
  ...createModels(),
  $runCommandRaw: fn(),
}

export const prismaMock = {
  ...createModels(),
  $runCommandRaw: fn(),
  $disconnect: fn(),
  $transaction: fn(),
}

/** Clears every call and implementation; re-installs the default `$transaction` behaviour. */
export function resetPrismaMock() {
  for (const target of [prismaMock, txMock] as Array<Record<string, unknown>>) {
    for (const value of Object.values(target)) {
      if (typeof value === "function") (value as Fn).mockReset()
      else if (value && typeof value === "object") {
        for (const fn of Object.values(value as Record<string, Fn>)) fn.mockReset()
      }
    }
  }
  prismaMock.$transaction.mockImplementation(async (callback: (tx: typeof txMock) => unknown) =>
    callback(txMock)
  )
}

resetPrismaMock()

/** Module shape for `vi.mock("@/shared/lib/prisma", ...)`. */
export const prismaModule = {
  prisma: prismaMock,
  disconnectPrisma: async () => prismaMock.$disconnect(),
}
