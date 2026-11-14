import { Prisma } from "@prisma/client"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { authPrismaMock, authTxMock, resetAuthPrismaMock } from "@/tests/mocks/auth-prisma"

vi.mock("@/shared/lib/prisma", async () => (await import("@/tests/mocks/auth-prisma")).authPrismaModule)

import { changeUserRole } from "./set-user-role"

const ACTOR = "64b7f0a0a0a0a0a0a0a0a0a1"
const TARGET = "64b7f0a0a0a0a0a0a0a0a0a2"

function setup({
  actorRole = "ADMIN",
  target = { id: TARGET, role: "USER" } as { id: string; role: string } | null,
  adminCount = 2,
} = {}) {
  authTxMock.user.findUnique.mockImplementation(async ({ where }: { where: { id: string } }) => {
    if (where.id === ACTOR) return { id: ACTOR, role: actorRole, disabledAt: null }
    if (where.id === TARGET) return target
    return null
  })
  authTxMock.user.count.mockResolvedValue(adminCount)
  authTxMock.user.update.mockResolvedValue({})
  authTxMock.roleChange.create.mockResolvedValue({})
  authTxMock.counter.upsert.mockResolvedValue({})
}

beforeEach(() => {
  resetAuthPrismaMock()
  vi.spyOn(console, "info").mockImplementation(() => {})
})
afterEach(() => vi.restoreAllMocks())

describe("changeUserRole: input validation", () => {
  it.each([
    ["unknown role", { role: "SUPERADMIN" }],
    ["lowercase role", { role: "admin" }],
    ["missing role", { role: undefined }],
    ["object role", { role: { $ne: "USER" } }],
    ["malformed target id", { targetId: "not-an-id" }],
    ["empty target id", { targetId: "" }],
  ])("rejects %s without opening a transaction", async (_label, override) => {
    setup()
    const result = await changeUserRole({ actorId: ACTOR, targetId: TARGET, role: "ADMIN", ...override } as never)
    expect(result).toEqual({ ok: false, code: "INVALID_INPUT" })
    expect(authPrismaMock.$transaction).not.toHaveBeenCalled()
  })
})

describe("changeUserRole: rules", () => {
  it("blocks an admin from changing their own role", async () => {
    setup()
    const result = await changeUserRole({ actorId: ACTOR, targetId: ACTOR, role: "USER" })
    expect(result).toEqual({ ok: false, code: "SELF_CHANGE" })
    expect(authPrismaMock.$transaction).not.toHaveBeenCalled()
  })

  it("answers NOT_FOUND for an unknown target", async () => {
    setup({ target: null })
    const result = await changeUserRole({ actorId: ACTOR, targetId: TARGET, role: "ADMIN" })
    expect(result).toEqual({ ok: false, code: "NOT_FOUND" })
    expect(authTxMock.user.update).not.toHaveBeenCalled()
  })

  it("re-verifies inside the transaction that the actor is still an admin", async () => {
    setup({ actorRole: "USER" })
    const result = await changeUserRole({ actorId: ACTOR, targetId: TARGET, role: "ADMIN" })
    expect(result).toEqual({ ok: false, code: "FORBIDDEN" })
    expect(authTxMock.user.update).not.toHaveBeenCalled()
    expect(authTxMock.roleChange.create).not.toHaveBeenCalled()
  })

  it("refuses to demote the last remaining admin", async () => {
    setup({ target: { id: TARGET, role: "ADMIN" }, adminCount: 1 })
    const result = await changeUserRole({ actorId: ACTOR, targetId: TARGET, role: "USER" })
    expect(result).toEqual({ ok: false, code: "LAST_ADMIN" })
    expect(authTxMock.user.update).not.toHaveBeenCalled()
    expect(authTxMock.roleChange.create).not.toHaveBeenCalled()
  })

  it("counts only enabled admins when protecting the last one", async () => {
    setup({ target: { id: TARGET, role: "ADMIN" } })
    await changeUserRole({ actorId: ACTOR, targetId: TARGET, role: "USER" })
    expect(authTxMock.user.count).toHaveBeenCalledWith({
      where: { role: "ADMIN", OR: [{ disabledAt: null }, { disabledAt: { isSet: false } }] },
    })
  })

  it("is a no-op that writes nothing when the role is already the requested one", async () => {
    setup({ target: { id: TARGET, role: "USER" } })
    const result = await changeUserRole({ actorId: ACTOR, targetId: TARGET, role: "USER" })
    expect(result).toEqual({ ok: true, changed: false })
    expect(authTxMock.user.update).not.toHaveBeenCalled()
    expect(authTxMock.roleChange.create).not.toHaveBeenCalled()
  })
})

describe("changeUserRole: success", () => {
  it("promotes a user to ADMIN and records who/when/from/to in the same transaction", async () => {
    setup()
    const result = await changeUserRole({ actorId: ACTOR, targetId: TARGET, role: "ADMIN" })

    expect(result).toEqual({ ok: true, changed: true })
    expect(authTxMock.user.update).toHaveBeenCalledWith({ where: { id: TARGET }, data: { role: "ADMIN" } })
    expect(authTxMock.roleChange.create).toHaveBeenCalledWith({
      data: { actorId: ACTOR, targetId: TARGET, fromRole: "USER", toRole: "ADMIN" },
    })
    // Everything ran through the transaction client, nothing through the plain client.
    expect(authPrismaMock.user.update).not.toHaveBeenCalled()
    expect(authPrismaMock.roleChange.create).not.toHaveBeenCalled()
  })

  it("demotes an admin when another admin remains", async () => {
    setup({ target: { id: TARGET, role: "ADMIN" }, adminCount: 2 })
    const result = await changeUserRole({ actorId: ACTOR, targetId: TARGET, role: "USER" })
    expect(result).toEqual({ ok: true, changed: true })
    expect(authTxMock.roleChange.create).toHaveBeenCalledWith({
      data: { actorId: ACTOR, targetId: TARGET, fromRole: "ADMIN", toRole: "USER" },
    })
  })

  it("writes a shared guard document first so two concurrent demotions conflict instead of both passing the last-admin check", async () => {
    setup({ target: { id: TARGET, role: "ADMIN" } })
    await changeUserRole({ actorId: ACTOR, targetId: TARGET, role: "USER" })
    expect(authTxMock.counter.upsert).toHaveBeenCalledTimes(1)
    const guardOrder = authTxMock.counter.upsert.mock.invocationCallOrder[0]
    expect(guardOrder).toBeLessThan(authTxMock.user.count.mock.invocationCallOrder[0])
    expect(guardOrder).toBeLessThan(authTxMock.user.update.mock.invocationCallOrder[0])
  })

  it("logs ids only (no emails) as a structured entry", async () => {
    setup()
    await changeUserRole({ actorId: ACTOR, targetId: TARGET, role: "ADMIN" })
    expect(console.info).toHaveBeenCalledTimes(1)
    const line = String(vi.mocked(console.info).mock.calls[0].join(" "))
    expect(line).toContain(ACTOR)
    expect(line).toContain(TARGET)
    expect(line).not.toMatch(/@/)
  })
})

describe("changeUserRole: write conflicts", () => {
  const conflict = () => new Prisma.PrismaClientKnownRequestError("conflict", { code: "P2034", clientVersion: "test" })

  it("retries a transaction that lost a write conflict", async () => {
    setup()
    authPrismaMock.$transaction
      .mockRejectedValueOnce(conflict())
      .mockImplementation(async (callback: (tx: typeof authTxMock) => unknown) => callback(authTxMock))
    const result = await changeUserRole({ actorId: ACTOR, targetId: TARGET, role: "ADMIN" })
    expect(result).toEqual({ ok: true, changed: true })
    expect(authPrismaMock.$transaction).toHaveBeenCalledTimes(2)
  })

  it("reports CONFLICT after exhausting the retries", async () => {
    setup()
    authPrismaMock.$transaction.mockRejectedValue(conflict())
    const result = await changeUserRole({ actorId: ACTOR, targetId: TARGET, role: "ADMIN" })
    expect(result).toEqual({ ok: false, code: "CONFLICT" })
  })

  it("propagates unrelated errors", async () => {
    setup()
    authPrismaMock.$transaction.mockRejectedValue(new Error("db down"))
    await expect(changeUserRole({ actorId: ACTOR, targetId: TARGET, role: "ADMIN" })).rejects.toThrow("db down")
  })
})
