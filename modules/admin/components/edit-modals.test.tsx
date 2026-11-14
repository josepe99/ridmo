import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { resetNavigationMock, routerMock } from "@/tests/mocks/next-navigation"

vi.mock("next/navigation", async () => await import("@/tests/mocks/next-navigation"))
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

import { toast } from "sonner"
import { EditCollectionModal } from "./edit-collection-modal"
import { EditItemModal } from "./edit-item-modal"

const collection = {
  id: "c1",
  name: "Cadenas",
  slug: "cadenas",
  description: "Macizas",
  imageUrl: "https://res.cloudinary.com/c.jpg",
  isActive: true,
}

const item = {
  id: "i1",
  name: "Cadena Milan",
  slug: "cadena-milan",
  description: null,
  price: 100,
  comparePrice: null,
  sku: null,
  inventory: 3,
  isActive: true,
  images: [],
  tags: ["oro"],
  collectionId: "c1",
}

beforeEach(() => {
  resetNavigationMock()
  vi.mocked(toast.success).mockReset()
  vi.mocked(toast.error).mockReset()
  vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ({}) }) as Response))
  vi.spyOn(console, "error").mockImplementation(() => {})
})

describe("EditCollectionModal", () => {
  it("is closed until Edit is clicked, then shows the prefilled form", async () => {
    render(<EditCollectionModal collection={collection} />)
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole("button", { name: "Edit" }))

    expect(await screen.findByRole("dialog", { name: "Edit Collection" })).toBeInTheDocument()
    expect(screen.getByLabelText("Name")).toHaveValue("Cadenas")
    expect(screen.getByLabelText("Description")).toHaveValue("Macizas")
    expect(screen.getByText("Saved")).toBeInTheDocument()
  })

  it("saves with PUT, shows a success toast, closes and refreshes", async () => {
    render(<EditCollectionModal collection={collection} />)
    await userEvent.click(screen.getByRole("button", { name: "Edit" }))
    await userEvent.type(await screen.findByLabelText("Name"), "s")

    await userEvent.click(screen.getByRole("button", { name: "Update Collection" }))

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Collection updated successfully!"))
    const [url, init] = vi.mocked(fetch).mock.calls[0]
    expect(url).toBe("/api/admin/collections/c1")
    expect(init?.method).toBe("PUT")
    expect(JSON.parse(init?.body as string)).toMatchObject({
      name: "Cadenass",
      imageUrl: "https://res.cloudinary.com/c.jpg",
      isActive: true,
    })
    expect(routerMock.refresh).toHaveBeenCalled()
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
  })

  it("shows an error toast and stays open when the update fails", async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: false } as Response)
    render(<EditCollectionModal collection={collection} />)
    await userEvent.click(screen.getByRole("button", { name: "Edit" }))

    await userEvent.click(await screen.findByRole("button", { name: "Update Collection" }))

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Failed to update collection"))
    expect(screen.getByRole("dialog")).toBeInTheDocument()
    expect(routerMock.refresh).not.toHaveBeenCalled()
  })

  describe("replacing the image", () => {
    const newFile = () => new File(["x"], "banner.png", { type: "image/png" })

    async function openAndPickImage() {
      URL.createObjectURL = vi.fn(() => "blob:preview")
      render(<EditCollectionModal collection={{ ...collection, imageUrl: null }} />)
      await userEvent.click(screen.getByRole("button", { name: "Edit" }))
      await screen.findByRole("dialog")
      await userEvent.upload(document.getElementById("file-upload") as HTMLInputElement, newFile())
    }

    it("uploads the new image first and saves the returned URL", async () => {
      vi.mocked(fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: { images: [{ url: "https://res.cloudinary.com/new.jpg" }] } }),
        } as Response)
        .mockResolvedValueOnce({ ok: true } as Response)
      await openAndPickImage()

      await userEvent.click(screen.getByRole("button", { name: "Update Collection" }))

      await waitFor(() => expect(toast.success).toHaveBeenCalled())
      const [uploadUrl, uploadInit] = vi.mocked(fetch).mock.calls[0]
      expect(uploadUrl).toBe("/api/admin/images")
      expect((uploadInit?.body as FormData).get("image0")).toBeInstanceOf(File)
      const [saveUrl, saveInit] = vi.mocked(fetch).mock.calls[1]
      expect(saveUrl).toBe("/api/admin/collections/c1")
      expect(JSON.parse(saveInit?.body as string).imageUrl).toBe("https://res.cloudinary.com/new.jpg")
    })

    it("does not save the collection when the image upload fails", async () => {
      vi.mocked(fetch).mockResolvedValueOnce({ ok: false } as Response)
      await openAndPickImage()

      await userEvent.click(screen.getByRole("button", { name: "Update Collection" }))

      await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Failed to update collection"))
      expect(fetch).toHaveBeenCalledTimes(1)
    })
  })

  it("closes with Cancel without calling the API", async () => {
    render(<EditCollectionModal collection={collection} />)
    await userEvent.click(screen.getByRole("button", { name: "Edit" }))

    await userEvent.click(await screen.findByRole("button", { name: "Cancel" }))

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
    expect(fetch).not.toHaveBeenCalled()
  })

  it("starts without images when the collection has none", async () => {
    render(<EditCollectionModal collection={{ ...collection, imageUrl: null }} />)
    await userEvent.click(screen.getByRole("button", { name: "Edit" }))

    await screen.findByRole("dialog")

    expect(screen.queryByText("Saved")).not.toBeInTheDocument()
  })
})

describe("EditItemModal", () => {
  it("opens a prefilled item form", async () => {
    render(<EditItemModal item={item} />)
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole("button", { name: "Edit" }))

    expect(await screen.findByRole("dialog", { name: "Edit Item" })).toBeInTheDocument()
    expect(screen.getByLabelText("Name")).toHaveValue("Cadena Milan")
    expect(screen.getByLabelText("Price")).toHaveValue(100)
    expect(screen.getByText("oro")).toBeInTheDocument()
  })

  it("updates the item, closes the dialog and refreshes", async () => {
    render(<EditItemModal item={item} />)
    await userEvent.click(screen.getByRole("button", { name: "Edit" }))

    await userEvent.click(await screen.findByRole("button", { name: "Update Item" }))

    await waitFor(() => expect(routerMock.refresh).toHaveBeenCalled())
    expect(vi.mocked(fetch).mock.calls[0][0]).toBe("/api/admin/items/i1")
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
  })

  it("closes with Cancel", async () => {
    render(<EditItemModal item={item} />)
    await userEvent.click(screen.getByRole("button", { name: "Edit" }))

    await userEvent.click(await screen.findByRole("button", { name: "Cancel" }))

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
  })
})
