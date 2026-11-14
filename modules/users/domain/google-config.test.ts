import { describe, expect, it } from "vitest"
import { isGoogleConfigured } from "./google-config"

describe("isGoogleConfigured", () => {
  it("is true only when both id and secret are present", () => {
    expect(isGoogleConfigured({ AUTH_GOOGLE_ID: "id", AUTH_GOOGLE_SECRET: "secret" })).toBe(true)
  })

  it.each([
    [{}],
    [{ AUTH_GOOGLE_ID: "id" }],
    [{ AUTH_GOOGLE_SECRET: "secret" }],
    [{ AUTH_GOOGLE_ID: "", AUTH_GOOGLE_SECRET: "" }],
    [{ AUTH_GOOGLE_ID: "  ", AUTH_GOOGLE_SECRET: "secret" }],
  ])("is false for %j", (env) => {
    expect(isGoogleConfigured(env)).toBe(false)
  })
})
