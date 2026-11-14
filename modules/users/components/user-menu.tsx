"use client"

import Link from "next/link"
import { LogOut, Settings, User } from "lucide-react"
import { signOut, useSession } from "next-auth/react"
import { Button } from "@/shared/ui/button"

function initialOf(name?: string | null, email?: string | null): string {
  return (name?.trim()?.[0] ?? email?.trim()?.[0] ?? "?").toUpperCase()
}

/**
 * Account area of the main navigation. Reads the session on the client (SessionProvider), so
 * the storefront pages stay statically renderable. The "Admin" link is only a hint taken from
 * the token; the pages behind it re-check the role in the database.
 */
export function UserMenu() {
  const { data: session, status } = useSession()

  if (status === "loading") {
    return <span aria-hidden="true" className="inline-block size-9" />
  }

  if (!session?.user) {
    return (
      <Link href="/sign-in">
        <Button variant="ghost" size="icon" className="rounded-full">
          <User className="h-5 w-5" />
          <span className="sr-only">Iniciar sesión</span>
        </Button>
      </Link>
    )
  }

  const { name, email, role } = session.user

  return (
    <div className="flex items-center gap-1">
      {role === "ADMIN" ? (
        <Link href="/admin">
          <Button variant="ghost" size="icon" className="rounded-full" title="Panel de administración">
            <Settings className="h-5 w-5" />
            <span className="sr-only">Administración</span>
          </Button>
        </Link>
      ) : null}
      <Link
        href="/profile"
        title="Mi cuenta"
        className="flex size-8 items-center justify-center rounded-full bg-black text-xs font-semibold text-white transition-opacity duration-200 hover:opacity-80"
      >
        <span aria-hidden="true">{initialOf(name, email)}</span>
        <span className="sr-only">Mi cuenta</span>
      </Link>
      <Button
        variant="ghost"
        size="icon"
        className="rounded-full"
        title="Cerrar sesión"
        onClick={() => signOut({ callbackUrl: "/" })}
      >
        <LogOut className="h-4 w-4" />
        <span className="sr-only">Cerrar sesión</span>
      </Button>
    </div>
  )
}
