import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("next/link", async () => await import("@/tests/mocks/next-link"))
vi.mock("@/modules/users/server", () => ({ requireUserPage: vi.fn() }))
vi.mock("@/modules/orders/server", () => ({ listOrdersForUser: vi.fn() }))

import { listOrdersForUser } from "@/modules/orders/server"
import { requireUserPage } from "@/modules/users/server"
import ProfilePage from "./page"

const user = { id: "64b7f0a0a0a0a0a0a0a0a0a1", name: "Ana", email: "ana@example.com", image: null, role: "USER" as const }

beforeEach(() => {
  vi.mocked(requireUserPage).mockReset().mockResolvedValue(user)
  vi.mocked(listOrdersForUser).mockReset().mockResolvedValue([])
})

describe("profile page", () => {
  it("shows the account data and an empty state", async () => {
    render(await ProfilePage())
    expect(screen.getByRole("heading", { level: 1, name: "Hola, Ana" })).toBeInTheDocument()
    expect(screen.getByText("ana@example.com")).toBeInTheDocument()
    expect(screen.getByText("Todavía no hiciste ningún pedido.", { exact: false })).toBeInTheDocument()
  })

  it("requires a session and returns to /profile after sign-in", async () => {
    await ProfilePage()
    expect(requireUserPage).toHaveBeenCalledWith("/profile")
  })

  it("lists only the orders of the session user (id comes from the session, not the request)", async () => {
    vi.mocked(listOrdersForUser).mockResolvedValue([
      {
        id: "o1",
        orderNumber: "RID-000007",
        status: "PENDING_PAYMENT",
        total: 3900000,
        currency: "PYG",
        itemCount: 2,
        createdAt: "2026-01-01T12:00:00.000Z",
      },
    ])
    render(await ProfilePage())

    expect(listOrdersForUser).toHaveBeenCalledWith(user.id)
    expect(screen.getByText("RID-000007")).toBeInTheDocument()
    expect(screen.getByText("Pendiente de pago")).toBeInTheDocument()
    expect(screen.getByText(/Gs\. 3\.900\.000/)).toBeInTheDocument()
  })

  it("does not call the orders query when the guard rejects", async () => {
    vi.mocked(requireUserPage).mockRejectedValue(new Error("NEXT_REDIRECT:/sign-in"))
    await expect(ProfilePage()).rejects.toThrow("NEXT_REDIRECT")
    expect(listOrdersForUser).not.toHaveBeenCalled()
  })
})
