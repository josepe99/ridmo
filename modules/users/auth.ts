import "server-only"

import NextAuth, { CredentialsSignin } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { prisma } from "@/shared/lib/prisma"
import { authConfig } from "./auth.config"
import { getClientIp } from "./domain/client-ip"
import { evaluateSignIn } from "./domain/sign-in-policy"
import { createAuthAdapter } from "./services/auth-adapter"
import { authorizeCredentials, LoginRateLimitedError } from "./services/authorize-credentials"

/** Surfaces as `?error=CredentialsSignin&code=too_many_attempts`. Reveals nothing about the account. */
class TooManyAttemptsError extends CredentialsSignin {
  code = "too_many_attempts"
}

/**
 * Full Auth.js instance (Node runtime): JWT sessions, Prisma adapter for the Google
 * user/account rows, and the email+password provider.
 *
 * JWT is required for the Credentials provider; the adapter is used only for OAuth user
 * persistence. The token carries `id` and `role` as UI hints; real authorization re-reads
 * the role from the database (services/current-user.ts).
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: createAuthAdapter(prisma),
  providers: [
    ...authConfig.providers,
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(credentials, request) {
        try {
          return await authorizeCredentials(credentials, { ip: getClientIp(request.headers) })
        } catch (error) {
          if (error instanceof LoginRateLimitedError) throw new TooManyAttemptsError()
          // Never log the error object: it could carry request data. Fail closed and generic.
          console.error("[auth] credentials check failed:", error instanceof Error ? error.name : "unknown")
          return null
        }
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    signIn: ({ account, profile, user }) =>
      evaluateSignIn({
        provider: account?.provider,
        profile,
        user: user as { disabledAt?: Date | null } | undefined,
      }),
  },
})
