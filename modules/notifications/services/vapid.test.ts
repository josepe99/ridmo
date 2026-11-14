import { afterEach, describe, expect, it, vi } from "vitest"
import { getVapidConfig, getVapidPublicKey } from "./vapid"

const unset = undefined as unknown as string

afterEach(() => vi.unstubAllEnvs())

function configureAll() {
  vi.stubEnv("NEXT_PUBLIC_VAPID_PUBLIC_KEY", "public-key")
  vi.stubEnv("VAPID_PRIVATE_KEY", "private-key")
  vi.stubEnv("VAPID_SUBJECT", "mailto:ops@ridmo.test")
}

describe("getVapidConfig", () => {
  it("returns the configuration when all three variables are set", () => {
    configureAll()

    expect(getVapidConfig()).toEqual({
      publicKey: "public-key",
      privateKey: "private-key",
      subject: "mailto:ops@ridmo.test",
    })
  })

  it.each(["NEXT_PUBLIC_VAPID_PUBLIC_KEY", "VAPID_PRIVATE_KEY", "VAPID_SUBJECT"])(
    "returns null when %s is missing",
    (missing) => {
      configureAll()
      vi.stubEnv(missing, unset)

      expect(getVapidConfig()).toBeNull()
    }
  )

  it("treats empty strings as missing", () => {
    configureAll()
    vi.stubEnv("VAPID_PRIVATE_KEY", "")

    expect(getVapidConfig()).toBeNull()
  })
})

describe("getVapidPublicKey", () => {
  it("returns the public key when push is configured", () => {
    configureAll()

    expect(getVapidPublicKey()).toBe("public-key")
  })

  it("returns null when push is not configured", () => {
    vi.stubEnv("NEXT_PUBLIC_VAPID_PUBLIC_KEY", unset)

    expect(getVapidPublicKey()).toBeNull()
  })
})
