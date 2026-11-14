import { beforeEach, describe, expect, it, vi } from "vitest"
import { prismaMock, resetPrismaMock } from "@/tests/mocks/prisma"

// The admin gate is thinly mocked at the module boundary; its own behavior is not under test here.
vi.mock("@/modules/users/server", () => ({ requireAdmin: vi.fn(async () => "admin_1") }))
vi.mock("@/shared/lib/prisma", async () => (await import("@/tests/mocks/prisma")).prismaModule)
vi.mock("./create-page-client", () => ({ CreateItemPageClient: () => null }))

import CreateItemPage from "./page"

const collections = [
  { id: "c1", name: "Cadenas" },
  { id: "c2", name: "Relojes" },
]

const propsOf = async (searchParams?: Promise<{ collectionId?: string | string[] }>) => {
  const element = await CreateItemPage({ searchParams })
  return element.props as { collections: typeof collections; defaultCollectionId?: string }
}

beforeEach(() => {
  resetPrismaMock()
  prismaMock.collection.findMany.mockResolvedValue(collections)
})

describe("create item page", () => {
  it("lists collections alphabetically and defaults to the first one", async () => {
    const props = await propsOf()

    expect(prismaMock.collection.findMany).toHaveBeenCalledWith({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    })
    expect(props.collections).toEqual(collections)
    expect(props.defaultCollectionId).toBe("c1")
  })

  it("preselects the collection from the query string when it exists", async () => {
    const props = await propsOf(Promise.resolve({ collectionId: "c2" }))

    expect(props.defaultCollectionId).toBe("c2")
  })

  it("uses the first value of a repeated query parameter", async () => {
    const props = await propsOf(Promise.resolve({ collectionId: ["c2", "c1"] }))

    expect(props.defaultCollectionId).toBe("c2")
  })

  it("ignores an unknown collection id and falls back to the first", async () => {
    const props = await propsOf(Promise.resolve({ collectionId: "nope" }))

    expect(props.defaultCollectionId).toBe("c1")
  })

  it("has no default when there are no collections", async () => {
    prismaMock.collection.findMany.mockResolvedValue([])

    const props = await propsOf()

    expect(props.defaultCollectionId).toBeUndefined()
  })
})
