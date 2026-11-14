import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

vi.mock("next/image", async () => await import("@/tests/mocks/next-image"))
vi.mock("next/link", async () => await import("@/tests/mocks/next-link"))

import GridProductCard from "./grid-product-card"
import type { ProductSummary } from "../../types"

const product: ProductSummary = {
  id: "i1",
  name: "Cadena Milan",
  slug: "cadena-milan",
  price: 3_900_000,
  image: "https://res.cloudinary.com/a.jpg",
}

describe("GridProductCard", () => {
  it("shows the name, the formatted price and the product image", () => {
    render(<GridProductCard product={product} />)

    expect(screen.getByText("Cadena Milan")).toBeInTheDocument()
    expect(screen.getByText("Gs. 3.900.000")).toBeInTheDocument()
    expect(screen.getByRole("img", { name: "Cadena Milan" })).toHaveAttribute("src", product.image)
  })

  it("links to the product under the collection slug passed by the grid", () => {
    render(<GridProductCard product={product} collectionSlug="cadenas" />)

    expect(screen.getByRole("link")).toHaveAttribute("href", "/cadenas/cadena-milan")
  })

  it("falls back to the collection slug carried by the product", () => {
    render(<GridProductCard product={{ ...product, collectionSlug: "pulseras" }} />)

    expect(screen.getByRole("link")).toHaveAttribute("href", "/pulseras/cadena-milan")
  })

  it("prefers the explicit collection slug over the product's", () => {
    render(<GridProductCard product={{ ...product, collectionSlug: "pulseras" }} collectionSlug="cadenas" />)

    expect(screen.getByRole("link")).toHaveAttribute("href", "/cadenas/cadena-milan")
  })

  it("links to the bare slug when no collection is known", () => {
    render(<GridProductCard product={product} />)

    expect(screen.getByRole("link")).toHaveAttribute("href", "/cadena-milan")
  })

  it("uses a placeholder when the product has no image", () => {
    render(<GridProductCard product={{ ...product, image: null }} />)

    expect(screen.getByRole("img")).toHaveAttribute("src", expect.stringContaining("/placeholder.svg"))
  })
})
