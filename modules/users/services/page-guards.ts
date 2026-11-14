import "server-only"

import { redirect } from "next/navigation"
import { sanitizeCallbackUrl } from "../domain/callback-url"
import { isAuthorizationError } from "../errors"
import { requireAdmin, requireUser, type CurrentUser } from "./current-user"

/**
 * Admin guard for server-rendered pages and layouts: the same database-authoritative check
 * as `requireAdmin`, but a refusal becomes a redirect (anonymous -> sign-in, signed-in
 * non-admin -> storefront). Returns the admin's user id.
 */
export async function requireAdminPage(): Promise<string> {
  try {
    return await requireAdmin()
  } catch (error) {
    if (isAuthorizationError(error)) redirect(error.code === "UNAUTHENTICATED" ? "/sign-in" : "/")
    throw error
  }
}

/** Signed-in guard for pages. Guests go to sign-in and come back to `returnTo` afterwards. */
export async function requireUserPage(returnTo = "/"): Promise<CurrentUser> {
  try {
    return await requireUser()
  } catch (error) {
    if (isAuthorizationError(error)) {
      const safe = sanitizeCallbackUrl(returnTo)
      redirect(safe === "/" ? "/sign-in" : `/sign-in?callbackUrl=${encodeURIComponent(safe)}`)
    }
    throw error
  }
}
