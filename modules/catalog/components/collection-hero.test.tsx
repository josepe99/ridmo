import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

vi.mock("next/image", async () => await import("@/tests/mocks/next-image"))
vi.mock("next/link", async () => await import("@/tests/mocks/next-link"))

import CollectionHero from "./collection-hero"
import type { CollectionSummary } from "../types"

const collection = (n: number, overrides: Partial<CollectionSummary> = {}): CollectionSummary => ({
  id: `c${n}`,
  name: `Coleccion ${n}`,
  slug: `coleccion-${n}`,
  description: `Descripcion ${n}`,
  imageUrl: `https://res.cloudinary.com/c${n}.jpg`,
  ...overrides,
})

const heading = () => screen.getByText(/^COLECCION \d$/)

describe("CollectionHero", () => {
  it("renders nothing when there are no collections (empty guard)", () => {
    const { container } = render(<CollectionHero collections={[]} />)

    expect(container).toBeEmptyDOMElement()
  })

  it("shows the first collection with an uppercase name, description and link", () => {
    render(<CollectionHero collections={[collection(1), collection(2)]} />)

    expect(heading()).toHaveTextContent("COLECCION 1")
    expect(screen.getByText("Descripcion 1")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "DESCUBRIR" })).toHaveAttribute("href", "/coleccion-1")
    expect(screen.getByRole("img", { name: "Coleccion 1" })).toHaveAttribute(
      "src",
      "https://res.cloudinary.com/c1.jpg"
    )
  })

  it("falls back to a placeholder image when the collection has none", () => {
    render(<CollectionHero collections={[collection(1, { imageUrl: null })]} />)

    expect(screen.getByRole("img")).toHaveAttribute("src", expect.stringContaining("/placeholder.svg"))
  })

  it("hides the navigation controls for a single collection", () => {
    render(<CollectionHero collections={[collection(1)]} />)

    expect(screen.queryByRole("button", { name: "Anterior" })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Siguiente" })).not.toBeInTheDocument()
  })

  it("moves to the next collection", async () => {
    render(<CollectionHero collections={[collection(1), collection(2), collection(3)]} />)

    await userEvent.click(screen.getByRole("button", { name: "Siguiente" }))

    expect(heading()).toHaveTextContent("COLECCION 2")
  })

  it("wraps from the last collection to the first when going next", async () => {
    render(<CollectionHero collections={[collection(1), collection(2)]} />)

    await userEvent.click(screen.getByRole("button", { name: "Siguiente" }))
    await userEvent.click(screen.getByRole("button", { name: "Siguiente" }))

    expect(heading()).toHaveTextContent("COLECCION 1")
  })

  it("wraps from the first collection to the last when going back", async () => {
    render(<CollectionHero collections={[collection(1), collection(2), collection(3)]} />)

    await userEvent.click(screen.getByRole("button", { name: "Anterior" }))

    expect(heading()).toHaveTextContent("COLECCION 3")
  })

  it("goes back one collection at a time", async () => {
    render(<CollectionHero collections={[collection(1), collection(2), collection(3)]} />)

    await userEvent.click(screen.getByRole("button", { name: "Siguiente" }))
    await userEvent.click(screen.getByRole("button", { name: "Anterior" }))

    expect(heading()).toHaveTextContent("COLECCION 1")
  })

  it("updates the link target when the active collection changes", async () => {
    render(<CollectionHero collections={[collection(1), collection(2)]} />)

    await userEvent.click(screen.getByRole("button", { name: "Siguiente" }))

    expect(screen.getByRole("link", { name: "DESCUBRIR" })).toHaveAttribute("href", "/coleccion-2")
  })
})
