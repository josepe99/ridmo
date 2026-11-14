import "server-only"

import { prisma } from "@/shared/lib/prisma"
import { LOGIN_EMAIL_POLICY, LOGIN_IP_POLICY } from "../domain/rate-limit"
import { toRole, type Role } from "../domain/roles"
import { loginInputSchema } from "../domain/schemas"
import { verifyPasswordOrDummy } from "./password-hasher"
import { checkRateLimit, recordRateLimitHit, resetRateLimit } from "./rate-limiter"

export type AuthorizedUser = {
  id: string
  name: string | null
  email: string
  image: string | null
  role: Role
}

/** The email or the IP is currently locked out. Raised before any lookup or hashing. */
export class LoginRateLimitedError extends Error {
  readonly retryAfterSeconds: number

  constructor(retryAfterSeconds: number) {
    super("Too many login attempts")
    this.name = "LoginRateLimitedError"
    this.retryAfterSeconds = retryAfterSeconds
  }
}

/**
 * Credentials check behind the Auth.js `authorize` callback.
 *
 * Non-enumerating by construction:
 *  - an unknown email, a wrong password, a Google-only account and a disabled account all
 *    run exactly one argon2 verification (against a dummy hash when there is no real one),
 *    record the failure against BOTH the email and the IP, and return the same `null`;
 *  - the email lock applies whether or not the email exists.
 *
 * Success clears only the per-email counter; the per-IP counter is not reset so one valid
 * login cannot be used to launder a brute-force run from the same address.
 */
export async function authorizeCredentials(raw: unknown, context: { ip: string }): Promise<AuthorizedUser | null> {
  const parsed = loginInputSchema.safeParse(raw)
  if (!parsed.success) return null
  const { email, password } = parsed.data

  const [emailLimit, ipLimit] = await Promise.all([
    checkRateLimit("login-email", email, LOGIN_EMAIL_POLICY),
    checkRateLimit("login-ip", context.ip, LOGIN_IP_POLICY),
  ])
  if (!emailLimit.allowed) throw new LoginRateLimitedError(emailLimit.retryAfterSeconds)
  if (!ipLimit.allowed) throw new LoginRateLimitedError(ipLimit.retryAfterSeconds)

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true, email: true, image: true, role: true, passwordHash: true, disabledAt: true },
  })

  const passwordMatches = await verifyPasswordOrDummy(user?.passwordHash ?? null, password)

  if (!user || !passwordMatches || user.disabledAt) {
    await Promise.all([
      recordRateLimitHit("login-email", email, LOGIN_EMAIL_POLICY),
      recordRateLimitHit("login-ip", context.ip, LOGIN_IP_POLICY),
    ])
    return null
  }

  await resetRateLimit("login-email", email)

  return { id: user.id, name: user.name, email: user.email, image: user.image, role: toRole(user.role) }
}
