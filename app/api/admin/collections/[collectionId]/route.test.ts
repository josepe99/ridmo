import { NextRequest } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

const controller = vi.hoisted(() => ({ updateCollection: vi.fn(), getCollectionById: vi.fn() }))

// The admin gate is thinly mocked at the module boundary; its own behavior is not under test here.
vi.mock("@/modules/users/server", () => ({ requireAdmin: vi.fn(async () => "admin_1") }))
vi.mock("@/modules/admin/server", () => ({
  CollectionController: class {
    updateCollection = controller.updateCollection
    getCollectionById = controller.getCollectionById
  },
}))

import { PUT } from "./route"

const put = (body: unknown) =>
  new NextRequest("http://localhost/api/admin/collections/c1", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  })

beforeEach(() => {
  controller.updateCollection.mockReset()
  controller.getCollectionById.mockReset()
  vi.spyOn(console, "error").mockImplementation(() => {})
})

describe("PUT /api/admin/collections/[collectionId]", () => {
  it("updates and returns the refreshed collection", async () => {
    controller.updateCollection.mockResolvedValue({ id: "c1" })
    controller.getCollectionById.mockResolvedValue({ id: "c1", name: "Nuevo" })

    const response = await PUT(put({ name: "Nuevo" }), { params: Promise.resolve({ collectionId: "c1" }) })

    expect(controller.updateCollection).toHaveBeenCalledWith("c1", { name: "Nuevo" })
    expect(await response.json()).toEqual({ id: "c1", name: "Nuevo" })
  })

  // Regression: Next 16 hands route handlers `params` as a Promise; reading it synchronously
  // used to make the id undefined at runtime.
  it("awaits the Promise-based params of Next 16", async () => {
    controller.updateCollection.mockResolvedValue({ id: "c1" })
    controller.getCollectionById.mockResolvedValue({ id: "c1" })

    await PUT(put({ name: "Nuevo" }), { params: Promise.resolve({ collectionId: "c1" }) })

    expect(controller.updateCollection).toHaveBeenCalledWith("c1", { name: "Nuevo" })
  })

  it("answers 404 when the update returns nothing", async () => {
    controller.updateCollection.mockResolvedValue(null)

    const response = await PUT(put({ name: "x" }), { params: Promise.resolve({ collectionId: "c1" }) })

    expect(response.status).toBe(404)
    expect(controller.getCollectionById).not.toHaveBeenCalled()
  })

  it("answers 500 when validation or the database fails", async () => {
    controller.updateCollection.mockRejectedValue(new Error("invalid"))

    const response = await PUT(put({ name: "" }), { params: Promise.resolve({ collectionId: "c1" }) })

    expect(response.status).toBe(500)
    expect(await response.json()).toEqual({ error: "No se pudo actualizar la colección" })
  })
})
