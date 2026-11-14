import type { NextAuthConfig } from "next-auth"
import Google from "next-auth/providers/google"
import { isGoogleConfigured } from "./domain/google-config"
import { applyUserToToken, buildSession } from "./domain/session-mapping"

/**
 * Edge-safe half of the Auth.js configuration: no Prisma, no argon2, no Node-only imports.
 * The proxy (middleware) instantiates Auth.js from this object alone, only to decode the
 * session cookie. The full configuration (adapter, credentials, signIn callback) is in ./auth.ts.
 *
 * Deliberately NOT set:
 *  - `allowDangerousEmailAccountLinking`: a Google login never attaches itself to an existing
 *    password account with the same email (that would let whoever controls the email at
 *    Google, or a pre-registered unverified account, take over the other one);
 *  - `trustHost`: Auth.js trusts the host on Vercel and in development; elsewhere set
 *    AUTH_TRUST_HOST=true only when a reverse proxy you control sets the Host header.
 *
 * Cookies: Auth.js marks the session cookie HttpOnly + SameSite=Lax and, when the site is
 * served over https (production), `Secure` with the `__Secure-` prefix.
 */
export const authConfig = {
  providers: isGoogleConfigured()
    ? [
        Google({
          clientId: process.env.AUTH_GOOGLE_ID,
          clientSecret: process.env.AUTH_GOOGLE_SECRET,
          authorization: { params: { prompt: "select_account" } },
        }),
      ]
    : [],
  pages: { signIn: "/sign-in", error: "/sign-in" },
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 7 },
  callbacks: {
    jwt: ({ token, user }) => applyUserToToken(token, user),
    session: ({ session, token }) => buildSession(session, token),
  },
} satisfies NextAuthConfig
