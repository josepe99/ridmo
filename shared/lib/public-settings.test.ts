import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const unset = undefined as unknown as string

async function loadPhone() {
  vi.resetModules()
  return (await import("./public-settings")).WHATSAPP_CONTACT_PHONE_NUMBER
}

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_WHATSAPP_PHONE_NUMBER", unset)
  vi.stubEnv("WHATSAPP_PHONE_NUMBER", unset)
})

afterEach(() => vi.unstubAllEnvs())

describe("WHATSAPP_CONTACT_PHONE_NUMBER", () => {
  it("prefers the public variable", async () => {
    vi.stubEnv("NEXT_PUBLIC_WHATSAPP_PHONE_NUMBER", "595981111111")
    vi.stubEnv("WHATSAPP_PHONE_NUMBER", "595982222222")

    await expect(loadPhone()).resolves.toBe("595981111111")
  })

  it("falls back to the server-side variable", async () => {
    vi.stubEnv("WHATSAPP_PHONE_NUMBER", "595982222222")

    await expect(loadPhone()).resolves.toBe("595982222222")
  })

  it("is an empty string when neither is set", async () => {
    await expect(loadPhone()).resolves.toBe("")
  })

  it("treats an empty public variable as unset", async () => {
    vi.stubEnv("NEXT_PUBLIC_WHATSAPP_PHONE_NUMBER", "")
    vi.stubEnv("WHATSAPP_PHONE_NUMBER", "595982222222")

    await expect(loadPhone()).resolves.toBe("595982222222")
  })
})
