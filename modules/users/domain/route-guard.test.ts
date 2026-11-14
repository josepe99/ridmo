import { describe, expect, it } from "vitest"
import { decideRouteAccess } from "./route-guard"

const anon = { isAuthenticated: false }
const authed = { isAuthenticated: true }

describe("decideRouteAccess", () => {
  it.each(["/", "/cart", "/collections/gafas", "/sign-in", "/sign-up", "/order/RID-000001", "/api/auth/session", "/api/orders"])(
    "lets everybody reach the public path %s",
    (pathname) => {
      expect(decideRouteAccess({ pathname, ...anon })).toEqual({ action: "allow" })
      expect(decideRouteAccess({ pathname, ...authed })).toEqual({ action: "allow" })
    }
  )

  it.each(["/admin", "/admin/", "/admin/orders", "/admin/collections/abc", "/profile", "/profile/orders"])(
    "redirects an anonymous visitor from %s to sign-in with a safe callbackUrl",
    (pathname) => {
      const decision = decideRouteAccess({ pathname, search: "?page=2", ...anon })
      expect(decision).toEqual({
        action: "redirect",
        location: `/sign-in?callbackUrl=${encodeURIComponent(`${pathname}?page=2`)}`,
      })
    }
  )

  it("lets any authenticated session through the coarse check (the role is verified server side)", () => {
    for (const pathname of ["/admin", "/admin/users", "/profile", "/api/admin/items"]) {
      expect(decideRouteAccess({ pathname, ...authed })).toEqual({ action: "allow" })
    }
  })

  it.each(["/api/admin", "/api/admin/items", "/api/admin/collections/1"])(
    "answers anonymous API calls to %s with a 401 instead of a redirect",
    (pathname) => {
      expect(decideRouteAccess({ pathname, ...anon })).toEqual({ action: "unauthorized" })
    }
  )

  it.each(["/administrator", "/admin-panel", "/profiles", "/api/administrator", "/apiadmin"])(
    "does not treat the look-alike path %s as protected",
    (pathname) => {
      expect(decideRouteAccess({ pathname, ...anon })).toEqual({ action: "allow" })
    }
  )

  it.each(["/%61dmin", "/%61dmin/orders", "//admin", "/admin//orders", "/ADMIN", "/Admin/orders", "/api/%61dmin/items", "/profile/../admin"])(
    "still protects the encoded or odd spelling %s",
    (pathname) => {
      expect(decideRouteAccess({ pathname, ...anon }).action).not.toBe("allow")
    }
  )

  it("never builds a redirect to an unsafe callbackUrl", () => {
    const decision = decideRouteAccess({ pathname: "//admin", search: "?x=1", ...anon })
    expect(decision.action).toBe("redirect")
    if (decision.action !== "redirect") return
    const callback = new URL(decision.location, "http://localhost").searchParams.get("callbackUrl")
    expect(callback?.startsWith("//")).toBe(false)
  })

  it("survives a malformed percent-encoding", () => {
    expect(decideRouteAccess({ pathname: "/admin%E0%A4%A", ...anon }).action).not.toBe("allow")
  })
})
