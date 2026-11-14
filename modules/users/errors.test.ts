import { describe, expect, it } from "vitest"
import { AuthorizationError, authorizationErrorResponse, isAuthorizationError } from "./errors"

describe("AuthorizationError", () => {
  it("carries a code and a safe message", () => {
    const error = new AuthorizationError("FORBIDDEN")
    expect(error).toBeInstanceOf(Error)
    expect(error.code).toBe("FORBIDDEN")
    expect(error.name).toBe("AuthorizationError")
    expect(error.message).toBe("FORBIDDEN")
  })

  it("is recognised by isAuthorizationError, including a look-alike from another module instance", () => {
    expect(isAuthorizationError(new AuthorizationError("UNAUTHENTICATED"))).toBe(true)
    const lookalike = Object.assign(new Error("x"), { name: "AuthorizationError", code: "FORBIDDEN" })
    expect(isAuthorizationError(lookalike)).toBe(true)
    expect(isAuthorizationError(new Error("x"))).toBe(false)
    expect(isAuthorizationError(null)).toBe(false)
    expect(isAuthorizationError("FORBIDDEN")).toBe(false)
  })
})

describe("authorizationErrorResponse", () => {
  it("maps UNAUTHENTICATED to a 401 JSON response", async () => {
    const response = authorizationErrorResponse(new AuthorizationError("UNAUTHENTICATED"))
    expect(response?.status).toBe(401)
    expect(await response?.json()).toEqual({ error: "Unauthorized" })
  })

  it("maps FORBIDDEN to a 403 JSON response", async () => {
    const response = authorizationErrorResponse(new AuthorizationError("FORBIDDEN"))
    expect(response?.status).toBe(403)
    expect(await response?.json()).toEqual({ error: "Forbidden" })
  })

  it("returns null for anything that is not an authorization error so callers can answer 500", () => {
    expect(authorizationErrorResponse(new Error("db down"))).toBeNull()
    expect(authorizationErrorResponse(undefined)).toBeNull()
  })
})
