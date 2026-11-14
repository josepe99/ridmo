import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

// The real PrismaClient is replaced so importing this module never opens a connection.
const constructed = vi.hoisted(() => ({ calls: [] as unknown[] }))
const disconnect = vi.hoisted(() => vi.fn(async () => undefined))

vi.mock("@prisma/client", () => ({
  PrismaClient: class {
    $disconnect = disconnect
    constructor(options: unknown) {
      constructed.calls.push(options)
    }
  },
}))

const globals = globalThis as { prisma?: unknown }

async function loadModule() {
  vi.resetModules()
  return await import("./prisma")
}

beforeEach(() => {
  constructed.calls.length = 0
  disconnect.mockClear()
  delete globals.prisma
})

afterEach(() => {
  delete globals.prisma
  vi.unstubAllEnvs()
})

describe("prisma client singleton", () => {
  it("creates one client that only logs errors", async () => {
    await loadModule()

    expect(constructed.calls).toEqual([{ log: ["error"] }])
  })

  it("is cached on globalThis outside production so hot reloads reuse it", async () => {
    vi.stubEnv("NODE_ENV", "development")

    const { prisma } = await loadModule()

    expect(globals.prisma).toBe(prisma)
  })

  it("reuses a client that already exists on globalThis", async () => {
    const existing = { existing: true }
    globals.prisma = existing

    const { prisma } = await loadModule()

    expect(prisma).toBe(existing)
    expect(constructed.calls).toHaveLength(0)
  })

  it("is not cached on globalThis in production", async () => {
    vi.stubEnv("NODE_ENV", "production")

    await loadModule()

    expect(globals.prisma).toBeUndefined()
  })

  it("disconnectPrisma closes the client", async () => {
    const { disconnectPrisma } = await loadModule()

    await disconnectPrisma()

    expect(disconnect).toHaveBeenCalledTimes(1)
  })
})
