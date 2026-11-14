import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

vi.mock("next/link", async () => await import("@/tests/mocks/next-link"))

import CatalogBreadcrumb from "./catalog-breadcrumb"

describe("CatalogBreadcrumb", () => {
  it("shows only the home link when no labels are given", () => {
    render(<CatalogBreadcrumb />)

    expect(screen.getByRole("link", { name: "Inicio" })).toHaveAttribute("href", "/")
    expect(screen.getAllByRole("listitem")).toHaveLength(1)
  })

  it("shows the collection as the current page on a collection page", () => {
    render(<CatalogBreadcrumb collectionLabel="Cadenas" collectionHref="/cadenas" />)

    const current = screen.getByText("Cadenas")
    expect(current).toHaveAttribute("aria-current", "page")
    expect(current.closest("a")).toBeNull()
  })

  it("links the collection and marks the product as current on a product page", () => {
    render(
      <CatalogBreadcrumb collectionLabel="Cadenas" collectionHref="/cadenas" productLabel="Cadena Milan" />
    )

    expect(screen.getByRole("link", { name: "Cadenas" })).toHaveAttribute("href", "/cadenas")
    expect(screen.getByText("Cadena Milan")).toHaveAttribute("aria-current", "page")
  })

  it("keeps the collection as plain text on a product page when no href is known", () => {
    render(<CatalogBreadcrumb collectionLabel="Cadenas" productLabel="Cadena Milan" />)

    expect(screen.getByText("Cadenas").closest("a")).toBeNull()
  })

  it("is exposed as a breadcrumb navigation landmark", () => {
    render(<CatalogBreadcrumb collectionLabel="Cadenas" />)

    expect(screen.getByRole("navigation", { name: "breadcrumb" })).toBeInTheDocument()
  })

  it("merges custom classes on the wrapper", () => {
    const { container } = render(<CatalogBreadcrumb className="mb-1" />)

    expect(container.firstChild).toHaveClass("mb-1")
  })
})
