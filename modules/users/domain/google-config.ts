type Env = Record<string, string | undefined>

/** Google sign-in exists only when both OAuth credentials are configured. */
export function isGoogleConfigured(env: Env = process.env): boolean {
  return Boolean(env.AUTH_GOOGLE_ID?.trim() && env.AUTH_GOOGLE_SECRET?.trim())
}
