import { beforeEach, describe, expect, it, vi } from "vitest"

// The admin gate is thinly mocked at the module boundary; its own behavior is not under test here.
vi.mock("@/modules/users/server", () => ({ requireAdmin: vi.fn(async () => "admin_1") }))
vi.mock("../services/subscriptions", () => ({ saveSubscription: vi.fn() }))

import { saveSubscription } from "../services/subscriptions"
import { savePushSubscriptionAction } from "./save-subscription.action"

const valid = {
  endpoint: "https://fcm.googleapis.com/fcm/send/abc",
  keys: { p256dh: "p256dh-key", auth: "auth-key" },
}

beforeEach(() => {
  vi.mocked(saveSubscription).mockReset().mockResolvedValue(undefined)
  vi.spyOn(console, "error").mockImplementation(() => {})
})

describe("savePushSubscriptionAction", () => {
  it("stores a valid subscription for the current user", async () => {
    await expect(savePushSubscriptionAction(valid)).resolves.toEqual({ ok: true })

    expect(saveSubscription).toHaveBeenCalledWith("admin_1", {
      endpoint: valid.endpoint,
      p256dh: "p256dh-key",
      auth: "auth-key",
    })
  })

  it.each([
    ["null", null],
    ["a non-https endpoint", { ...valid, endpoint: "http://insecure.example/x" }],
    ["a malformed endpoint", { ...valid, endpoint: "not a url" }],
    ["an endpoint over 2048 chars", { ...valid, endpoint: `https://x.example/${"a".repeat(2050)}` }],
    ["missing keys", { endpoint: valid.endpoint }],
    ["an empty p256dh", { ...valid, keys: { ...valid.keys, p256dh: "" } }],
    ["an over-long auth", { ...valid, keys: { ...valid.keys, auth: "a".repeat(257) } }],
  ])("rejects %s without saving", async (_label, input) => {
    await expect(savePushSubscriptionAction(input)).resolves.toEqual({
      ok: false,
      error: "Suscripción inválida",
    })
    expect(saveSubscription).not.toHaveBeenCalled()
  })

  it("reports a friendly error when persisting fails", async () => {
    vi.mocked(saveSubscription).mockRejectedValue(new Error("db down"))

    await expect(savePushSubscriptionAction(valid)).resolves.toEqual({
      ok: false,
      error: "No se pudo guardar la suscripción",
    })
  })
})
