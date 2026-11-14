import { describe, expect, it } from "vitest"
import {
  LOGIN_EMAIL_POLICY,
  LOGIN_IP_POLICY,
  REGISTER_IP_POLICY,
  checkLimit,
  recordAttempt,
  type LimiterState,
  type LimitPolicy,
} from "./rate-limit"

const MIN = 60_000
const policy: LimitPolicy = { maxAttempts: 5, windowMs: 15 * MIN, lockMs: 15 * MIN }
const t0 = new Date("2026-01-01T00:00:00.000Z")
const at = (ms: number) => new Date(t0.getTime() + ms)

function hit(n: number, state: LimiterState | null = null, start = 0, step = 1000, p = policy) {
  let current = state
  for (let i = 0; i < n; i++) current = recordAttempt(current, at(start + i * step), p)
  return current
}

describe("checkLimit", () => {
  it("allows when there is no state", () => {
    expect(checkLimit(null, t0, policy)).toEqual({ allowed: true })
  })

  it("allows until the threshold is reached", () => {
    const state = hit(4)
    expect(state).toMatchObject({ count: 4, lockedUntil: null })
    expect(checkLimit(state, at(5000), policy)).toEqual({ allowed: true })
  })

  it("locks on the 5th failure and reports the remaining lock time in whole seconds", () => {
    const state = hit(5)
    expect(state?.lockedUntil).toEqual(at(4000 + 15 * MIN))
    expect(checkLimit(state, at(4000), policy)).toEqual({ allowed: false, retryAfterSeconds: 15 * 60 })
    expect(checkLimit(state, at(4000 + 14 * MIN + 30_000), policy)).toEqual({ allowed: false, retryAfterSeconds: 30 })
  })

  it("rounds a fractional remaining lock up so it never reports 0 while locked", () => {
    const state = hit(5)
    expect(checkLimit(state, at(4000 + 15 * MIN - 1), policy)).toEqual({ allowed: false, retryAfterSeconds: 1 })
  })

  it("unlocks exactly when the lock expires", () => {
    const state = hit(5)
    expect(checkLimit(state, at(4000 + 15 * MIN), policy)).toEqual({ allowed: true })
    expect(checkLimit(state, at(4000 + 16 * MIN), policy)).toEqual({ allowed: true })
  })
})

describe("recordAttempt", () => {
  it("starts a window at the first attempt", () => {
    expect(recordAttempt(null, t0, policy)).toEqual({ count: 1, windowStart: t0, lockedUntil: null })
  })

  it("keeps counting inside the window", () => {
    expect(hit(3)).toMatchObject({ count: 3, windowStart: t0 })
  })

  it("starts a fresh window once the previous one has expired", () => {
    const next = recordAttempt(hit(4), at(15 * MIN + 1), policy)
    expect(next).toEqual({ count: 1, windowStart: at(15 * MIN + 1), lockedUntil: null })
  })

  it("does not extend an active lock nor increase the count while locked", () => {
    const locked = hit(5)!
    expect(recordAttempt(locked, at(10_000), policy)).toEqual(locked)
  })

  it("starts over after a lock has expired", () => {
    const locked = hit(5)!
    const later = at(4000 + 15 * MIN + 1)
    expect(recordAttempt(locked, later, policy)).toEqual({ count: 1, windowStart: later, lockedUntil: null })
  })

  it("does not mutate its input", () => {
    const state = hit(2)!
    const snapshot = structuredClone(state)
    recordAttempt(state, at(9000), policy)
    expect(state).toEqual(snapshot)
  })
})

describe("scopes are independent (per email vs per IP)", () => {
  it("locks the email at 5 failures while the IP budget is still open", () => {
    const email = hit(5, null, 0, 1000, LOGIN_EMAIL_POLICY)
    const ip = hit(5, null, 0, 1000, LOGIN_IP_POLICY)
    expect(checkLimit(email, at(5000), LOGIN_EMAIL_POLICY).allowed).toBe(false)
    expect(checkLimit(ip, at(5000), LOGIN_IP_POLICY).allowed).toBe(true)
  })

  it("locks the IP only at its higher threshold", () => {
    const ip = hit(LOGIN_IP_POLICY.maxAttempts, null, 0, 1000, LOGIN_IP_POLICY)
    expect(checkLimit(ip, at(60_000), LOGIN_IP_POLICY).allowed).toBe(false)
  })
})

describe("built-in policies", () => {
  it("login by email: 5 failures / 15 min, 15 min lock", () => {
    expect(LOGIN_EMAIL_POLICY).toEqual({ maxAttempts: 5, windowMs: 15 * MIN, lockMs: 15 * MIN })
  })

  it("login by IP is looser than by email but still bounded", () => {
    expect(LOGIN_IP_POLICY.maxAttempts).toBeGreaterThan(LOGIN_EMAIL_POLICY.maxAttempts)
    expect(LOGIN_IP_POLICY.maxAttempts).toBeLessThanOrEqual(50)
  })

  it("registration by IP is hourly", () => {
    expect(REGISTER_IP_POLICY.windowMs).toBe(60 * MIN)
    expect(REGISTER_IP_POLICY.maxAttempts).toBeLessThanOrEqual(10)
  })
})
