import "server-only"

import { signIn } from "../auth"

export type CredentialsSignInOutcome = "ok" | "rate_limited" | "failed"

/**
 * Signs in with email + password through Auth.js (which sets the session cookie) without
 * letting it redirect. Failures surface in one of two shapes depending on the Auth.js code
 * path: a returned url carrying `error` / `code` query parameters, or a thrown
 * `CredentialsSignin` whose `code` is the same value. Both are handled.
 */
export async function signInWithCredentials(
  email: string,
  password: string,
  redirectTo: string
): Promise<CredentialsSignInOutcome> {
  try {
    const result = await signIn("credentials", { email, password, redirect: false, redirectTo })
    if (typeof result !== "string") return "ok"

    const params = new URL(result, "http://localhost").searchParams
    if (!params.has("error")) return "ok"
    return params.get("code") === "too_many_attempts" ? "rate_limited" : "failed"
  } catch (error) {
    // Only the lockout code is distinguishable; everything else is a generic failure and the
    // reason is never surfaced (it may mention infrastructure).
    const code = (error as { code?: unknown } | null)?.code
    return code === "too_many_attempts" ? "rate_limited" : "failed"
  }
}
