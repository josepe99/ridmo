import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("next/navigation", async () => await import("@/tests/mocks/next-navigation"))
vi.mock("./current-user", () => ({ requireAdmin: vi.fn(), requireUser: vi.fn() }))

import { redirect, resetNavigationMock } from "@/tests/mocks/next-navigation"
import { AuthorizationError } from "../errors"
import { requireAdmin, requireUser } from "./current-user"
import { requireAdminPage, requireUserPage } from "./page-guards"

beforeEach(() => {
  resetNavigationMock()
  vi.mocked(requireAdmin).mockReset()
  vi.mocked(requireUser).mockReset()
})

describe("requireAdminPage", () => {
  it("returns the admin id when allowed", async () => {
    vi.mocked(requireAdmin).mockResolvedValue("admin-1")
    await expect(requireAdminPage()).resolves.toBe("admin-1")
    expect(redirect).not.toHaveBeenCalled()
  })

  it("sends an anonymous visitor to sign-in", async () => {
    vi.mocked(requireAdmin).mockRejectedValue(new AuthorizationError("UNAUTHENTICATED"))
    await expect(requireAdminPage()).rejects.toThrow("NEXT_REDIRECT:/sign-in")
  })

  it("sends a signed-in non-admin to the storefront", async () => {
    vi.mocked(requireAdmin).mockRejectedValue(new AuthorizationError("FORBIDDEN"))
    await expect(requireAdminPage()).rejects.toThrow("NEXT_REDIRECT:/")
  })

  it("does not swallow unexpected errors", async () => {
    vi.mocked(requireAdmin).mockRejectedValue(new Error("db down"))
    await expect(requireAdminPage()).rejects.toThrow("db down")
    expect(redirect).not.toHaveBeenCalled()
  })
})

describe("requireUserPage", () => {
  it("returns the user", async () => {
    const user = { id: "u1", name: null, email: "a@b.co", image: null, role: "USER" as const }
    vi.mocked(requireUser).mockResolvedValue(user)
    await expect(requireUserPage("/profile")).resolves.toEqual(user)
  })

  it("redirects guests to sign-in with a safe callbackUrl", async () => {
    vi.mocked(requireUser).mockRejectedValue(new AuthorizationError("UNAUTHENTICATED"))
    await expect(requireUserPage("/profile")).rejects.toThrow("NEXT_REDIRECT:/sign-in?callbackUrl=%2Fprofile")
    vi.mocked(redirect).mockClear()
    await expect(requireUserPage("//evil.com")).rejects.toThrow("NEXT_REDIRECT:/sign-in")
  })
})
