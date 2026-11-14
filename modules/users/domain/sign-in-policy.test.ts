import { describe, expect, it } from "vitest"
import { evaluateSignIn, GOOGLE_UNVERIFIED_EMAIL_REDIRECT } from "./sign-in-policy"

describe("evaluateSignIn (signIn callback)", () => {
  it("accepts a Google account whose email is verified", () => {
    expect(
      evaluateSignIn({ provider: "google", profile: { email: "a@b.co", email_verified: true } })
    ).toBe(true)
  })

  it.each([
    ["false", { email: "a@b.co", email_verified: false }],
    ["missing", { email: "a@b.co" }],
    ["the string 'true'", { email: "a@b.co", email_verified: "true" }],
    ["1", { email: "a@b.co", email_verified: 1 }],
  ])("rejects a Google account when email_verified is %s", (_label, profile) => {
    expect(evaluateSignIn({ provider: "google", profile })).toBe(GOOGLE_UNVERIFIED_EMAIL_REDIRECT)
  })

  it("rejects a Google account without profile or email", () => {
    expect(evaluateSignIn({ provider: "google", profile: undefined })).toBe(GOOGLE_UNVERIFIED_EMAIL_REDIRECT)
    expect(evaluateSignIn({ provider: "google", profile: { email_verified: true } })).toBe(GOOGLE_UNVERIFIED_EMAIL_REDIRECT)
  })

  it("denies a disabled user whichever provider they use", () => {
    const disabledAt = new Date()
    expect(
      evaluateSignIn({ provider: "google", profile: { email: "a@b.co", email_verified: true }, user: { disabledAt } })
    ).toBe(false)
    expect(evaluateSignIn({ provider: "credentials", profile: undefined, user: { disabledAt } })).toBe(false)
  })

  it("lets credentials through (authorize already vetted them)", () => {
    expect(evaluateSignIn({ provider: "credentials", profile: undefined })).toBe(true)
  })

  it("denies any provider that is not explicitly supported", () => {
    expect(evaluateSignIn({ provider: "github", profile: { email: "a@b.co", email_verified: true } })).toBe(false)
    expect(evaluateSignIn({ provider: undefined, profile: undefined })).toBe(false)
  })

  it("points the unverified redirect at the sign-in page with a known error code", () => {
    expect(GOOGLE_UNVERIFIED_EMAIL_REDIRECT).toBe("/sign-in?error=GoogleEmailNotVerified")
  })
})
