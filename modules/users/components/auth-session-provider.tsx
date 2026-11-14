"use client"

import type { ReactNode } from "react"
import { SessionProvider } from "next-auth/react"

/**
 * Client-side session context for the navigation. Without a `session` prop it fetches
 * /api/auth/session in the browser, so the root layout never reads cookies on the server and
 * public storefront pages stay cacheable.
 */
export function AuthSessionProvider({ children }: { children: ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>
}
