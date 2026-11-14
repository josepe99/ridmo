import "server-only"

import { Prisma } from "@prisma/client"
import { prisma } from "@/shared/lib/prisma"
import { REGISTER_IP_POLICY } from "../domain/rate-limit"
import { registerInputSchema } from "../domain/schemas"
import { hashPassword } from "./password-hasher"
import { checkRateLimit, recordRateLimitHit } from "./rate-limiter"

export type RegisterResult =
  | { ok: true; user: { id: string; name: string | null; email: string } }
  | { ok: false; code: "VALIDATION"; fieldErrors: Record<string, string> }
  | { ok: false; code: "RATE_LIMITED"; retryAfterSeconds: number }
  // Deliberately one code for "email already registered" and any other refusal.
  | { ok: false; code: "REGISTRATION_FAILED" }

function isUniqueViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"
}

/**
 * Self-service signup.
 *
 *  - The role is ALWAYS `USER`: it is hard-coded here and the zod schema strips any `role`
 *    the client sends. Promotion to ADMIN only happens through `changeUserRole` or the CLI.
 *  - Per-IP rate limited; every attempt counts, valid or not.
 *  - The password is hashed (argon2id) before the uniqueness check, so a duplicate email
 *    costs the same time as a new one, and uniqueness is enforced by the database index
 *    (no check-then-insert race). A duplicate yields the same generic failure as any other
 *    refusal. Tradeoff: without email verification the form cannot say "check your inbox",
 *    so the generic message hints "if you already have an account, sign in" rather than
 *    confirming it; the IP limit bounds enumeration through this endpoint.
 *  - Only id, name and email are selected back: the hash never leaves this function.
 */
export async function registerUser(input: unknown, context: { ip: string }): Promise<RegisterResult> {
  const limit = await checkRateLimit("register-ip", context.ip, REGISTER_IP_POLICY)
  if (!limit.allowed) {
    return { ok: false, code: "RATE_LIMITED", retryAfterSeconds: limit.retryAfterSeconds }
  }
  await recordRateLimitHit("register-ip", context.ip, REGISTER_IP_POLICY)

  const parsed = registerInputSchema.safeParse(input)
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const field = String(issue.path[0] ?? "form")
      if (!(field in fieldErrors)) fieldErrors[field] = issue.message
    }
    return { ok: false, code: "VALIDATION", fieldErrors }
  }

  const { name, email, password } = parsed.data
  const passwordHash = await hashPassword(password)

  try {
    const user = await prisma.user.create({
      data: { name: name ?? null, email, passwordHash, role: "USER" },
      select: { id: true, name: true, email: true },
    })
    return { ok: true, user: { id: user.id, name: user.name, email: user.email } }
  } catch (error) {
    if (isUniqueViolation(error)) return { ok: false, code: "REGISTRATION_FAILED" }
    throw error
  }
}
