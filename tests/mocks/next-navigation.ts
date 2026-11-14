import { vi } from "vitest"

export const routerMock = {
  push: vi.fn(),
  replace: vi.fn(),
  refresh: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  prefetch: vi.fn(),
}

export const navigationState = { pathname: "/", searchParams: new URLSearchParams() }

export const useRouter = () => routerMock
export const usePathname = () => navigationState.pathname
export const useSearchParams = () => navigationState.searchParams

/** Mirrors Next: both helpers throw so the code after them never runs. */
export const redirect = vi.fn((url: string) => {
  throw new Error(`NEXT_REDIRECT:${url}`)
})
export const notFound = vi.fn(() => {
  throw new Error("NEXT_NOT_FOUND")
})

export function resetNavigationMock() {
  for (const fn of Object.values(routerMock)) fn.mockReset()
  navigationState.pathname = "/"
  navigationState.searchParams = new URLSearchParams()
  redirect.mockClear()
  notFound.mockClear()
}
