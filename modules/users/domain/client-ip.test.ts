import { describe, expect, it } from "vitest"
import { getClientIp } from "./client-ip"

const headers = (init: Record<string, string>) => new Headers(init)

describe("getClientIp", () => {
  it("uses the first x-forwarded-for entry", () => {
    expect(getClientIp(headers({ "x-forwarded-for": "203.0.113.7, 10.0.0.1" }))).toBe("203.0.113.7")
  })

  it("falls back to x-real-ip", () => {
    expect(getClientIp(headers({ "x-real-ip": "198.51.100.4" }))).toBe("198.51.100.4")
  })

  it("accepts IPv6", () => {
    expect(getClientIp(headers({ "x-forwarded-for": "2001:db8::1" }))).toBe("2001:db8::1")
    expect(getClientIp(headers({ "x-forwarded-for": "::1" }))).toBe("::1")
  })

  it.each(["", "not an ip", "<script>", "1.2.3.4; DROP", "a".repeat(100)])("returns unknown for the junk value %j", (value) => {
    expect(getClientIp(headers({ "x-forwarded-for": value }))).toBe("unknown")
  })

  it("returns unknown when no header is present", () => {
    expect(getClientIp(headers({}))).toBe("unknown")
  })
})
