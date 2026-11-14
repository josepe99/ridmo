import { describe, expect, it } from "vitest"
import { sanitizeCallbackUrl } from "./callback-url"

describe("sanitizeCallbackUrl", () => {
  it.each([
    ["/", "/"],
    ["/admin", "/admin"],
    ["/admin/orders?page=2", "/admin/orders?page=2"],
    ["/cart#checkout", "/cart#checkout"],
    ["/order/RID-000001", "/order/RID-000001"],
    ["/a/../b", "/b"],
    ["/redirect?next=https://evil.com", "/redirect?next=https://evil.com"],
  ])("keeps the same-origin path %j", (input, expected) => {
    expect(sanitizeCallbackUrl(input)).toBe(expected)
  })

  it.each([
    ["protocol-relative", "//evil.com"],
    ["protocol-relative with path", "//evil.com/x"],
    ["backslash after slash", "/\\evil.com"],
    ["double backslash", "\\\\evil.com"],
    ["leading backslash", "\\evil.com"],
    ["absolute https", "https://evil.com"],
    ["absolute http", "http://evil.com/path"],
    ["javascript scheme", "javascript:alert(1)"],
    ["data scheme", "data:text/html,<script>alert(1)</script>"],
    ["mixed-case scheme", "JaVaScRiPt:alert(1)"],
    ["encoded double slash", "/%2F/evil.com"],
    ["encoded double slash lower", "/%2f/evil.com"],
    ["encoded backslash", "/%5Cevil.com"],
    ["double encoded slash", "/%252F/evil.com"],
    ["double encoded backslash", "/%255Cevil.com"],
    ["tab inside", "/\t/evil.com"],
    ["newline inside", "/\n/evil.com"],
    ["carriage return", "/\r/evil.com"],
    ["null byte", "/\0/evil.com"],
    ["dot segments that collapse to //", "/.//evil.com"],
    ["encoded dot segments", "/%2e//evil.com"],
    ["leading space then //", " //evil.com"],
    ["no leading slash", "evil.com"],
    ["relative path", "admin"],
    ["empty", ""],
    ["whitespace", "   "],
    ["huge", "/" + "a".repeat(3000)],
  ])("rejects %s (%j) and falls back", (_label, input) => {
    expect(sanitizeCallbackUrl(input)).toBe("/")
  })

  it("rejects a url with backslashes anywhere", () => {
    expect(sanitizeCallbackUrl("/ok\\path")).toBe("/")
  })

  it.each([undefined, null, 42, {}, [], ["/x"], true])("falls back for non-string %j", (input) => {
    expect(sanitizeCallbackUrl(input)).toBe("/")
  })

  it("uses the supplied fallback", () => {
    expect(sanitizeCallbackUrl("//evil.com", "/profile")).toBe("/profile")
    expect(sanitizeCallbackUrl(undefined, "/admin")).toBe("/admin")
  })

  it("never returns something that is not a single-slash relative path", () => {
    const attacks = ["//a", "/\\a", "https://a", "/%2F/a", "/.//a", "/\t/a", "/..//a", "/%2e%2e//a"]
    for (const attack of attacks) {
      const result = sanitizeCallbackUrl(attack)
      expect(result.startsWith("/")).toBe(true)
      expect(result.startsWith("//")).toBe(false)
      expect(result.startsWith("/\\")).toBe(false)
    }
  })
})
