import { NextRequest } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

const ds = vi.hoisted(() => ({
  findMany: vi.fn(),
  findById: vi.fn(),
  findBySlug: vi.fn(),
  getByAdmin: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
}))

vi.mock("../datasources/collection.datasource", () => ({
  CollectionDatasource: class {
    findMany = ds.findMany
    findById = ds.findById
    findBySlug = ds.findBySlug
    getByAdmin = ds.getByAdmin
    create = ds.create
    update = ds.update
    delete = ds.delete
  },
}))

import { CollectionController } from "./collection.controller"

const controller = new CollectionController()

type RequestInit = NonNullable<ConstructorParameters<typeof NextRequest>[1]>

const req = (path: string, init: RequestInit = {}) =>
  new NextRequest(`http://localhost${path}`, init)

const json = (body: unknown, method = "POST") =>
  ({
    method,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  }) satisfies RequestInit

beforeEach(() => {
  for (const fn of Object.values(ds)) fn.mockReset()
  vi.spyOn(console, "error").mockImplementation(() => {})
})

describe("non-HTTP helpers used by server actions", () => {
  it("getCollections defaults to page 1 and limit 100", async () => {
    await controller.getCollections()

    expect(ds.findMany).toHaveBeenCalledWith({ page: 1, limit: 100, isActive: undefined })
  })

  it("getCollections forwards explicit paging and filters", async () => {
    await controller.getCollections({ page: 3, limit: 5, isActive: true })

    expect(ds.findMany).toHaveBeenCalledWith({ page: 3, limit: 5, isActive: true })
  })

  it("getCollectionBySlug does not include items", async () => {
    await controller.getCollectionBySlug("cadenas")

    expect(ds.findBySlug).toHaveBeenCalledWith("cadenas", false)
  })

  it("getCollectionById and getByAdmin delegate", async () => {
    await controller.getCollectionById("c1")
    await controller.getByAdmin("c1")

    expect(ds.findById).toHaveBeenCalledWith("c1")
    expect(ds.getByAdmin).toHaveBeenCalledWith("c1")
  })

  it("updateCollection validates before updating", async () => {
    ds.update.mockResolvedValue({ id: "c1" })

    await expect(controller.updateCollection("c1", { name: "" })).rejects.toThrow()
    expect(ds.update).not.toHaveBeenCalled()

    await expect(controller.updateCollection("c1", { name: "Nuevo" })).resolves.toEqual({ id: "c1" })
  })
})

describe("GET", () => {
  it("lists collections with parsed pagination", async () => {
    ds.findMany.mockResolvedValue({ data: [] })

    const response = await controller.GET(req("/api/admin/collections?page=2&limit=5&isActive=true"))

    expect(ds.findMany).toHaveBeenCalledWith({ page: 2, limit: 5, isActive: true })
    expect(await response.json()).toEqual({ success: true, data: { data: [] } })
  })

  it("defaults to page 1 and limit 10 when no query is given", async () => {
    ds.findMany.mockResolvedValue({ data: [] })

    await controller.GET(req("/api/admin/collections"))

    expect(ds.findMany).toHaveBeenCalledWith(expect.objectContaining({ page: 1, limit: 10 }))
  })

  // SUSPECTED BUG (collection.controller.ts:20): the isActive transform maps an absent
  // param to `false`, so an unfiltered listing only returns INACTIVE collections.
  it("does not filter by isActive when the query omits it", async () => {
    ds.findMany.mockResolvedValue({ data: [] })

    await controller.GET(req("/api/admin/collections"))

    expect(ds.findMany.mock.calls[0][0].isActive).toBeUndefined()
  })

  it("returns a single collection when the path ends with an id", async () => {
    ds.findById.mockResolvedValue({ id: "abc" })

    const response = await controller.GET(req("/api/admin/collections/abc"))

    expect(ds.findById).toHaveBeenCalledWith("abc")
    expect(await response.json()).toEqual({ success: true, data: { id: "abc" } })
  })

  it("answers 404 when the single collection does not exist", async () => {
    ds.findById.mockResolvedValue(null)

    const response = await controller.GET(req("/api/admin/collections/missing"))

    expect(response.status).toBe(404)
    expect(await response.json()).toEqual({ success: false, error: "Collection not found" })
  })
})

describe("POST", () => {
  it("creates a collection and answers 201", async () => {
    ds.create.mockResolvedValue({ id: "c1" })

    const response = await controller.POST(
      req("/api/admin/collections", json({ name: "Cadenas", slug: "cadenas" }))
    )

    expect(response.status).toBe(201)
    expect(ds.create).toHaveBeenCalledWith({ name: "Cadenas", slug: "cadenas", isActive: true })
  })

  it("answers 400 when required fields are missing", async () => {
    const response = await controller.POST(req("/api/admin/collections", json({ name: "" })))

    expect(response.status).toBe(400)
    expect(ds.create).not.toHaveBeenCalled()
  })
})

describe("PUT", () => {
  it("updates the collection identified by the last path segment", async () => {
    ds.update.mockResolvedValue({ id: "c1", name: "Nuevo" })

    const response = await controller.PUT(req("/api/admin/collections/c1", json({ name: "Nuevo" }, "PUT")))

    expect(ds.update).toHaveBeenCalledWith("c1", { name: "Nuevo" })
    expect(response.status).toBe(200)
  })

  it("answers 400 on invalid data", async () => {
    const response = await controller.PUT(req("/api/admin/collections/c1", json({ name: "" }, "PUT")))

    expect(response.status).toBe(400)
  })
})

describe("DELETE", () => {
  it("deletes by the last path segment", async () => {
    ds.delete.mockResolvedValue({})

    const response = await controller.DELETE(req("/api/admin/collections/c1", { method: "DELETE" }))

    expect(ds.delete).toHaveBeenCalledWith("c1")
    expect(await response.json()).toEqual({
      success: true,
      data: { message: "Collection deleted successfully" },
    })
  })

  it("answers a generic 500 when the datasource fails", async () => {
    ds.delete.mockRejectedValue(new Error("db down"))

    const response = await controller.DELETE(req("/api/admin/collections/c1", { method: "DELETE" }))

    expect(response.status).toBe(500)
  })
})
