"use server"

import { revalidatePath } from "next/cache"
import { requireAdmin } from "../services/current-user"
import { changeUserRole } from "../services/set-user-role"

export type SetUserRoleResult =
  | { ok: true; changed: boolean }
  | {
      ok: false
      code: "INVALID_INPUT" | "SELF_CHANGE" | "NOT_FOUND" | "FORBIDDEN" | "LAST_ADMIN" | "CONFLICT"
      message: string
    }

const MESSAGES = {
  INVALID_INPUT: "Los datos no son válidos.",
  SELF_CHANGE: "No podés cambiar tu propio rol.",
  NOT_FOUND: "No encontramos al usuario.",
  FORBIDDEN: "No tenés permiso para hacer este cambio.",
  LAST_ADMIN: "No se puede quitar el rol al último administrador.",
  CONFLICT: "Otro cambio se estaba aplicando al mismo tiempo. Intentá de nuevo.",
} as const

/**
 * Admin-only: promotes or demotes a user. The acting admin comes from the session (never
 * from the arguments) and `requireAdmin` re-checks the role in the database, throwing an
 * AuthorizationError for anyone else.
 */
export async function setUserRoleAction(userId: string, role: string): Promise<SetUserRoleResult> {
  const actorId = await requireAdmin()

  const result = await changeUserRole({ actorId, targetId: userId, role })
  if (!result.ok) return { ok: false, code: result.code, message: MESSAGES[result.code] }

  if (result.changed) revalidatePath("/admin/users")
  return result
}
