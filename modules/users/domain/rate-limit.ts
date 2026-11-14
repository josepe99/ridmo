/**
 * Pure rate-limit decision logic (no I/O): given the stored state and "now", decide whether a
 * request is allowed and what the next state is. Persistence lives in services/rate-limiter.ts.
 */
export type LimitPolicy = {
  /** Hits inside one window that trigger the lock. */
  maxAttempts: number
  /** A window starts at its first hit and lasts this long. */
  windowMs: number
  /** How long the key stays blocked once the threshold is reached. */
  lockMs: number
}

export type LimiterState = {
  count: number
  windowStart: Date
  lockedUntil: Date | null
}

export type LimitDecision = { allowed: true } | { allowed: false; retryAfterSeconds: number }

export type RateScope = "login-email" | "login-ip" | "register-ip"

const MINUTE = 60_000

/** 5 failed logins per email in 15 minutes, then a 15 minute lock. */
export const LOGIN_EMAIL_POLICY: LimitPolicy = { maxAttempts: 5, windowMs: 15 * MINUTE, lockMs: 15 * MINUTE }
/** Looser per-IP budget: many customers can share one NAT, while a credential-stuffing run cannot. */
export const LOGIN_IP_POLICY: LimitPolicy = { maxAttempts: 20, windowMs: 15 * MINUTE, lockMs: 15 * MINUTE }
/** 5 registration attempts per IP per hour. */
export const REGISTER_IP_POLICY: LimitPolicy = { maxAttempts: 5, windowMs: 60 * MINUTE, lockMs: 60 * MINUTE }

function isLocked(state: LimiterState | null, now: Date): state is LimiterState & { lockedUntil: Date } {
  return state?.lockedUntil != null && state.lockedUntil.getTime() > now.getTime()
}

export function checkLimit(state: LimiterState | null, now: Date, _policy: LimitPolicy): LimitDecision {
  if (!isLocked(state, now)) return { allowed: true }
  const retryAfterSeconds = Math.max(1, Math.ceil((state.lockedUntil.getTime() - now.getTime()) / 1000))
  return { allowed: false, retryAfterSeconds }
}

/** State after one more hit. An active lock is neither extended nor counted past. */
export function recordAttempt(state: LimiterState | null, now: Date, policy: LimitPolicy): LimiterState {
  if (state && isLocked(state, now)) return state

  const lockExpired = state?.lockedUntil != null
  const windowExpired = state != null && now.getTime() - state.windowStart.getTime() >= policy.windowMs
  const fresh = state == null || lockExpired || windowExpired

  const count = fresh ? 1 : state.count + 1
  const windowStart = fresh ? now : state.windowStart
  const lockedUntil = count >= policy.maxAttempts ? new Date(now.getTime() + policy.lockMs) : null

  return { count, windowStart, lockedUntil }
}
