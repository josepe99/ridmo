import { afterEach, describe, expect, it, vi } from "vitest"

const unset = undefined as unknown as string

const REQUIRED_NON_AUTH = ["DATABASE_URL"]

const S3_ENV = {
  S3_ENDPOINT: "http://minio:9000",
  S3_REGION: "us-east-1",
  S3_BUCKET: "ridmo-media",
  S3_ACCESS_KEY_ID: "key",
  S3_SECRET_ACCESS_KEY: "secret",
  S3_FORCE_PATH_STYLE: "true",
  S3_PUBLIC_URL: "https://media.ridmo.test/ridmo-media/",
}

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

    const settings = await loadSettings()

    expect(settings.NEXT_PUBLIC_APP_URL).toBe("https://ridmo.test")
    expect(settings.DATABASE_URL).toBe("mongodb://localhost:27017/test")
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
      /Missing required environment variables:[^]*DATABASE_URL/
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

describe("getS3Config", () => {
  it("reads the S3 settings lazily and strips the trailing slash of the public URL", async () => {
    const { getS3Config } = await loadSettings()
    for (const [name, value] of Object.entries(S3_ENV)) vi.stubEnv(name, value)

    expect(getS3Config()).toEqual({
      endpoint: "http://minio:9000",
      region: "us-east-1",
      bucket: "ridmo-media",
      accessKeyId: "key",
      secretAccessKey: "secret",
      forcePathStyle: true,
      publicUrl: "https://media.ridmo.test/ridmo-media",
    })
  })

  it("defaults the region and path style when they are not set", async () => {
    const { getS3Config } = await loadSettings()
    for (const [name, value] of Object.entries(S3_ENV)) vi.stubEnv(name, value)
    vi.stubEnv("S3_REGION", unset)
    vi.stubEnv("S3_FORCE_PATH_STYLE", unset)

    expect(getS3Config()).toMatchObject({ region: "us-east-1", forcePathStyle: true })
  })

  it("does not fail on import when S3 is not configured", async () => {
    vi.stubEnv("NODE_ENV", "development")
    vi.stubEnv("DATABASE_URL", "mongodb://localhost:27017/test")
    vi.stubEnv("AUTH_SECRET", "secret")
    for (const name of Object.keys(S3_ENV)) vi.stubEnv(name, unset)

    await expect(loadSettings()).resolves.toBeDefined()
  })

  it("names every missing S3 variable in the error", async () => {
    const { getS3Config } = await loadSettings()
    for (const name of Object.keys(S3_ENV)) vi.stubEnv(name, unset)

    expect(() => getS3Config()).toThrow(
      /Missing required S3 environment variables:[^]*S3_ENDPOINT[^]*S3_BUCKET[^]*S3_ACCESS_KEY_ID[^]*S3_SECRET_ACCESS_KEY[^]*S3_PUBLIC_URL/
    )
  })
})
