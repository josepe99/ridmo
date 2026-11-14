import { beforeEach, describe, expect, it, vi } from "vitest"

const collections = vi.hoisted(() => ({ getCollectionById: vi.fn(), getByAdmin: vi.fn() }))
const files = vi.hoisted(() => ({
  uploadImage: vi.fn(),
  getImage: vi.fn(),
  getImages: vi.fn(),
  removeImage: vi.fn(),
}))
const items = vi.hoisted(() => ({ getItems: vi.fn(), getItemById: vi.fn() }))

// Authorization is covered in admin-actions.auth.test.ts; here the caller is an admin.
vi.mock("@/modules/users/server", () => ({ requireAdmin: vi.fn(async () => "admin_1") }))
vi.mock("../services/controllers/collection.controller", () => ({
  CollectionController: class {
    getCollectionById = collections.getCollectionById
    getByAdmin = collections.getByAdmin
  },
}))
vi.mock("../services/controllers/file.controller", () => ({
  FileController: class {
    uploadImage = files.uploadImage
    getImage = files.getImage
    getImages = files.getImages
    removeImage = files.removeImage
  },
}))
vi.mock("../services/controllers/item.controller", () => ({
  ItemController: class {
    getItems = items.getItems
    getItemById = items.getItemById
  },
}))
vi.mock("../services/datasources/cloudinary.datasource", () => ({}))

import { getByAdminAction, getCollectionById } from "./collections.actions"
import { getImage, getImages, removeImage, uploadImage } from "./file.actions"
import { getItemById, getItems, getItemsByCollectionId } from "./items.actions"

beforeEach(() => {
  for (const group of [collections, files, items]) {
    for (const fn of Object.values(group)) fn.mockReset()
  }
  vi.spyOn(console, "error").mockImplementation(() => {})
})

describe("collection actions", () => {
  it("getCollectionById wraps the result in a success envelope", async () => {
    collections.getCollectionById.mockResolvedValue({ id: "c1" })

    await expect(getCollectionById("c1")).resolves.toEqual({ success: true, data: { id: "c1" } })
  })

  it("getCollectionById converts exceptions into a failure envelope", async () => {
    collections.getCollectionById.mockRejectedValue(new Error("db down"))

    await expect(getCollectionById("c1")).resolves.toEqual({
      success: false,
      error: "Failed to fetch collection",
    })
  })

  it.each(["", "   "])("getByAdminAction requires an identifier (%j)", async (id) => {
    await expect(getByAdminAction(id)).resolves.toEqual({
      success: false,
      error: "Collection id is required",
    })
    expect(collections.getByAdmin).not.toHaveBeenCalled()
  })

  it("getByAdminAction trims the identifier before querying", async () => {
    collections.getByAdmin.mockResolvedValue({ id: "c1" })

    await expect(getByAdminAction("  cadenas ")).resolves.toEqual({ success: true, data: { id: "c1" } })
    expect(collections.getByAdmin).toHaveBeenCalledWith("cadenas")
  })

  it("getByAdminAction converts exceptions into a failure envelope", async () => {
    collections.getByAdmin.mockRejectedValue(new Error("x"))

    await expect(getByAdminAction("c1")).resolves.toEqual({
      success: false,
      error: "Failed to fetch collection",
    })
  })
})

describe("item actions", () => {
  it("getItems applies default paging", async () => {
    items.getItems.mockResolvedValue({ data: [] })

    await expect(getItems()).resolves.toEqual({ success: true, data: { data: [] } })
    expect(items.getItems).toHaveBeenCalledWith({
      page: 1,
      limit: 10,
      collectionId: undefined,
      search: undefined,
      isActive: undefined,
    })
  })

  it("getItemsByCollectionId fetches up to 100 active items", async () => {
    items.getItems.mockResolvedValue({ data: [] })

    await getItemsByCollectionId("c1")

    expect(items.getItems).toHaveBeenCalledWith({ page: 1, limit: 100, collectionId: "c1", isActive: true })
  })

  it("getItemById succeeds and fails with envelopes", async () => {
    items.getItemById.mockResolvedValueOnce({ id: "i1" }).mockRejectedValueOnce(new Error("x"))

    await expect(getItemById("i1")).resolves.toEqual({ success: true, data: { id: "i1" } })
    await expect(getItemById("i1")).resolves.toEqual({ success: false, error: "Failed to fetch item" })
  })

  it("getItems and getItemsByCollectionId report failures without leaking details", async () => {
    items.getItems.mockRejectedValue(new Error("secret"))

    await expect(getItems()).resolves.toEqual({ success: false, error: "Failed to fetch items" })
    await expect(getItemsByCollectionId("c1")).resolves.toEqual({
      success: false,
      error: "Failed to fetch items by collection",
    })
  })
})

describe("file actions", () => {
  it.each([
    ["uploadImage", () => uploadImage("x"), files.uploadImage, "Failed to upload file"],
    ["getImage", () => getImage("x"), files.getImage, "Failed to get file"],
    ["getImages", () => getImages(), files.getImages, "Failed to list files"],
    ["removeImage", () => removeImage("x"), files.removeImage, "Failed to remove file"],
  ])("%s returns a failure envelope when the controller throws", async (_name, call, mock, error) => {
    mock.mockRejectedValue(new Error("provider secret"))

    await expect(call()).resolves.toEqual({ success: false, error })
  })

  it("returns data on success and forwards options", async () => {
    files.uploadImage.mockResolvedValue({ url: "u" })
    files.getImage.mockResolvedValue({ publicId: "p" })
    files.getImages.mockResolvedValue([])
    files.removeImage.mockResolvedValue(undefined)

    await expect(uploadImage("x", { folder: "f" })).resolves.toEqual({ success: true, data: { url: "u" } })
    await expect(getImage("p")).resolves.toEqual({ success: true, data: { publicId: "p" } })
    await expect(getImages({ folder: "f" })).resolves.toEqual({ success: true, data: [] })
    await expect(removeImage("p")).resolves.toEqual({ success: true })
    expect(files.uploadImage).toHaveBeenCalledWith("x", { folder: "f" })
  })
})
