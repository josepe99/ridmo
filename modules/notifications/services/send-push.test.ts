import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("web-push", () => ({ sendNotification: vi.fn() }))
vi.mock("./subscriptions", () => ({
  listSubscriptions: vi.fn(),
  removeSubscription: vi.fn(),
}))
vi.mock("./vapid", () => ({ getVapidConfig: vi.fn() }))

import { sendNotification } from "web-push"
import { listSubscriptions, removeSubscription } from "./subscriptions"
import { getVapidConfig } from "./vapid"
import { notifyNewOrder, sendPushToAdmins } from "./send-push"

const vapid = { subject: "mailto:ops@ridmo.test", publicKey: "pub", privateKey: "priv" }
const payload = { title: "Nuevo pedido", body: "RID-000001", url: "/admin/orders/o1", tag: "order-RID-000001" }

const sub = (n: number) => ({ endpoint: `https://push.example/${n}`, p256dh: `p${n}`, auth: `a${n}` })

function pushError(statusCode: number) {
  return Object.assign(new Error(`push failed ${statusCode}`), { statusCode })
}

beforeEach(() => {
  vi.mocked(sendNotification).mockReset().mockResolvedValue({} as never)
  vi.mocked(listSubscriptions).mockReset().mockResolvedValue([])
  vi.mocked(removeSubscription).mockReset().mockResolvedValue(undefined)
  vi.mocked(getVapidConfig).mockReset().mockReturnValue(vapid)
  vi.spyOn(console, "warn").mockImplementation(() => {})
  vi.spyOn(console, "error").mockImplementation(() => {})
})

describe("sendPushToAdmins", () => {
  it("does nothing when VAPID is not configured", async () => {
    vi.mocked(getVapidConfig).mockReturnValue(null)

    await expect(sendPushToAdmins(payload)).resolves.toBe(0)
    expect(listSubscriptions).not.toHaveBeenCalled()
    expect(sendNotification).not.toHaveBeenCalled()
  })

  it("returns 0 and sends nothing when there are zero subscriptions", async () => {
    await expect(sendPushToAdmins(payload)).resolves.toBe(0)
    expect(sendNotification).not.toHaveBeenCalled()
  })

  it("sends the JSON payload to every subscription with TTL and VAPID details", async () => {
    vi.mocked(listSubscriptions).mockResolvedValue([sub(1), sub(2)])

    await expect(sendPushToAdmins(payload)).resolves.toBe(2)

    expect(sendNotification).toHaveBeenCalledTimes(2)
    expect(sendNotification).toHaveBeenCalledWith(
      { endpoint: "https://push.example/1", keys: { p256dh: "p1", auth: "a1" } },
      JSON.stringify(payload),
      { TTL: 86_400, vapidDetails: vapid }
    )
  })

  it("prunes subscriptions the push service reports as gone (404 and 410)", async () => {
    vi.mocked(listSubscriptions).mockResolvedValue([sub(1), sub(2), sub(3)])
    vi.mocked(sendNotification)
      .mockRejectedValueOnce(pushError(404))
      .mockRejectedValueOnce(pushError(410))
      .mockResolvedValueOnce({} as never)

    await expect(sendPushToAdmins(payload)).resolves.toBe(1)

    expect(removeSubscription).toHaveBeenCalledTimes(2)
    expect(removeSubscription).toHaveBeenCalledWith("https://push.example/1")
    expect(removeSubscription).toHaveBeenCalledWith("https://push.example/2")
  })

  it("keeps subscriptions on transient failures (e.g. 500, 429) and does not count them as delivered", async () => {
    vi.mocked(listSubscriptions).mockResolvedValue([sub(1), sub(2)])
    vi.mocked(sendNotification)
      .mockRejectedValueOnce(pushError(500))
      .mockRejectedValueOnce(pushError(429))

    await expect(sendPushToAdmins(payload)).resolves.toBe(0)

    expect(removeSubscription).not.toHaveBeenCalled()
    expect(console.warn).toHaveBeenCalled()
  })

  it("keeps the subscription when the error carries no status code", async () => {
    vi.mocked(listSubscriptions).mockResolvedValue([sub(1)])
    vi.mocked(sendNotification).mockRejectedValue(new Error("network down"))

    await expect(sendPushToAdmins(payload)).resolves.toBe(0)
    expect(removeSubscription).not.toHaveBeenCalled()
  })

  it("one failing subscription does not stop delivery to the others", async () => {
    vi.mocked(listSubscriptions).mockResolvedValue([sub(1), sub(2)])
    vi.mocked(sendNotification).mockRejectedValueOnce(pushError(500)).mockResolvedValueOnce({} as never)

    await expect(sendPushToAdmins(payload)).resolves.toBe(1)
  })

  it("never rejects, even if reading subscriptions blows up", async () => {
    vi.mocked(listSubscriptions).mockRejectedValue(new Error("db down"))

    await expect(sendPushToAdmins(payload)).resolves.toBe(0)
    expect(console.error).toHaveBeenCalled()
  })

  it("never rejects when pruning itself fails", async () => {
    vi.mocked(listSubscriptions).mockResolvedValue([sub(1)])
    vi.mocked(sendNotification).mockRejectedValue(pushError(410))
    vi.mocked(removeSubscription).mockRejectedValue(new Error("db down"))

    await expect(sendPushToAdmins(payload)).resolves.toBe(0)
  })
})

describe("notifyNewOrder", () => {
  it("pushes a new-order payload built from the order", async () => {
    vi.mocked(listSubscriptions).mockResolvedValue([sub(1)])

    await expect(
      notifyNewOrder({ id: "o1", orderNumber: "RID-000001", total: 6_800_000, currency: "PYG" })
    ).resolves.toBe(1)

    const body = JSON.parse(vi.mocked(sendNotification).mock.calls[0][1] as string)
    expect(body).toEqual({
      title: "Nuevo pedido",
      body: "RID-000001 · Gs. 6.800.000",
      url: "/admin/orders/o1",
      tag: "order-RID-000001",
    })
  })
})
