import { beforeEach, describe, expect, it, vi } from "vitest"
import { prismaMock, resetPrismaMock } from "@/tests/mocks/prisma"

vi.mock("@/shared/lib/prisma", async () => (await import("@/tests/mocks/prisma")).prismaModule)

import { nextSequence } from "./sequence"

beforeEach(() => resetPrismaMock())

describe("nextSequence", () => {
  it("increments the named counter atomically with an upsert and returns the new value", async () => {
    prismaMock.$runCommandRaw.mockResolvedValue({ value: { _id: "order", seq: 7 } })

    await expect(nextSequence("order")).resolves.toBe(7)

    expect(prismaMock.$runCommandRaw).toHaveBeenCalledWith({
      findAndModify: "counters",
      query: { _id: "order" },
      update: { $inc: { seq: 1 } },
      upsert: true,
      new: true,
    })
  })

  it("retries when two callers create the counter at the same instant (duplicate key)", async () => {
    prismaMock.$runCommandRaw
      .mockRejectedValueOnce(new Error("E11000 duplicate key error"))
      .mockResolvedValueOnce({ value: { seq: 1 } })

    await expect(nextSequence("order")).resolves.toBe(1)
    expect(prismaMock.$runCommandRaw).toHaveBeenCalledTimes(2)
  })

  it("gives up after three duplicate-key failures with the last error", async () => {
    prismaMock.$runCommandRaw.mockRejectedValue(new Error("duplicate key"))

    await expect(nextSequence("order")).rejects.toThrow("duplicate key")
    expect(prismaMock.$runCommandRaw).toHaveBeenCalledTimes(3)
  })

  it("does not retry other errors", async () => {
    prismaMock.$runCommandRaw.mockRejectedValue(new Error("connection reset"))

    await expect(nextSequence("order")).rejects.toThrow("connection reset")
    expect(prismaMock.$runCommandRaw).toHaveBeenCalledTimes(1)
  })

  it.each([
    ["null", null],
    ["no value", {}],
    ["value without seq", { value: {} }],
    ["non numeric seq", { value: { seq: "3" } }],
    ["non integer seq", { value: { seq: 1.5 } }],
  ])("rejects an unexpected findAndModify response: %s", async (_label, response) => {
    prismaMock.$runCommandRaw.mockResolvedValue(response)

    await expect(nextSequence("order")).rejects.toThrow("Unexpected findAndModify response")
  })
})
