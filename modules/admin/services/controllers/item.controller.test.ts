import { NextRequest } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

const ds = vi.hoisted(() => ({
  findMany: vi.fn(),
  findById: vi.fn(),
  findBySlug: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  validateSlug: vi.fn(),
}))
const images = vi.hoisted(() => ({
  processFormDataImages: vi.fn(),
  uploadImages: vi.fn(),
  deleteImages: vi.fn(),
}))

vi.mock("../datasources/item.datasource", () => ({
  ItemDatasource: class {
    findMany = ds.findMany
    findById = ds.findById
    findBySlug = ds.findBySlug
    create = ds.create
    update = ds.update
    delete = ds.delete
    validateSlug = ds.validateSlug
  },
}))
vi.mock("./image.controller", () => ({
  ImageController: class {
    processFormDataImages = images.processFormDataImages
    uploadImages = images.uploadImages
    deleteImages = images.deleteImages
  },
}))

import { ItemController } from "./item.controller"

const controller = new ItemController()

type RequestInit = NonNullable<ConstructorParameters<typeof NextRequest>[1]>

const req = (path: string, init: RequestInit = {}) => new NextRequest(`http://localhost${path}`, init)
const json = (body: unknown, method = "POST") => ({
  method,
  headers: { "content-type": "application/json" },
  body: JSON.stringify(body),
})

const validItem = { name: "Cadena", slug: "cadena", price: 10, collectionId: "c1" }

beforeEach(() => {
  for (const fn of [...Object.values(ds), ...Object.values(images)]) fn.mockReset()
  images.processFormDataImages.mockResolvedValue([])
  images.deleteImages.mockResolvedValue({ success: [], failed: [] })
  vi.spyOn(console, "error").mockImplementation(() => {})
})

describe("action helpers", () => {
  it("getItems defaults to page 1 / limit 10", async () => {
    await controller.getItems()

    expect(ds.findMany).toHaveBeenCalledWith({
      page: 1,
      limit: 10,
      collectionId: undefined,
      search: undefined,
      isActive: undefined,
    })
  })

  it("getItemById and getItemBySlug include the collection", async () => {
    await controller.getItemById("i1")
    await controller.getItemBySlug("cadena")

    expect(ds.findById).toHaveBeenCalledWith("i1", true)
    expect(ds.findBySlug).toHaveBeenCalledWith("cadena", true)
  })
})

describe("GET", () => {
  it("lists items using the parsed query (collection, search, isActive)", async () => {
    ds.findMany.mockResolvedValue({ data: [] })

    await controller.GET(req("/api/admin/items?page=2&limit=3&collection=c1&search=oro&isActive=true"))

    expect(ds.findMany).toHaveBeenCalledWith({
      page: 2,
      limit: 3,
      collectionId: "c1",
      search: "oro",
      isActive: true,
    })
  })

  // SUSPECTED BUG (item.controller.ts:29): the isActive transform maps an absent
  // param to `false`, so an unfiltered listing only returns INACTIVE items.
  it("does not filter by isActive when the query omits it", async () => {
    ds.findMany.mockResolvedValue({ data: [] })

    await controller.GET(req("/api/admin/items"))

    expect(ds.findMany.mock.calls[0][0].isActive).toBeUndefined()
  })

  it("returns one item by id and 404s for an unknown id", async () => {
    ds.findById.mockResolvedValueOnce({ id: "i1" }).mockResolvedValueOnce(null)

    const found = await controller.GET(req("/api/admin/items/i1"))
    const missing = await controller.GET(req("/api/admin/items/i2"))

    expect(found.status).toBe(200)
    expect(missing.status).toBe(404)
  })
})

describe("POST (JSON)", () => {
  it("validates, checks the slug is free and creates the item with 201", async () => {
    ds.create.mockResolvedValue({ id: "i1" })

    const response = await controller.POST(req("/api/admin/items", json(validItem)))

    expect(ds.validateSlug).toHaveBeenCalledWith("cadena")
    expect(ds.create).toHaveBeenCalledWith(expect.objectContaining({ ...validItem, inventory: 0, isActive: true }))
    expect(response.status).toBe(201)
  })

  it("answers 400 with the validation message and never creates when data is invalid", async () => {
    const response = await controller.POST(req("/api/admin/items", json({ ...validItem, price: -1 })))

    expect(response.status).toBe(400)
    expect(ds.create).not.toHaveBeenCalled()
  })

  it("answers 400 when the slug is already taken", async () => {
    ds.validateSlug.mockRejectedValue(new Error("An item with this slug already exists"))

    const response = await controller.POST(req("/api/admin/items", json(validItem)))

    expect(response.status).toBe(400)
    expect((await response.json()).error).toBe("An item with this slug already exists")
    expect(ds.create).not.toHaveBeenCalled()
  })
})

describe("POST (multipart)", () => {
  const form = () => {
    const data = new FormData()
    data.set("name", "Cadena")
    data.set("slug", "cadena")
    data.set("price", "12.5")
    data.set("inventory", "3")
    data.set("collectionId", "c1")
    data.set("tags", JSON.stringify(["oro"]))
    data.set("isActive", "true")
    return data
  }
  const post = () => controller.POST(req("/api/admin/items", { method: "POST", body: form() }))

  it("uploads images and stores their URLs on the new item", async () => {
    images.processFormDataImages.mockResolvedValue([new File(["x"], "a.jpg")])
    images.uploadImages.mockResolvedValue([{ url: "https://res.cloudinary.com/a.jpg", publicId: "a" }])
    ds.create.mockResolvedValue({ id: "i1" })

    const response = await post()

    expect(response.status).toBe(201)
    expect(ds.create).toHaveBeenCalledWith(
      expect.objectContaining({
        price: 12.5,
        inventory: 3,
        tags: ["oro"],
        isActive: true,
        images: ["https://res.cloudinary.com/a.jpg"],
      })
    )
    expect((await response.json()).data.uploadedImages).toHaveLength(1)
  })

  it("cleans up the uploaded images when the item cannot be created", async () => {
    images.processFormDataImages.mockResolvedValue([new File(["x"], "a.jpg")])
    images.uploadImages.mockResolvedValue([{ url: "u", publicId: "a" }])
    ds.create.mockRejectedValue(new Error("db down"))

    const response = await post()

    expect(response.status).toBe(400)
    expect(images.deleteImages).toHaveBeenCalledWith(["a"])
  })

  it("does not call cleanup when nothing was uploaded", async () => {
    ds.create.mockRejectedValue(new Error("db down"))

    await post()

    expect(images.deleteImages).not.toHaveBeenCalled()
  })
})

describe("PUT", () => {
  it("updates only the provided fields (JSON body)", async () => {
    ds.update.mockResolvedValue({ id: "i1" })

    const response = await controller.PUT(req("/api/admin/items/i1", json({ price: 20 }, "PUT")))

    expect(ds.update).toHaveBeenCalledWith("i1", { price: 20 })
    expect(ds.validateSlug).not.toHaveBeenCalled()
    expect(response.status).toBe(200)
  })

  it("checks slug uniqueness excluding the item being edited", async () => {
    ds.update.mockResolvedValue({ id: "i1" })

    await controller.PUT(req("/api/admin/items/i1", json({ slug: "nuevo" }, "PUT")))

    expect(ds.validateSlug).toHaveBeenCalledWith("nuevo", "i1")
  })

  it("merges existing image URLs with new uploads (multipart body)", async () => {
    images.processFormDataImages.mockResolvedValue([new File(["x"], "n.jpg")])
    images.uploadImages.mockResolvedValue([{ url: "https://res.cloudinary.com/new.jpg", publicId: "new" }])
    ds.update.mockResolvedValue({ id: "i1" })
    const data = new FormData()
    data.set("name", "Nuevo nombre")
    data.set("existingImages", JSON.stringify(["https://res.cloudinary.com/old.jpg"]))

    await controller.PUT(req("/api/admin/items/i1", { method: "PUT", body: data }))

    expect(ds.update).toHaveBeenCalledWith("i1", {
      name: "Nuevo nombre",
      images: ["https://res.cloudinary.com/old.jpg", "https://res.cloudinary.com/new.jpg"],
    })
  })

  it("cleans up freshly uploaded images when the update fails", async () => {
    images.processFormDataImages.mockResolvedValue([new File(["x"], "n.jpg")])
    images.uploadImages.mockResolvedValue([{ url: "u", publicId: "new" }])
    ds.update.mockRejectedValue(new Error("db down"))
    const data = new FormData()
    data.set("name", "x")

    const response = await controller.PUT(req("/api/admin/items/i1", { method: "PUT", body: data }))

    expect(response.status).toBe(400)
    expect(images.deleteImages).toHaveBeenCalledWith(["new"])
  })

  it("answers 400 for invalid data", async () => {
    const response = await controller.PUT(req("/api/admin/items/i1", json({ price: -5 }, "PUT")))

    expect(response.status).toBe(400)
    expect(ds.update).not.toHaveBeenCalled()
  })
})

describe("DELETE", () => {
  it("deletes by the last path segment", async () => {
    ds.delete.mockResolvedValue({})

    const response = await controller.DELETE(req("/api/admin/items/i1", { method: "DELETE" }))

    expect(ds.delete).toHaveBeenCalledWith("i1")
    expect(response.status).toBe(200)
  })

  it("answers a generic 500 when the delete fails", async () => {
    ds.delete.mockRejectedValue(new Error("db down"))

    const response = await controller.DELETE(req("/api/admin/items/i1", { method: "DELETE" }))

    expect(response.status).toBe(500)
  })
})
