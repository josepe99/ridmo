import "server-only"

import { prisma } from "@/shared/lib/prisma"

function readSequence(result: unknown): number {
  if (typeof result === "object" && result !== null && "value" in result) {
    const value = (result as { value: unknown }).value
    if (typeof value === "object" && value !== null && "seq" in value) {
      const seq = (value as { seq: unknown }).seq
      if (typeof seq === "number" && Number.isSafeInteger(seq)) return seq
    }
  }
  throw new Error("Unexpected findAndModify response while reading a sequence")
}

function isDuplicateKey(error: unknown): boolean {
  return /E11000|duplicate key/i.test(String(error))
}

/**
 * Atomically increments and returns the named counter (starting at 1).
 *
 * Uses a native `findAndModify` with upsert so concurrent callers always get
 * distinct values, with no read-then-write race. A duplicate-key error can only
 * happen when two callers create the counter at the same instant: retry once more.
 */
export async function nextSequence(name: string): Promise<number> {
  let lastError: unknown
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const result = await prisma.$runCommandRaw({
        findAndModify: "counters",
        query: { _id: name },
        update: { $inc: { seq: 1 } },
        upsert: true,
        new: true,
      })
      return readSequence(result)
    } catch (error) {
      if (!isDuplicateKey(error)) throw error
      lastError = error
    }
  }
  throw lastError
}
