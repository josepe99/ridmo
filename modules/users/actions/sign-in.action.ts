"use server"

import { signIn } from "../auth"
import { GENERIC_SIGN_IN_ERROR, authErrorMessage } from "../domain/auth-errors"
import { sanitizeCallbackUrl } from "../domain/callback-url"
import { loginInputSchema } from "../domain/schemas"
import { signInWithCredentials } from "../services/credentials-sign-in"

export type SignInActionResult =
  | { ok: true; redirectTo: string }
  | { ok: false; code: "INVALID_CREDENTIALS" | "RATE_LIMITED"; message: string }

/**
 * Email + password sign-in. The target url is sanitized here, on the server, so the client
 * can only be sent to a same-origin path whatever it passes as `callbackUrl`.
 */
export async function signInAction(input: unknown, callbackUrl?: unknown): Promise<SignInActionResult> {
  const redirectTo = sanitizeCallbackUrl(callbackUrl)

  const parsed = loginInputSchema.safeParse(input)
  if (!parsed.success) return { ok: false, code: "INVALID_CREDENTIALS", message: GENERIC_SIGN_IN_ERROR }

  const outcome = await signInWithCredentials(parsed.data.email, parsed.data.password, redirectTo)
  if (outcome === "ok") return { ok: true, redirectTo }
  if (outcome === "rate_limited") {
    return { ok: false, code: "RATE_LIMITED", message: authErrorMessage("too_many_attempts") }
  }
  return { ok: false, code: "INVALID_CREDENTIALS", message: GENERIC_SIGN_IN_ERROR }
}

/** Starts the Google OAuth flow (redirects to Google). Only reachable when Google is configured. */
export async function googleSignInAction(callbackUrl?: unknown): Promise<void> {
  await signIn("google", { redirectTo: sanitizeCallbackUrl(callbackUrl) })
}
