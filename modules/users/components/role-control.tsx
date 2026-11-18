"use client"

import { useState, useTransition } from "react"
import { setUserRoleAction } from "../actions/set-user-role.action"
import type { Role } from "../domain/roles"

type RoleControlProps = {
  userId: string
  role: Role
  /** The signed-in admin's own row: the server refuses self changes, so the button is off. */
  isSelf: boolean
}

/** Promote / demote button for one row of the admin users table. */
export function RoleControl({ userId, role, isSelf }: RoleControlProps) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const nextRole: Role = role === "ADMIN" ? "USER" : "ADMIN"
  const label = role === "ADMIN" ? "Quitar administrador" : "Hacer administrador"

  const change = () => {
    const question =
      nextRole === "ADMIN"
        ? "¿Dar acceso de administrador a este usuario?"
        : "¿Quitar el acceso de administrador a este usuario?"
    if (!window.confirm(question)) return

    setError(null)
    startTransition(async () => {
      try {
        const result = await setUserRoleAction(userId, nextRole)
        if (!result.ok) setError(result.message)
      } catch {
        setError("No se pudo cambiar el rol. Recargá la página e intentá de nuevo.")
      }
    })
  }

  return (
    <div>
      <button
        type="button"
        onClick={change}
        disabled={isSelf || pending}
        title={isSelf ? "No podés cambiar tu propio rol" : undefined}
        className="min-h-10 w-full border border-neutral-300 px-3 py-1.5 text-[10px] md:min-h-0 md:w-auto font-semibold uppercase tracking-label text-neutral-900 transition-colors duration-200 hover:border-black disabled:cursor-not-allowed disabled:opacity-40"
      >
        {label}
      </button>
      {error ? (
        <p role="alert" className="mt-2 text-xs font-medium text-neutral-900">
          {error}
        </p>
      ) : null}
    </div>
  )
}
