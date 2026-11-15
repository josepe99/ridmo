"use client"

import Link from "next/link"
import * as DropdownMenu from "@radix-ui/react-dropdown-menu"
import { LogOut, Settings, User } from "lucide-react"
import { signOut, useSession } from "next-auth/react"
import { Button } from "@/shared/ui/button"

function initialOf(name?: string | null, email?: string | null): string {
  return (name?.trim()?.[0] ?? email?.trim()?.[0] ?? "?").toUpperCase()
}

const itemClassName =
  "flex w-full cursor-pointer select-none items-center gap-3 px-4 py-2.5 text-sm text-black outline-none transition-colors data-[highlighted]:bg-black/5"

/**
 * Account area of the main navigation. Reads the session on the client (SessionProvider), so
 * the storefront pages stay statically renderable. Signed-in users get an avatar that opens a
 * menu with their profile, the admin panel and sign-out. The admin entry is only a hint taken
 * from the token; the pages behind it re-check the role in the database.
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
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          title="Mi cuenta"
          className="flex size-8 items-center justify-center rounded-full bg-black text-xs font-semibold text-white outline-none transition-opacity duration-200 hover:opacity-80 focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 data-[state=open]:opacity-80"
        >
          <span aria-hidden="true">{initialOf(name, email)}</span>
          <span className="sr-only">Mi cuenta</span>
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        {/* z-[60]: above the sticky header (z-50), below the navigation drawer (z-[70]). */}
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-[60] min-w-56 border border-black/10 bg-white py-1 shadow-lg"
        >
          <DropdownMenu.Label className="px-4 py-3">
            {name ? <p className="truncate text-sm font-semibold text-black">{name}</p> : null}
            {email ? <p className="truncate text-xs text-black/60">{email}</p> : null}
          </DropdownMenu.Label>
          <DropdownMenu.Separator className="my-1 h-px bg-black/10" />

          <DropdownMenu.Item asChild className={itemClassName}>
            <Link href="/profile">
              <User className="h-4 w-4" aria-hidden="true" />
              Mi perfil
            </Link>
          </DropdownMenu.Item>

          {role === "ADMIN" ? (
            <DropdownMenu.Item asChild className={itemClassName}>
              <Link href="/admin">
                <Settings className="h-4 w-4" aria-hidden="true" />
                Panel de administración
              </Link>
            </DropdownMenu.Item>
          ) : null}

          <DropdownMenu.Separator className="my-1 h-px bg-black/10" />
          <DropdownMenu.Item className={itemClassName} onSelect={() => signOut({ callbackUrl: "/" })}>
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Cerrar sesión
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
