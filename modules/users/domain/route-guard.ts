import { sanitizeCallbackUrl } from "./callback-url"

export type RouteDecision =
  | { action: "allow" }
  | { action: "redirect"; location: string }
  | { action: "unauthorized" }

type RouteAccessInput = {
  pathname: string
  search?: string
  isAuthenticated: boolean
}

const SIGN_IN_PATH = "/sign-in"

/** Prefixes (segment-aware) that need a session. The role is verified server side. */
const PAGE_PREFIXES = ["/admin", "/profile"] as const
const API_PREFIXES = ["/api/admin"] as const

/** Resolves encodings, duplicate slashes, dot segments and case so spelling tricks cannot dodge the match. */
function canonicalPath(pathname: string): { path: string; malformed: boolean } {
  let decoded = pathname
  let malformed = false
  for (let i = 0; i < 3; i++) {
    try {
      const next = decodeURIComponent(decoded)
      if (next === decoded) break
      decoded = next
    } catch {
      malformed = true
      break
    }
  }
  const segments: string[] = []
  for (const segment of decoded.toLowerCase().split('/')) {
    if (segment === '' || segment === '.') continue
    if (segment === '..') segments.pop()
    else segments.push(segment)
  }
  return { path: `/${segments.join("/")}`, malformed }
}

/** A path with a broken percent-escape is matched without a segment boundary: fail closed. */
function matchesPrefix(path: string, prefix: string, malformed: boolean): boolean {
  if (path === prefix || path.startsWith(`${prefix}/`)) return true
  return malformed && path.startsWith(prefix)
}

/**
 * Coarse, edge-safe route check used by the proxy: it only looks at whether a session exists.
 * The authoritative role check happens server side (`requireAdmin`), which re-reads the role
 * from the database, so a stale or forged token can never grant admin access by itself.
 */
export function decideRouteAccess({ pathname, search = "", isAuthenticated }: RouteAccessInput): RouteDecision {
  if (isAuthenticated) return { action: "allow" }

  const { path, malformed } = canonicalPath(pathname)

  if (API_PREFIXES.some((prefix) => matchesPrefix(path, prefix, malformed))) {
    return { action: "unauthorized" }
  }

  if (PAGE_PREFIXES.some((prefix) => matchesPrefix(path, prefix, malformed))) {
    const callbackUrl = sanitizeCallbackUrl(`${pathname}${search}`)
    return { action: "redirect", location: `${SIGN_IN_PATH}?callbackUrl=${encodeURIComponent(callbackUrl)}` }
  }

  return { action: "allow" }
}
