import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

vi.mock("next/image", async () => await import("@/tests/mocks/next-image"))

import ProductGallery from "./product-gallery"

const images = ["https://res.cloudinary.com/0.jpg", "https://res.cloudinary.com/1.jpg", "https://res.cloudinary.com/2.jpg"]

const view = (n: 1 | 2) => screen.getByRole("img", { name: `Cadena Milan view ${n}` })

describe("ProductGallery", () => {
  it("starts on the first two images", () => {
    render(<ProductGallery name="Cadena Milan" images={images} />)

    expect(view(1)).toHaveAttribute("src", images[0])
    expect(view(2)).toHaveAttribute("src", images[1])
    expect(screen.getByRole("button", { name: "Thumbnail 1" })).toHaveAttribute("aria-pressed", "true")
  })

  it("shows the clicked thumbnail and the image after it", async () => {
    const user = userEvent.setup()
    render(<ProductGallery name="Cadena Milan" images={images} />)

    await user.click(screen.getByRole("button", { name: "Thumbnail 2" }))

    expect(view(1)).toHaveAttribute("src", images[1])
    expect(view(2)).toHaveAttribute("src", images[2])
    expect(screen.getByRole("button", { name: "Thumbnail 2" })).toHaveAttribute("aria-pressed", "true")
    expect(screen.getByRole("button", { name: "Thumbnail 1" })).toHaveAttribute("aria-pressed", "false")
  })

  it("moves forward with Next and wraps around at the end", async () => {
    const user = userEvent.setup()
    render(<ProductGallery name="Cadena Milan" images={images} />)

    await user.click(screen.getByRole("button", { name: "Next" }))
    await user.click(screen.getByRole("button", { name: "Next" }))

    expect(view(1)).toHaveAttribute("src", images[2])
    expect(view(2)).toHaveAttribute("src", images[0])

    await user.click(screen.getByRole("button", { name: "Next" }))

    expect(view(1)).toHaveAttribute("src", images[0])
  })

  it("moves back with Previous and wraps around at the start", async () => {
    const user = userEvent.setup()
    render(<ProductGallery name="Cadena Milan" images={images} />)

    await user.click(screen.getByRole("button", { name: "Previous" }))

    expect(view(1)).toHaveAttribute("src", images[2])
  })

  it("shows the same image twice and disables navigation with a single image", () => {
    render(<ProductGallery name="Cadena Milan" images={[images[0]]} />)

    expect(view(1)).toHaveAttribute("src", images[0])
    expect(view(2)).toHaveAttribute("src", images[0])
    expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled()
  })

  it("counts the thumbnails beyond the first five", () => {
    const many = Array.from({ length: 8 }, (_, i) => `https://res.cloudinary.com/${i}.jpg`)
    render(<ProductGallery name="Cadena Milan" images={many} />)

    expect(screen.getAllByRole("button", { name: /^Thumbnail/ })).toHaveLength(5)
    expect(screen.getByText("+3")).toBeInTheDocument()
  })
})
