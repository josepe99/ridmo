import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

vi.mock("next/image", async () => await import("@/tests/mocks/next-image"))
vi.mock("next/link", async () => await import("@/tests/mocks/next-link"))

import ProductsGrid from "./products-grid"
import type { ProductSummary } from "../../types"

const products: ProductSummary[] = [1, 2, 3].map((n) => ({
  id: `i${n}`,
  name: `Producto ${n}`,
  slug: `producto-${n}`,
  price: n * 1000,
  image: `https://res.cloudinary.com/${n}.jpg`,
}))

describe("ProductsGrid", () => {
  it("renders nothing when there are no products", () => {
    const { container } = render(<ProductsGrid products={[]} title="Vacio" />)

    expect(container).toBeEmptyDOMElement()
  })

  it("renders nothing when products is missing", () => {
    const { container } = render(<ProductsGrid products={undefined as unknown as ProductSummary[]} />)

    expect(container).toBeEmptyDOMElement()
  })

  it("renders one card per product", () => {
    render(<ProductsGrid products={products} />)

    expect(screen.getAllByRole("link")).toHaveLength(3)
    expect(screen.getByText("Producto 2")).toBeInTheDocument()
  })

  it("shows the title as a heading when provided", () => {
    render(<ProductsGrid products={products} title="Cadenas" />)

    expect(screen.getByRole("heading", { level: 2, name: "Cadenas" })).toBeInTheDocument()
  })

  it("omits the heading when there is no title", () => {
    render(<ProductsGrid products={products} />)

    expect(screen.queryByRole("heading")).not.toBeInTheDocument()
  })

  it("passes the collection slug down to every card link", () => {
    render(<ProductsGrid products={products} collectionSlug="cadenas" />)

    expect(screen.getAllByRole("link").map((link) => link.getAttribute("href"))).toEqual([
      "/cadenas/producto-1",
      "/cadenas/producto-2",
      "/cadenas/producto-3",
    ])
  })
})
