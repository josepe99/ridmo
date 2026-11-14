import "server-only"

import { hash, verify } from "@node-rs/argon2"

// argon2id with the OWASP-recommended minimum (19 MiB, 2 iterations, 1 lane). The algorithm
// value is numeric because the binding exposes it as a `const enum` (Argon2id = 2).
const ARGON2ID = 2
const OPTIONS = { algorithm: ARGON2ID, memoryCost: 19_456, timeCost: 2, parallelism: 1 } as const

/** Hashes a password into a self-describing, salted argon2id PHC string. */
export async function hashPassword(password: string): Promise<string> {
  if (!password) throw new Error("Cannot hash an empty password")
  return hash(password, OPTIONS)
}

/** True when `password` matches `storedHash`. A malformed hash is a mismatch, never an exception. */
export async function verifyPassword(storedHash: string, password: string): Promise<boolean> {
  if (!storedHash || !password) return false
  try {
    return await verify(storedHash, password)
  } catch {
    return false
  }
}

let dummyHash: Promise<string> | undefined

/** Hash of a random throw-away secret, computed once with the production parameters. */
function getDummyHash(): Promise<string> {
  dummyHash ??= hash(`dummy-${crypto.randomUUID()}`, OPTIONS)
  return dummyHash
}

/**
 * Verifies against `storedHash`, or against a dummy hash when there is none (unknown email,
 * Google-only account), so both paths cost one argon2 verification and the response time does
 * not reveal whether the account exists. Always false when the stored hash is absent.
 */
export async function verifyPasswordOrDummy(
  storedHash: string | null | undefined,
  password: string
): Promise<boolean> {
  if (storedHash) return verifyPassword(storedHash, password)
  await verifyPassword(await getDummyHash(), password || "x")
  return false
}
