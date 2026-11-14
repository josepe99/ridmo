import NextAuth from "next-auth"
import { NextResponse } from "next/server"
import { authConfig } from "@/modules/users/auth.config"
import { decideRouteAccess } from "@/modules/users/domain/route-guard"

// Next 16 renamed the `middleware` file convention to `proxy`. This instance is built from
// the edge-safe config only (no Prisma adapter), so it can read the session cookie but not
// the database. It is a COARSE gate (is there a session?); the role is verified server side
// by `requireAdmin` on every page, action and route, against the database.
const { auth } = NextAuth(authConfig)

export const proxy = auth((request) => {
  const decision = decideRouteAccess({
    pathname: request.nextUrl.pathname,
    search: request.nextUrl.search,
    isAuthenticated: Boolean(request.auth?.user),
  })

  if (decision.action === "redirect") {
    return NextResponse.redirect(new URL(decision.location, request.nextUrl.origin))
  }
  if (decision.action === "unauthorized") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  return NextResponse.next()
})

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*", "/profile/:path*"],
}
