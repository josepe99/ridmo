import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { CollectionForm } from "./collection-form"

const noUpload = vi.fn()

function setup(props: Partial<Parameters<typeof CollectionForm>[0]> = {}) {
  const onSubmit = vi.fn(async () => {})
  const user = userEvent.setup({ delay: null })
  render(<CollectionForm onSubmit={onSubmit} onUploadImage={noUpload} {...props} />)
  return { user, onSubmit }
}

beforeEach(() => {
  noUpload.mockReset()
  vi.spyOn(console, "error").mockImplementation(() => {})
})

describe("CollectionForm: fields", () => {
  it("starts empty and active by default", () => {
    setup()

    expect(screen.getByLabelText("Name")).toHaveValue("")
    expect(screen.getByLabelText("Slug")).toHaveValue("")
    expect(screen.getByRole("switch", { name: "Active" })).toBeChecked()
    expect(screen.getByText("Auto-generated: n/a")).toBeInTheDocument()
  })

  it("starts from the initial values", () => {
    setup({
      initialValues: { name: "Cadenas", slug: "cadenas", description: "Macizas", isActive: false },
    })

    expect(screen.getByLabelText("Name")).toHaveValue("Cadenas")
    expect(screen.getByLabelText("Description")).toHaveValue("Macizas")
    expect(screen.getByRole("switch", { name: "Active" })).not.toBeChecked()
  })

  it("derives the slug from the name as the shopper types", async () => {
    const { user } = setup()

    await user.type(screen.getByLabelText("Name"), "Cadenas")

    expect(screen.getByLabelText("Slug")).toHaveValue("cadenas")
  })

  // SUSPECTED BUG (collection-form.tsx:62-63): the regexes use `\\s` inside a regex literal,
  // which matches a literal backslash + "s" instead of whitespace. Spaces get stripped and
  // never turned into dashes, so "Pulseras Cubanas" becomes "pulserascubanas".
  it("turns spaces into dashes when deriving the slug", async () => {
    const { user } = setup()

    await user.type(screen.getByLabelText("Name"), "Pulseras Cubanas")

    expect(screen.getByLabelText("Slug")).toHaveValue("pulseras-cubanas")
  })

  it("lets the shopper edit the slug manually", async () => {
    const { user } = setup()

    await user.type(screen.getByLabelText("Slug"), "mi-slug")

    expect(screen.getByLabelText("Slug")).toHaveValue("mi-slug")
  })

  it("toggles the active switch", async () => {
    const { user } = setup()

    await user.click(screen.getByRole("switch", { name: "Active" }))

    expect(screen.getByRole("switch", { name: "Active" })).not.toBeChecked()
  })
})

describe("CollectionForm: submit", () => {
  it("submits trimmed values", async () => {
    const { user, onSubmit } = setup({
      initialValues: { name: "  Cadenas  ", slug: " cadenas ", description: " desc ", imageUrl: " u " },
    })

    await user.click(screen.getByRole("button", { name: "Save collection" }))

    expect(onSubmit).toHaveBeenCalledWith({
      name: "Cadenas",
      slug: "cadenas",
      description: "desc",
      imageUrl: "u",
      isActive: true,
    })
  })

  it("shows the submitting label and disables the form while saving", async () => {
    let finish!: () => void
    const { user } = setup({
      initialValues: { name: "a", slug: "a" },
      onSubmit: () => new Promise<void>((resolve) => (finish = resolve)),
      submittingLabel: "Guardando...",
    })

    await user.click(screen.getByRole("button", { name: "Save collection" }))

    const busy = await screen.findByRole("button", { name: "Guardando..." })
    expect(busy).toBeDisabled()
    expect(screen.getByLabelText("Name")).toBeDisabled()
    finish()
    await waitFor(() => expect(screen.getByRole("button", { name: "Save collection" })).toBeEnabled())
  })

  it("recovers when the submit handler throws", async () => {
    const { user } = setup({
      initialValues: { name: "a", slug: "a" },
      onSubmit: async () => {
        throw new Error("boom")
      },
    })

    await user.click(screen.getByRole("button", { name: "Save collection" }))

    await waitFor(() => expect(screen.getByRole("button", { name: "Save collection" })).toBeEnabled())
  })

  it("supports custom labels", () => {
    setup({ submitLabel: "Update Collection", cancelLabel: "Close", onCancel: () => {} })

    expect(screen.getByRole("button", { name: "Update Collection" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument()
  })

  it("shows Cancel only when a handler is provided and calls it", async () => {
    const onCancel = vi.fn()
    const { user } = setup({ onCancel })

    await user.click(screen.getByRole("button", { name: "Cancel" }))

    expect(onCancel).toHaveBeenCalled()
  })

  it("has no Cancel button without a handler", () => {
    setup()

    expect(screen.queryByRole("button", { name: "Cancel" })).not.toBeInTheDocument()
  })
})

describe("CollectionForm: image", () => {
  const file = new File(["x"], "banner.png", { type: "image/png" })

  it("uploads a chosen image and stores its URL", async () => {
    noUpload.mockResolvedValue({ success: true, data: { url: "https://res.cloudinary.com/b.png" } })
    const { user, onSubmit } = setup({ initialValues: { name: "a", slug: "a" } })

    await user.upload(screen.getByLabelText("Upload image"), file)

    await waitFor(() => expect(screen.getByLabelText("Image URL")).toHaveValue("https://res.cloudinary.com/b.png"))
    expect(noUpload.mock.calls[0][0].get("file")).toBe(file)
    await user.click(screen.getByRole("button", { name: "Save collection" }))
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ imageUrl: "https://res.cloudinary.com/b.png" }))
  })

  it.each([
    ["the server reports a failure", { success: false, error: "nope" }],
    ["the server returns no url", { success: true, data: {} }],
  ])("shows an upload error when %s", async (_label, response) => {
    noUpload.mockResolvedValue(response)
    const { user } = setup()

    await user.upload(screen.getByLabelText("Upload image"), file)

    expect(await screen.findByText("Failed to upload image. Please try again.")).toBeInTheDocument()
    expect(screen.getByLabelText("Image URL")).toHaveValue("")
  })

  it("shows an upload error when the upload throws", async () => {
    noUpload.mockRejectedValue(new Error("network"))
    const { user } = setup()

    await user.upload(screen.getByLabelText("Upload image"), file)

    expect(await screen.findByText("Failed to upload image. Please try again.")).toBeInTheDocument()
  })

  it("accepts a pasted image URL and shows it", async () => {
    const { user } = setup()

    await user.type(screen.getByLabelText("Image URL"), "https://x.test/a.png")

    expect(screen.getByText("Uploaded link: https://x.test/a.png")).toBeInTheDocument()
  })

  it("delegates the image field to renderImageField when provided", async () => {
    const { user, onSubmit } = setup({
      initialValues: { name: "a", slug: "a" },
      renderImageField: (value, onChange) => (
        <button type="button" onClick={() => onChange("https://custom/img.png")}>
          pick ({value || "none"})
        </button>
      ),
    })

    expect(screen.queryByLabelText("Upload image")).not.toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "pick (none)" }))
    await user.click(screen.getByRole("button", { name: "Save collection" }))

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ imageUrl: "https://custom/img.png" }))
  })
})
