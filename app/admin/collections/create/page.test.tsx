import { beforeEach, describe, expect, it, vi } from "vitest"

// The admin gate is thinly mocked at the module boundary; its own behavior is not under test here.
vi.mock("@/modules/users/server", () => ({ requireAdmin: vi.fn(async () => "admin_1") }))
vi.mock("@/modules/admin/server", () => ({ uploadImage: vi.fn() }))
vi.mock("./create-page-client", () => ({ CreateCollectionPageClient: () => null }))

import { uploadImage } from "@/modules/admin/server"
import CreateCollectionPage from "./page"

type UploadHandler = (formData: FormData) => Promise<unknown>

async function getHandler() {
  const element = await CreateCollectionPage()
  return (element.props as { onUploadImage: UploadHandler }).onUploadImage
}

beforeEach(() => {
  vi.mocked(uploadImage).mockReset()
})

describe("create collection page upload handler", () => {
  it("rejects requests without a file", async () => {
    const handler = await getHandler()

    await expect(handler(new FormData())).resolves.toEqual({ success: false, error: "El archivo es obligatorio" })
    expect(uploadImage).not.toHaveBeenCalled()
  })

  it("rejects a text field posing as the file", async () => {
    const handler = await getHandler()
    const form = new FormData()
    form.set("file", "not a file")

    await expect(handler(form)).resolves.toEqual({ success: false, error: "El archivo es obligatorio" })
  })

  it("uploads the file to the collections folder to the ridmo folder", async () => {
    vi.mocked(uploadImage).mockResolvedValue({ success: true, data: { url: "https://res.cloudinary.com/x" } } as never)
    const handler = await getHandler()
    const file = new File(["x"], "a.png", { type: "image/png" })
    const form = new FormData()
    form.set("file", file)

    const result = await handler(form)

    expect(uploadImage).toHaveBeenCalledWith(file, { folder: "ridmo/collections" })
    expect(result).toEqual({ success: true, data: { url: "https://res.cloudinary.com/x" } })
  })
})
