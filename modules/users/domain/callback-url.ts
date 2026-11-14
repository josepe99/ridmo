const MAX_LENGTH = 2048
const PLACEHOLDER_ORIGIN = "http://callback.invalid"

// C0 controls, DEL and the Unicode line/paragraph separators. Browsers strip tab/CR/LF while
// parsing URLs, which is how a tab between two slashes turns into a protocol-relative url.
function hasForbiddenCharacter(value: string): boolean {
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i)
    if (code <= 0x1f || code === 0x7f || code === 0x2028 || code === 0x2029) return true
  }
  return false
}

function startsWithUnsafePrefix(value: string): boolean {
  return !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")
}

/** Percent-decodes up to three times, so double-encoded tricks are checked in every form. */
function decodedForms(value: string): string[] {
  const forms = [value]
  let current = value
  for (let i = 0; i < 3; i++) {
    let next: string
    try {
      next = decodeURIComponent(current)
    } catch {
      // Malformed escape: keep the raw form only, it is rejected below if it looks unsafe.
      break
    }
    if (next === current) break
    forms.push(next)
    current = next
  }
  return forms
}

/**
 * Accepts only same-origin, relative paths ("/cart", "/admin/orders?page=2") and returns the
 * fallback for anything else: absolute URLs, scheme-relative `//host`, backslash variants,
 * control characters, and encoded or dot-segment tricks that collapse into one of those.
 *
 * Use it for every post-login redirect target, on the client and on the server.
 */
export function sanitizeCallbackUrl(input: unknown, fallback = "/"): string {
  if (typeof input !== "string") return fallback
  if (input.length === 0 || input.length > MAX_LENGTH) return fallback

  for (const form of decodedForms(input)) {
    if (hasForbiddenCharacter(form) || form.includes("\\")) return fallback
    if (startsWithUnsafePrefix(form)) return fallback
  }

  let parsed: URL
  try {
    parsed = new URL(input, PLACEHOLDER_ORIGIN)
  } catch {
    return fallback
  }
  if (parsed.origin !== PLACEHOLDER_ORIGIN) return fallback

  // Dot segments are resolved by the parser ("/.//evil.com" -> "//evil.com"): check the result.
  const normalized = `${parsed.pathname}${parsed.search}${parsed.hash}`
  for (const form of decodedForms(normalized)) {
    if (startsWithUnsafePrefix(form) || form.includes("\\")) return fallback
  }
  return normalized
}
