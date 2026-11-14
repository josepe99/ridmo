export const GOOGLE_UNVERIFIED_EMAIL_REDIRECT = "/sign-in?error=GoogleEmailNotVerified"

type SignInContext = {
  provider: string | undefined
  profile: { email?: unknown; email_verified?: unknown } | undefined | null
  user?: { disabledAt?: Date | null } | null
}

/**
 * Decision behind the Auth.js `signIn` callback (pure, so it is unit-tested):
 *  - disabled users never sign in, whichever provider they use;
 *  - Google accounts must have a verified email (strict `=== true`);
 *  - credentials were already vetted by `authorize`;
 *  - every other provider is denied by default.
 *
 * Returns `true`, `false` (AccessDenied) or a redirect url string.
 */
export function evaluateSignIn({ provider, profile, user }: SignInContext): boolean | string {
  if (user?.disabledAt) return false

  if (provider === "google") {
    const verified = profile?.email_verified === true && typeof profile.email === "string" && profile.email.length > 0
    return verified ? true : GOOGLE_UNVERIFIED_EMAIL_REDIRECT
  }
  if (provider === "credentials") return true
  return false
}
