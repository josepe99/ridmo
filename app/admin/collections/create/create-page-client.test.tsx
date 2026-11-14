import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { resetNavigationMock, routerMock } from "@/tests/mocks/next-navigation"

vi.mock("next/navigation", async () => await import("@/tests/mocks/next-navigation"))
vi.mock("next/link", async () => await import("@/tests/mocks/next-link"))
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

import { toast } from "sonner"
import { CreateCollectionPageClient } from "./create-page-client"

async function fillAndSubmit() {
  const user = userEvent.setup({ delay: null })
  render(<CreateCollectionPageClient onUploadImage={vi.fn()} />)
  await user.type(screen.getByLabelText("Name"), "Cadenas")
  await user.click(screen.getByRole("button", { name: "Create collection" }))
}

beforeEach(() => {
  resetNavigationMock()
  vi.mocked(toast.success).mockReset()
  vi.mocked(toast.error).mockReset()
  vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true }) as Response))
})

describe("CreateCollectionPageClient", () => {
  it("renders the heading and a link back to the admin", () => {
    render(<CreateCollectionPageClient onUploadImage={vi.fn()} />)

    expect(screen.getByRole("heading", { name: "Create New Collection" })).toBeInTheDocument()
    expect(screen.getAllByRole("link")[0]).toHaveAttribute("href", "/admin")
  })

  it("posts the collection as JSON, then goes back to the admin", async () => {
    await fillAndSubmit()

    await waitFor(() => expect(routerMock.push).toHaveBeenCalledWith("/admin"))
    const [url, init] = vi.mocked(fetch).mock.calls[0]
    expect(url).toBe("/api/admin/collections")
    expect(init?.method).toBe("POST")
    expect(JSON.parse(init?.body as string)).toMatchObject({ name: "Cadenas", isActive: true })
    expect(toast.success).toHaveBeenCalledWith("Collection created successfully!")
    expect(routerMock.refresh).toHaveBeenCalled()
  })

  it("shows an error toast and stays on the page when the API rejects it", async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: false } as Response)

    await fillAndSubmit()

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Failed to create collection"))
    expect(routerMock.push).not.toHaveBeenCalled()
  })
})
