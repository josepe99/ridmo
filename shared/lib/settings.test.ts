import { afterEach, describe, expect, it, vi } from "vitest"

const unset = undefined as unknown as string

const REQUIRED_NON_AUTH = [
  "DATABASE_URL",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
]

async function loadSettings() {
  vi.resetModules()
  return await import("./settings")
}

afterEach(() => vi.unstubAllEnvs())

describe("settings defaults", () => {
  it("falls back to local defaults for optional values", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", unset)
    vi.stubEnv("WHATSAPP_PHONE_NUMBER", unset)
    vi.stubEnv("NEXT_PUBLIC_WHATSAPP_PHONE_NUMBER", unset)

    const settings = await loadSettings()

    expect(settings.NEXT_PUBLIC_APP_URL).toBe("http://localhost:3000")
    expect(settings.WHATSAPP_PHONE_NUMBER).toBe("")
    expect(settings.NEXT_PUBLIC_WHATSAPP_PHONE_NUMBER).toBe("")
  })

  it("reads configured values from the environment", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://ridmo.test")
    vi.stubEnv("DATABASE_URL", "mongodb://localhost:27017/test")
    vi.stubEnv("CLOUDINARY_CLOUD_NAME", "cloud")
    vi.stubEnv("CLOUDINARY_API_KEY", "key")
    vi.stubEnv("CLOUDINARY_API_SECRET", "secret")

    const settings = await loadSettings()

    expect(settings.NEXT_PUBLIC_APP_URL).toBe("https://ridmo.test")
    expect(settings.DATABASE_URL).toBe("mongodb://localhost:27017/test")
    expect(settings.CLOUDINARY_CLOUD_NAME).toBe("cloud")
    expect(settings.CLOUDINARY_API_KEY).toBe("key")
    expect(settings.CLOUDINARY_API_SECRET).toBe("secret")
  })

  it("defaults NODE_ENV to development when unset", async () => {
    vi.stubEnv("NODE_ENV", unset)

    const settings = await loadSettings()

    expect(settings.NODE_ENV).toBe("development")
  })
})

describe("validateEnvironmentVariables", () => {
  it("names every missing non-auth variable in the error", async () => {
    vi.stubEnv("NODE_ENV", "test")
    for (const name of REQUIRED_NON_AUTH) vi.stubEnv(name, unset)
    const { validateEnvironmentVariables } = await loadSettings()

    expect(() => validateEnvironmentVariables()).toThrow(
      /Missing required environment variables:[^]*DATABASE_URL[^]*CLOUDINARY_CLOUD_NAME[^]*CLOUDINARY_API_KEY[^]*CLOUDINARY_API_SECRET/
    )
  })

  it("does not import-time validate outside development", async () => {
    vi.stubEnv("NODE_ENV", "production")
    for (const name of REQUIRED_NON_AUTH) vi.stubEnv(name, unset)

    await expect(loadSettings()).resolves.toBeDefined()
  })

  it("validates at import time in development and fails fast when variables are missing", async () => {
    vi.stubEnv("NODE_ENV", "development")
    for (const name of REQUIRED_NON_AUTH) vi.stubEnv(name, unset)

    await expect(loadSettings()).rejects.toThrow(/Missing required environment variables/)
  })
})
