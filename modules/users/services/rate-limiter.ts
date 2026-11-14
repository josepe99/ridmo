import "server-only"

import { createHash } from "node:crypto"
import { Prisma } from "@prisma/client"
import { prisma } from "@/shared/lib/prisma"
import {
  checkLimit,
  recordAttempt,
  type LimitDecision,
  type LimiterState,
  type LimitPolicy,
  type RateScope,
} from "../domain/rate-limit"

const MAX_CAS_ATTEMPTS = 5
const STALE_AFTER_MS = 24 * 60 * 60 * 1000
const CLEANUP_PROBABILITY = 0.01

/** "<scope>:<sha256(identifier)>": the database never stores raw emails or IP addresses. */
export function rateLimitKey(scope: RateScope, identifier: string): string {
  return `${scope}:${createHash("sha256").update(identifier).digest("hex")}`
}

function toState(row: { count: number; windowStart: Date; lockedUntil: Date | null } | null): LimiterState | null {
  return row ? { count: row.count, windowStart: row.windowStart, lockedUntil: row.lockedUntil } : null
}

export async function checkRateLimit(
  scope: RateScope,
  identifier: string,
  policy: LimitPolicy,
  now: Date = new Date()
): Promise<LimitDecision> {
  const row = await prisma.loginAttempt.findUnique({ where: { key: rateLimitKey(scope, identifier) } })
  return checkLimit(toState(row), now, policy)
}

function isUniqueViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"
}

/**
 * Counts one hit. The read-modify-write is a compare-and-swap on (count, windowStart): if a
 * concurrent request changed the row in between, the update matches nothing and we retry from
 * a fresh read, so parallel guesses cannot all slip under the threshold.
 */
export async function recordRateLimitHit(
  scope: RateScope,
  identifier: string,
  policy: LimitPolicy,
  now: Date = new Date()
): Promise<void> {
  const key = rateLimitKey(scope, identifier)

  for (let attempt = 0; attempt < MAX_CAS_ATTEMPTS; attempt++) {
    const previous = await prisma.loginAttempt.findUnique({ where: { key } })
    const next = recordAttempt(toState(previous), now, policy)

    if (!previous) {
      try {
        await prisma.loginAttempt.create({ data: { key, ...next } })
        break
      } catch (error) {
        if (isUniqueViolation(error)) continue // someone else created it first: retry as an update
        throw error
      }
    }

    const updated = await prisma.loginAttempt.updateMany({
      where: { key, count: previous.count, windowStart: previous.windowStart },
      data: next,
    })
    if (updated.count === 1) break
  }

  // Housekeeping without a scheduler: now and then drop counters nobody has touched for a day.
  if (Math.random() < CLEANUP_PROBABILITY) {
    try {
      await prisma.loginAttempt.deleteMany({ where: { updatedAt: { lt: new Date(now.getTime() - STALE_AFTER_MS) } } })
    } catch {
      // Best effort only.
    }
  }
}

export async function resetRateLimit(scope: RateScope, identifier: string): Promise<void> {
  await prisma.loginAttempt.deleteMany({ where: { key: rateLimitKey(scope, identifier) } })
}
