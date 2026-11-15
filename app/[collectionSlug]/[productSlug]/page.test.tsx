import { render, screen, within } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { resetNavigationMock } from "@/tests/mocks/next-navigation"

vi.mock("next/navigation", async () => await import("@/tests/mocks/next-navigation"))
vi.mock("next/image", async () => await import("@/tests/mocks/next-image"))
vi.mock("next/link", async () => await import("@/tests/mocks/next-link"))
vi.mock("@/modules/catalog/server", () => ({ getProductBySlug: vi.fn() }))

import { getProductBySlug } from "@/modules/catalog/server"
import ProductPage, { generateMetadata } from "./page"

const product = {
  id: "i1",
  name: "Cadena Milan",
  slug: "cadena-milan",
  description: "Oro de 18k",
  price: 3_900_000,
  images: ["https://res.cloudinary.com/1.jpg", "https://res.cloudinary.com/2.jpg"],
  collectionSlug: "cadenas",
}

const props = { params: { collectionSlug: "cadenas", productSlug: "cadena-milan" } }

beforeEach(() => {
  resetNavigationMock()
  localStorage.clear()
  vi.mocked(getProductBySlug).mockReset().mockResolvedValue(product)
  vi.spyOn(console, "error").mockImplementation(() => {})
})

describe("product page", () => {
  it("shows the name, price and description", async () => {
    render(await ProductPage(props))

    expect(screen.getByRole("heading", { level: 1, name: "Cadena Milan" })).toBeInTheDocument()
    expect(screen.getByText("Gs. 3.900.000")).toBeInTheDocument()
    expect(screen.getByText("Oro de 18k")).toBeInTheDocument()
  })

  it("lists the shipping costs from the shared Paraguay shipping model", async () => {
    render(await ProductPage(props))

    const list = screen.getByText("Costos de envío").closest("details") as HTMLElement
    const rows = within(list).getAllByRole("listitem")
    expect(rows).toHaveLength(10)
    expect(within(rows[0]).getByText("Asunción, Villa Elisa, Fernando de la Mora")).toBeInTheDocument()
    expect(within(rows[0]).getByText("Gs. 20.000")).toBeInTheDocument()
    expect(within(rows[1]).getByText("Lambaré")).toBeInTheDocument()
    expect(within(rows[1]).getByText("Gs. 15.000")).toBeInTheDocument()
    expect(within(rows[7]).getByText("Gs. 30.000")).toBeInTheDocument()
    expect(within(rows[8]).getByText("Interior del país, entrega en puerta")).toBeInTheDocument()
    expect(within(rows[8]).getByText("Gs. 35.000")).toBeInTheDocument()
    expect(within(rows[9]).getByText("Internacional (DHL)")).toBeInTheDocument()
    expect(within(rows[9]).getByText("A cotizar")).toBeInTheDocument()
    expect(within(rows[9]).getByText("Según país y peso. Llega en 5 días aproximadamente")).toBeInTheDocument()
  })

  it("uses the first two images for the hero and falls back to the first when there is only one", async () => {
    vi.mocked(getProductBySlug).mockResolvedValue({ ...product, images: [product.images[0]] })

    render(await ProductPage(props))

    expect(screen.getByRole("img", { name: "Cadena Milan view 1" })).toHaveAttribute("src", product.images[0])
    expect(screen.getByRole("img", { name: "Cadena Milan view 2" })).toHaveAttribute("src", product.images[0])
  })

  it("uses a placeholder when the product has no images", async () => {
    vi.mocked(getProductBySlug).mockResolvedValue({ ...product, images: [] })

    render(await ProductPage(props))

    expect(screen.getByRole("img", { name: "Cadena Milan view 1" })).toHaveAttribute(
      "src",
      expect.stringContaining("/placeholder.svg")
    )
  })

  it("ignores empty image URLs", async () => {
    vi.mocked(getProductBySlug).mockResolvedValue({ ...product, images: ["", product.images[1]] })

    render(await ProductPage(props))

    expect(screen.getByRole("img", { name: "Cadena Milan view 1" })).toHaveAttribute("src", product.images[1])
  })

  it("counts the thumbnails beyond the first five", async () => {
    const images = Array.from({ length: 8 }, (_, i) => `https://res.cloudinary.com/${i}.jpg`)
    vi.mocked(getProductBySlug).mockResolvedValue({ ...product, images })

    render(await ProductPage(props))

    expect(screen.getByText("+3")).toBeInTheDocument()
  })

  it("adds the product to the cart from the page", async () => {
    render(await ProductPage(props))

    const addButton = screen.getByRole("button", { name: /Agregar al carrito/ })
    addButton.click()

    const cart = JSON.parse(localStorage.getItem("cart") ?? "[]")
    expect(cart).toEqual([
      expect.objectContaining({ id: "i1", price: 3_900_000, quantity: 1, image: product.images[0] }),
    ])
  })

  it("keeps the thumbnails accessible", async () => {
    render(await ProductPage(props))

    expect(within(document.body).getByRole("button", { name: "Thumbnail 1" })).toBeInTheDocument()
  })

  it("answers not found when the product does not exist", async () => {
    vi.mocked(getProductBySlug).mockRejectedValue(new Error("Item not found"))

    await expect(ProductPage(props)).rejects.toThrow("NEXT_NOT_FOUND")
  })
})

describe("product page metadata", () => {
  it("builds title, description and Open Graph data from the product", async () => {
    const metadata = await generateMetadata(props)

    expect(metadata.title).toBe("Cadena Milan | RIDMO")
    expect(metadata.description).toBe("Oro de 18k")
    expect(metadata.openGraph?.images).toEqual([
      expect.objectContaining({ url: product.images[0], alt: "Cadena Milan - RIDMO" }),
    ])
    expect(metadata.alternates?.canonical).toContain("/cadenas/cadena-milan")
  })

  it("falls back when the product has no description, images or collection", async () => {
    vi.mocked(getProductBySlug).mockResolvedValue({
      ...product,
      description: null,
      images: [],
      collectionSlug: null,
    })

    const metadata = await generateMetadata(props)

    expect(metadata.description).toBe("Descubre la mejor moda urbana en RIDMO.")
    expect(metadata.openGraph?.images).toEqual([expect.objectContaining({ url: "/placeholder.jpg" })])
    expect(metadata.alternates?.canonical).toContain("/cadenas/cadena-milan")
  })

  it("returns empty metadata when the product does not exist", async () => {
    vi.mocked(getProductBySlug).mockRejectedValue(new Error("Item not found"))

    await expect(generateMetadata(props)).resolves.toEqual({})
  })
})
