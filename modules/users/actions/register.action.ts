"use server"

import { headers } from "next/headers"
import { authErrorMessage } from "../domain/auth-errors"
import { sanitizeCallbackUrl } from "../domain/callback-url"
import { getClientIp } from "../domain/client-ip"
import { registerUser } from "../services/register-user"
import { signInWithCredentials } from "../services/credentials-sign-in"

export type RegisterActionResult =
  | { ok: true; redirectTo: string }
  | { ok: false; code: "VALIDATION"; message: string; fieldErrors: Record<string, string> }
  | { ok: false; code: "RATE_LIMITED" | "REGISTRATION_FAILED"; message: string }

const REGISTRATION_FAILED_MESSAGE =
  "No pudimos crear la cuenta con esos datos. Si ya tenés una, iniciá sesión."

/**
 * Creates an account (always role USER, see registerUser) and signs the new user in.
 * If the automatic sign-in fails the account still exists, so we send them to /sign-in.
 */
export async function registerAction(input: unknown, callbackUrl?: unknown): Promise<RegisterActionResult> {
  const redirectTo = sanitizeCallbackUrl(callbackUrl)

  let result
  try {
    result = await registerUser(input, { ip: getClientIp(await headers()) })
  } catch (error) {
    console.error("[auth] registration failed:", error instanceof Error ? error.name : "unknown")
    return { ok: false, code: "REGISTRATION_FAILED", message: REGISTRATION_FAILED_MESSAGE }
  }

  if (!result.ok) {
    if (result.code === "VALIDATION") {
      return {
        ok: false,
        code: "VALIDATION",
        message: "Revisá los datos ingresados.",
        fieldErrors: result.fieldErrors,
      }
    }
    if (result.code === "RATE_LIMITED") {
      return { ok: false, code: "RATE_LIMITED", message: authErrorMessage("too_many_attempts") }
    }
    return { ok: false, code: "REGISTRATION_FAILED", message: REGISTRATION_FAILED_MESSAGE }
  }

  const password = (input as { password: string }).password
  const outcome = await signInWithCredentials(result.user.email, password, redirectTo)
  return { ok: true, redirectTo: outcome === "ok" ? redirectTo : "/sign-in" }
}
