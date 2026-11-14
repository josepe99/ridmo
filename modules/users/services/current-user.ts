import "server-only"

import { prisma } from "@/shared/lib/prisma"
import { OBJECT_ID_PATTERN, toRole, type Role } from "../domain/roles"
import { auth } from "../auth"
import { AuthorizationError } from "../errors"

export type CurrentUser = {
  id: string
  name: string | null
  email: string
  image: string | null
  role: Role
}

/**
 * The signed-in user as the DATABASE sees them right now (null for guests, deleted or
 * disabled users). The JWT is only used to learn WHICH user is asking; the role is always
 * re-read, so a promotion or demotion takes effect on the very next call.
 */
async function loadSessionUser(): Promise<{ user: CurrentUser; disabled: boolean } | null> {
  const session = await auth()
  const id: unknown = session?.user?.id
  // The id comes from a signed token, but validate the shape anyway before it reaches a query.
  if (typeof id !== "string" || !OBJECT_ID_PATTERN.test(id)) return null

  const row = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, image: true, role: true, disabledAt: true },
  })
  if (!row) return null

  return {
    user: { id: row.id, name: row.name, email: row.email, image: row.image, role: toRole(row.role) },
    disabled: row.disabledAt != null,
  }
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const loaded = await loadSessionUser()
  return loaded && !loaded.disabled ? loaded.user : null
}

/** Any signed-in user. Throws `AuthorizationError("UNAUTHENTICATED")` otherwise. */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser()
  if (!user) throw new AuthorizationError("UNAUTHENTICATED")
  return user
}

/**
 * Single admin guard for server actions and route handlers. Returns the admin's user id.
 *
 *  - no session / deleted user  -> `AuthorizationError("UNAUTHENTICATED")` (401)
 *  - disabled or not ADMIN in the database -> `AuthorizationError("FORBIDDEN")` (403)
 *
 * It throws instead of redirecting so API callers get a proper status code; pages use
 * `requireAdminPage` (server.ts) which converts the error into a redirect.
 */
export async function requireAdmin(): Promise<string> {
  const loaded = await loadSessionUser()
  if (!loaded) throw new AuthorizationError("UNAUTHENTICATED")
  if (loaded.disabled || loaded.user.role !== "ADMIN") throw new AuthorizationError("FORBIDDEN")
  return loaded.user.id
}
