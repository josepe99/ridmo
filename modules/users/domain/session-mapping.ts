import type { JWT } from "next-auth/jwt"
import type { Session } from "next-auth"
import { toRole } from "./roles"

/**
 * jwt callback. Copies ONLY the user id and a validated role from the user that is signing
 * in; nothing else from the user object (hashes, provider tokens...) ever reaches the cookie.
 * On later calls (no `user`) the token is kept, with its role re-validated.
 *
 * The role in the token is a hint for the UI. Authorization decisions re-read it from the
 * database (see services/current-user.ts).
 */
export function applyUserToToken(token: JWT, user?: { id?: string | null; role?: unknown } | null): JWT {
  if (user) {
    if (user.id) token.id = user.id
    token.role = toRole(user.role)
    return token
  }
  if (token.role !== undefined) token.role = toRole(token.role)
  return token
}

/** session callback: exposes id and role to the client, from the token only. */
export function buildSession(session: Session, token: JWT): Session & { user: { id: string; role: "USER" | "ADMIN" } } {
  return {
    ...session,
    user: {
      ...session.user,
      id: (typeof token.id === "string" && token.id) || token.sub || "",
      role: toRole(token.role),
    },
  }
}
