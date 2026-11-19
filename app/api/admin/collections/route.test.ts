import { NextRequest } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { prismaMock, resetPrismaMock } from "@/tests/mocks/prisma"

// The admin gate is thinly mocked at the module boundary; its own behavior is not under test here.
vi.mock("@/modules/users/server", () => ({ requireAdmin: vi.fn(async () => "admin_1") }))
vi.mock("@/shared/lib/prisma", async () => (await import("@/tests/mocks/prisma")).prismaModule)

import { GET, POST } from "./route"

const post = (body: unknown) =>
  new NextRequest("http://localhost/api/admin/collections", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  })

beforeEach(() => {
  resetPrismaMock()
  vi.spyOn(console, "error").mockImplementation(() => {})
})

describe("POST /api/admin/collections", () => {
  it("rejects a duplicated slug with 400 and does not create anything", async () => {
    prismaMock.collection.findUnique.mockResolvedValue({ id: "c1" })

    const response = await POST(post({ name: "Cadenas", slug: "cadenas" }))

    expect(response.status).toBe(400)
    expect((await response.json()).error).toBe("Ya existe una colección con este slug")
    expect(prismaMock.collection.create).not.toHaveBeenCalled()
  })

  it("creates the collection normalising empty optional fields to null", async () => {
    prismaMock.collection.findUnique.mockResolvedValue(null)
    prismaMock.collection.create.mockResolvedValue({ id: "c1" })

    const response = await POST(post({ name: "Cadenas", slug: "cadenas", description: "", imageUrl: "" }))

    expect(prismaMock.collection.create).toHaveBeenCalledWith({
      data: { name: "Cadenas", slug: "cadenas", description: null, imageUrl: null, isActive: true },
    })
    expect(await response.json()).toEqual({ id: "c1" })
  })

  it("keeps an explicit isActive=false", async () => {
    prismaMock.collection.findUnique.mockResolvedValue(null)

    await POST(post({ name: "x", slug: "x", isActive: false }))

    expect(prismaMock.collection.create.mock.calls[0][0].data.isActive).toBe(false)
  })

  it("answers a generic 500 when the database fails", async () => {
    prismaMock.collection.findUnique.mockRejectedValue(new Error("db down"))

    const response = await POST(post({ name: "x", slug: "x" }))

    expect(response.status).toBe(500)
    expect(await response.json()).toEqual({ error: "No se pudo crear la colección" })
  })
})

describe("GET /api/admin/collections", () => {
  it("lists collections newest first with their item count", async () => {
    prismaMock.collection.findMany.mockResolvedValue([{ id: "c1", _count: { items: 3 } }])

    const response = await GET(new NextRequest("http://localhost/api/admin/collections"))

    expect(prismaMock.collection.findMany).toHaveBeenCalledWith({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { items: true } } },
    })
    expect(await response.json()).toEqual([{ id: "c1", _count: { items: 3 } }])
  })

  it("answers 500 when the database fails", async () => {
    prismaMock.collection.findMany.mockRejectedValue(new Error("db down"))

    const response = await GET(new NextRequest("http://localhost/api/admin/collections"))

    expect(response.status).toBe(500)
  })
})
