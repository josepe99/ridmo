import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("next/link", async () => await import("@/tests/mocks/next-link"))
vi.mock("@/modules/users/actions/set-user-role.action", () => ({ setUserRoleAction: vi.fn() }))
vi.mock("@/modules/users/server", async () => {
  const { UsersTable } = await import("@/modules/users/components/users-table")
  return { requireAdminPage: vi.fn(), listUsers: vi.fn(), UsersTable }
})

import { listUsers, requireAdminPage } from "@/modules/users/server"
import AdminUsersPage from "./page"

const list = (users: unknown[] = [], overrides: Record<string, unknown> = {}) => ({
  users,
  total: users.length,
  page: 1,
  pageSize: 20,
  pageCount: 1,
  ...overrides,
})

const row = (overrides: Record<string, unknown> = {}) => ({
  id: "64b7f0a0a0a0a0a0a0a0a0a2",
  name: "Bruno",
  email: "bruno@example.com",
  role: "USER",
  disabled: false,
  hasGoogle: false,
  createdAt: "2026-01-02T00:00:00.000Z",
  ...overrides,
})

const renderPage = async (params: Record<string, string | string[]> = {}) =>
  render(await AdminUsersPage({ searchParams: Promise.resolve(params) }))

beforeEach(() => {
  vi.mocked(requireAdminPage).mockReset().mockResolvedValue("64b7f0a0a0a0a0a0a0a0a0a1")
  vi.mocked(listUsers).mockReset().mockResolvedValue(list() as never)
})

describe("admin users page", () => {
  it("requires an admin before listing anything", async () => {
    vi.mocked(requireAdminPage).mockRejectedValue(new Error("NEXT_REDIRECT:/"))
    await expect(renderPage()).rejects.toThrow("NEXT_REDIRECT")
    expect(listUsers).not.toHaveBeenCalled()
  })

  it("passes the search and page to the query, sanitizing odd values", async () => {
    await renderPage({ q: "  ana@  ", page: "3" })
    expect(listUsers).toHaveBeenCalledWith({ query: "ana@", page: 3 })

    await renderPage({ q: ["a", "b"], page: "not-a-number" })
    expect(listUsers).toHaveBeenLastCalledWith({ query: "a", page: 1 })
  })

  it("renders the users with their role and a control per row", async () => {
    vi.mocked(listUsers).mockResolvedValue(
      list([row(), row({ id: "64b7f0a0a0a0a0a0a0a0a0a1", email: "ana@example.com", role: "ADMIN" })]) as never
    )
    await renderPage()

    expect(screen.getByText("bruno@example.com")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Hacer administrador" })).toBeEnabled()
    // The signed-in admin's own row is read-only.
    expect(screen.getByRole("button", { name: "Quitar administrador" })).toBeDisabled()
    expect(screen.getByRole("search")).toBeInTheDocument()
  })

  it("shows an empty state", async () => {
    await renderPage({ q: "nobody" })
    expect(screen.getByText("No encontramos usuarios.")).toBeInTheDocument()
  })

  it("paginates", async () => {
    vi.mocked(listUsers).mockResolvedValue(list([row()], { page: 2, pageCount: 3, total: 41 }) as never)
    await renderPage({ page: "2", q: "a" })
    expect(screen.getByRole("link", { name: "Anterior" })).toHaveAttribute("href", "/admin/users?q=a")
    expect(screen.getByRole("link", { name: "Siguiente" })).toHaveAttribute("href", "/admin/users?q=a&page=3")
  })
})
