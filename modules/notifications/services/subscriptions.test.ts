import { beforeEach, describe, expect, it, vi } from "vitest"
import { prismaMock, resetPrismaMock } from "@/tests/mocks/prisma"

vi.mock("@/shared/lib/prisma", async () => (await import("@/tests/mocks/prisma")).prismaModule)

import { listSubscriptions, removeSubscription, saveSubscription } from "./subscriptions"

const subscription = { endpoint: "https://push.example/1", p256dh: "p", auth: "a" }

beforeEach(() => resetPrismaMock())

describe("saveSubscription", () => {
  it("upserts by endpoint so re-subscribing the same browser never duplicates it", async () => {
    await saveSubscription("user_1", subscription)

    expect(prismaMock.pushSubscription.upsert).toHaveBeenCalledWith({
      where: { endpoint: "https://push.example/1" },
      create: { ...subscription, userId: "user_1" },
      update: { p256dh: "p", auth: "a", userId: "user_1" },
    })
  })
})

describe("listSubscriptions", () => {
  it("selects only the fields needed to push", async () => {
    prismaMock.pushSubscription.findMany.mockResolvedValue([subscription])

    await expect(listSubscriptions()).resolves.toEqual([subscription])
    expect(prismaMock.pushSubscription.findMany).toHaveBeenCalledWith({
      select: { endpoint: true, p256dh: true, auth: true },
    })
  })
})

describe("removeSubscription", () => {
  it("deletes by endpoint without failing when it is already gone", async () => {
    prismaMock.pushSubscription.deleteMany.mockResolvedValue({ count: 0 })

    await expect(removeSubscription("https://push.example/1")).resolves.toBeUndefined()
    expect(prismaMock.pushSubscription.deleteMany).toHaveBeenCalledWith({
      where: { endpoint: "https://push.example/1" },
    })
  })
})
