import { vi } from "vitest"

export const revalidatePath = vi.fn()
export const revalidateTag = vi.fn()
/** Caching is transparent in tests: the wrapped function runs on every call. */
export const unstable_cache = <T extends (...args: never[]) => unknown>(fn: T) => fn
