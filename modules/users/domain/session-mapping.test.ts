import { describe, expect, it } from "vitest"
import { applyUserToToken, buildSession } from "./session-mapping"

describe("applyUserToToken (jwt callback)", () => {
  it("copies only the id and a valid role from the signing-in user", () => {
    const token = applyUserToToken(
      { sub: "u1", email: "a@b.co" },
      {
        id: "u1",
        role: "ADMIN",
        name: "Ana",
        email: "a@b.co",
        passwordHash: "$argon2id$secret",
        accessToken: "oauth-secret",
      } as never
    )

    expect(token).toMatchObject({ id: "u1", role: "ADMIN" })
    expect(JSON.stringify(token)).not.toMatch(/argon2|secret|passwordHash|accessToken/)
  })

  it("defaults to USER when the role is missing or not a known role", () => {
    for (const role of [undefined, null, "SUPERUSER", "admin", 1, {}]) {
      expect(applyUserToToken({}, { id: "u1", role } as never).role).toBe("USER")
    }
  })

  it("leaves an existing token untouched on later calls (no user)", () => {
    const token = { sub: "u1", id: "u1", role: "ADMIN" as const }
    expect(applyUserToToken(token, undefined)).toEqual(token)
  })

  it("never lets a client-controlled token field escalate the role on later calls", () => {
    const token = { sub: "u1", id: "u1", role: "USER" as const }
    expect(applyUserToToken(token, undefined).role).toBe("USER")
  })

  it("normalises an unknown role already present in a stale token to USER", () => {
    expect(applyUserToToken({ sub: "u1", id: "u1", role: "ROOT" } as never, undefined).role).toBe("USER")
  })
})

describe("buildSession (session callback)", () => {
  const session = { user: { name: "Ana", email: "a@b.co", image: null }, expires: "2099-01-01" }

  it("exposes the id and role for UI hints", () => {
    const result = buildSession(session as never, { sub: "u1", id: "u1", role: "ADMIN" })
    expect(result.user).toMatchObject({ id: "u1", role: "ADMIN", email: "a@b.co" })
  })

  it("falls back to the token subject when the custom id is missing", () => {
    expect(buildSession(session as never, { sub: "u9" }).user.id).toBe("u9")
  })

  it("never leaks hashes or provider tokens even if the token carries them", () => {
    const result = buildSession(
      session as never,
      { sub: "u1", id: "u1", role: "USER", passwordHash: "$argon2id$x", access_token: "tok" } as never
    )
    expect(JSON.stringify(result)).not.toMatch(/argon2|passwordHash|access_token|tok"/)
  })

  it("defaults a bad role to USER", () => {
    expect(buildSession(session as never, { sub: "u1", role: "HACKER" } as never).user.role).toBe("USER")
  })
})
