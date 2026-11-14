type HeaderReader = { get(name: string): string | null }

// Hex digits, dots and colons only, up to the longest textual IPv6 form.
const IP_PATTERN = /^[0-9a-fA-F:.]{2,45}$/

/**
 * Best-effort client IP for rate limiting. Trust note: `x-forwarded-for` is only reliable
 * behind a proxy that overwrites it (Vercel does). On a bare server a client can spoof it, so
 * the per-email limit, not the per-IP one, is the primary defence. Junk values collapse into
 * one shared "unknown" bucket, which fails safe (stricter) instead of unbounded.
 */
export function getClientIp(headers: HeaderReader): string {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim()
  const candidate = forwarded || headers.get("x-real-ip")?.trim()
  return candidate && IP_PATTERN.test(candidate) ? candidate : "unknown"
}
