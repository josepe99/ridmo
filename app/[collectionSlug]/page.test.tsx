import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { resetNavigationMock } from "@/tests/mocks/next-navigation"

vi.mock("next/navigation", async () => await import("@/tests/mocks/next-navigation"))
vi.mock("next/image", async () => await import("@/tests/mocks/next-image"))
vi.mock("next/link", async () => await import("@/tests/mocks/next-link"))
vi.mock("@/modules/catalog/server", () => ({
  getCollectionBySlug: vi.fn(),
  getProductsByCollectionSlug: vi.fn(),
}))

import { getCollectionBySlug, getProductsByCollectionSlug } from "@/modules/catalog/server"
import CollectionPage, { generateMetadata } from "./page"

const collection = {
  id: "c1",
  name: "Cadenas",
  slug: "cadenas",
  description: "Cadenas macizas",
  imageUrl: "https://res.cloudinary.com/cadenas.jpg",
}

const product = (n: number) => ({
  id: `i${n}`,
  name: `Producto ${n}`,
  slug: `producto-${n}`,
  price: 1000 * n,
  image: null,
  collectionSlug: "cadenas",
})

const props = { params: { collectionSlug: "cadenas" } }

beforeEach(() => {
  resetNavigationMock()
  vi.mocked(getCollectionBySlug).mockReset().mockResolvedValue(collection)
  vi.mocked(getProductsByCollectionSlug).mockReset().mockResolvedValue([])
  vi.spyOn(console, "error").mockImplementation(() => {})
})

describe("collection page", () => {
  it("renders the breadcrumb and a grid of products", async () => {
    vi.mocked(getProductsByCollectionSlug).mockResolvedValue([product(1), product(2)])

    render(await CollectionPage(props))

    expect(screen.getByText("Cadenas")).toHaveAttribute("aria-current", "page")
    expect(screen.getByText("Producto 1")).toBeInTheDocument()
    expect(screen.getByText("Producto 2")).toBeInTheDocument()
  })

  it("shows an empty state with a way back when the collection has no products", async () => {
    render(await CollectionPage(props))

    expect(screen.getByText("No hay productos disponibles")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Volver al inicio" })).toHaveAttribute("href", "/")
  })

  it("answers not found when the collection does not exist", async () => {
    vi.mocked(getCollectionBySlug).mockRejectedValue(new Error("Collection not found"))
    vi.mocked(getProductsByCollectionSlug).mockRejectedValue(new Error("Collection not found"))

    await expect(CollectionPage(props)).rejects.toThrow("NEXT_NOT_FOUND")
  })
})

describe("collection page metadata", () => {
  it("builds title, description and Open Graph data from the collection", async () => {
    const metadata = await generateMetadata({ params: { collectionSlug: "cadenas" } })

    expect(metadata.title).toBe("Cadenas | RIDMO")
    expect(metadata.description).toBe("Cadenas macizas")
    expect(metadata.openGraph?.images).toEqual([
      expect.objectContaining({ url: "https://res.cloudinary.com/cadenas.jpg", alt: "Cadenas - RIDMO" }),
    ])
    expect(metadata.alternates?.canonical).toContain("/cadenas")
  })

  it("truncates long descriptions to 160 characters", async () => {
    vi.mocked(getCollectionBySlug).mockResolvedValue({ ...collection, description: "x".repeat(400) })

    const metadata = await generateMetadata({ params: { collectionSlug: "cadenas" } })

    expect(metadata.description).toHaveLength(160)
  })

  it("falls back to a generated description and the brand image", async () => {
    vi.mocked(getCollectionBySlug).mockResolvedValue({ ...collection, description: null, imageUrl: null })

    const metadata = await generateMetadata({ params: Promise.resolve({ collectionSlug: "cadenas" }) })

    expect(metadata.description).toBe("Descubre la colección Cadenas en RIDMO.")
    expect(metadata.openGraph?.images).toEqual([expect.objectContaining({ url: "/images/ridmo-logo.png" })])
  })

  it("returns empty metadata when there are no params or the collection is missing", async () => {
    await expect(generateMetadata()).resolves.toEqual({})

    vi.mocked(getCollectionBySlug).mockRejectedValue(new Error("Collection not found"))
    await expect(generateMetadata({ params: { collectionSlug: "nope" } })).resolves.toEqual({})
  })
})
