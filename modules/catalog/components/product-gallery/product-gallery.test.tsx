import { render, screen, within } from "@testing-library/react"
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

  describe("full screen", () => {
    const open = async (user: ReturnType<typeof userEvent.setup>) =>
      user.click(screen.getByRole("button", { name: "Pantalla completa" }))

    it("is closed by default", () => {
      render(<ProductGallery name="Cadena Milan" images={images} />)

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    })

    it("opens on the active image", async () => {
      const user = userEvent.setup()
      render(<ProductGallery name="Cadena Milan" images={images} />)

      await user.click(screen.getByRole("button", { name: "Thumbnail 2" }))
      await open(user)

      const dialog = screen.getByRole("dialog")
      expect(dialog).toHaveAttribute("aria-modal", "true")
      expect(within(dialog).getByRole("img")).toHaveAttribute("src", images[1])
    })

    it("steps through the images and wraps around", async () => {
      const user = userEvent.setup()
      render(<ProductGallery name="Cadena Milan" images={images} />)
      await open(user)
      const dialog = screen.getByRole("dialog")

      await user.click(within(dialog).getByRole("button", { name: "Imagen anterior" }))
      expect(within(dialog).getByRole("img")).toHaveAttribute("src", images[2])

      await user.click(within(dialog).getByRole("button", { name: "Imagen siguiente" }))
      expect(within(dialog).getByRole("img")).toHaveAttribute("src", images[0])
    })

    it("navigates with the arrow keys", async () => {
      const user = userEvent.setup()
      render(<ProductGallery name="Cadena Milan" images={images} />)
      await open(user)

      await user.keyboard("{ArrowRight}")
      expect(within(screen.getByRole("dialog")).getByRole("img")).toHaveAttribute("src", images[1])

      await user.keyboard("{ArrowLeft}{ArrowLeft}")
      expect(within(screen.getByRole("dialog")).getByRole("img")).toHaveAttribute("src", images[2])
    })

    it("closes with the close button and with Escape", async () => {
      const user = userEvent.setup()
      render(<ProductGallery name="Cadena Milan" images={images} />)

      await open(user)
      await user.click(screen.getByRole("button", { name: "Cerrar pantalla completa" }))
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()

      await open(user)
      await user.keyboard("{Escape}")
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    })

    it("keeps the chosen image in the gallery after closing", async () => {
      const user = userEvent.setup()
      render(<ProductGallery name="Cadena Milan" images={images} />)

      await open(user)
      await user.keyboard("{ArrowRight}{Escape}")

      expect(view(1)).toHaveAttribute("src", images[1])
    })

    it("locks page scroll while open and restores it on close", async () => {
      const user = userEvent.setup()
      render(<ProductGallery name="Cadena Milan" images={images} />)

      await open(user)
      expect(document.body.style.overflow).toBe("hidden")

      await user.keyboard("{Escape}")
      expect(document.body.style.overflow).toBe("")
    })

    it("hides navigation when there is a single image", async () => {
      const user = userEvent.setup()
      render(<ProductGallery name="Cadena Milan" images={[images[0]]} />)
      await open(user)
      const dialog = screen.getByRole("dialog")

      expect(within(dialog).queryByRole("button", { name: "Imagen siguiente" })).not.toBeInTheDocument()
      expect(within(dialog).queryByRole("button", { name: "Imagen anterior" })).not.toBeInTheDocument()
    })
  })

  describe("hero images", () => {
    const heroButton = (n: 1 | 2) => view(n).closest("button") as HTMLButtonElement
    const dialogImage = () => within(screen.getByRole("dialog")).getByRole("img")

    it("are buttons labelled for full screen", () => {
      render(<ProductGallery name="Cadena Milan" images={images} />)

      expect(heroButton(1)).toHaveAttribute("type", "button")
      expect(heroButton(1)).toHaveAttribute("aria-label", "Ver imagen en pantalla completa")
      expect(heroButton(2)).toHaveAttribute("aria-label", "Ver imagen en pantalla completa")
    })

    it("open the viewer on the active image when the first is clicked", async () => {
      const user = userEvent.setup()
      render(<ProductGallery name="Cadena Milan" images={images} />)

      await user.click(screen.getByRole("button", { name: "Thumbnail 2" }))
      await user.click(heroButton(1))

      expect(screen.getByRole("dialog")).toHaveAttribute("aria-modal", "true")
      expect(dialogImage()).toHaveAttribute("src", images[1])
    })

    it("open the viewer on the second image when it is clicked", async () => {
      const user = userEvent.setup()
      render(<ProductGallery name="Cadena Milan" images={images} />)

      await user.click(heroButton(2))

      expect(dialogImage()).toHaveAttribute("src", images[1])
    })

    it("close with Escape and keep the chosen image in the gallery", async () => {
      const user = userEvent.setup()
      render(<ProductGallery name="Cadena Milan" images={images} />)

      await user.click(heroButton(2))
      await user.keyboard("{Escape}")

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
      expect(view(1)).toHaveAttribute("src", images[1])
      expect(view(2)).toHaveAttribute("src", images[2])
    })

    it("lock page scroll while the viewer is open", async () => {
      const user = userEvent.setup()
      render(<ProductGallery name="Cadena Milan" images={images} />)

      await user.click(heroButton(2))
      expect(document.body.style.overflow).toBe("hidden")

      await user.keyboard("{Escape}")
      expect(document.body.style.overflow).toBe("")
    })
  })

  it("counts the thumbnails beyond the first five", () => {
    const many = Array.from({ length: 8 }, (_, i) => `https://res.cloudinary.com/${i}.jpg`)
    render(<ProductGallery name="Cadena Milan" images={many} />)

    expect(screen.getAllByRole("button", { name: /^Thumbnail/ })).toHaveLength(5)
    expect(screen.getByText("+3")).toBeInTheDocument()
  })
})
