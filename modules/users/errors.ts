import { NextResponse } from "next/server"

export type AuthorizationErrorCode = "UNAUTHENTICATED" | "FORBIDDEN"

/**
 * Thrown by the server-side guards. Pages turn it into a redirect, route handlers into a
 * 401/403 JSON response (`authorizationErrorResponse`), server actions let it propagate.
 *
 * This file has no `server-only` import so route handlers and tests can use it without
 * pulling the whole auth stack.
 */
export class AuthorizationError extends Error {
  readonly code: AuthorizationErrorCode

  constructor(code: AuthorizationErrorCode) {
    super(code)
    this.name = "AuthorizationError"
    this.code = code
  }
}

/** Structural check, so it also works across duplicated module instances (bundler/HMR). */
export function isAuthorizationError(error: unknown): error is AuthorizationError {
  return (
    error instanceof Error &&
    error.name === "AuthorizationError" &&
    ((error as AuthorizationError).code === "UNAUTHENTICATED" || (error as AuthorizationError).code === "FORBIDDEN")
  )
}

/** 401/403 JSON response for an authorization error, or null for any other error. */
export function authorizationErrorResponse(error: unknown): NextResponse | null {
  if (!isAuthorizationError(error)) return null
  return error.code === "UNAUTHENTICATED"
    ? NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    : NextResponse.json({ error: "Forbidden" }, { status: 403 })
}
