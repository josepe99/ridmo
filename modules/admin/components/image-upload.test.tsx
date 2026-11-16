import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { useState } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { ImageUploadComponent, type ImageUpload } from "./image-upload"

const png = (name = "a.png", size = 10) => {
  const file = new File(["x"], name, { type: "image/png" })
  Object.defineProperty(file, "size", { value: size })
  return file
}

const existing = (url = "https://res.cloudinary.com/a.jpg"): ImageUpload => ({
  url,
  preview: url,
  isExisting: true,
})

/** Keeps the controlled `images` prop in sync like the real forms do. */
function Harness({
  initial = [],
  onChange,
  ...props
}: Partial<React.ComponentProps<typeof ImageUploadComponent>> & {
  initial?: ImageUpload[]
  onChange?: (images: ImageUpload[]) => void
}) {
  const [images, setImages] = useState<ImageUpload[]>(initial)
  return (
    <ImageUploadComponent
      images={images}
      onImagesChange={(next) => {
        setImages(next)
        onChange?.(next)
      }}
      {...props}
    />
  )
}

const fileInput = () => document.getElementById("file-upload") as HTMLInputElement

beforeEach(() => {
  URL.createObjectURL = vi.fn(() => "blob:preview")
  URL.revokeObjectURL = vi.fn()
  vi.stubGlobal("fetch", vi.fn())
})

describe("ImageUploadComponent: adding files", () => {
  it("adds valid files as pending previews", async () => {
    const onChange = vi.fn()
    render(<Harness onChange={onChange} />)

    await userEvent.upload(fileInput(), png("one.png"))

    expect(onChange).toHaveBeenCalledWith([
      expect.objectContaining({ url: "", preview: "blob:preview", isExisting: false }),
    ])
    expect(screen.getByText("Pending")).toBeInTheDocument()
    expect(screen.getByText("one.png")).toBeInTheDocument()
  })

  it("rejects unsupported file types with an explanation", async () => {
    const user = userEvent.setup({ applyAccept: false })
    render(<Harness />)

    await user.upload(fileInput(), new File(["x"], "doc.pdf", { type: "application/pdf" }))

    expect(await screen.findByText(/File type application\/pdf is not supported/)).toBeInTheDocument()
    expect(screen.queryByText("Pending")).not.toBeInTheDocument()
  })

  it("rejects files over the size limit", async () => {
    render(<Harness maxFileSize={1} />)

    await userEvent.upload(fileInput(), png("big.png", 2 * 1024 * 1024))

    expect(await screen.findByText("File size must be less than 1MB")).toBeInTheDocument()
  })

  it("accepts a file exactly at the size limit", async () => {
    render(<Harness maxFileSize={1} />)

    await userEvent.upload(fileInput(), png("edge.png", 1024 * 1024))

    expect(screen.queryByText(/File size must be less than/)).not.toBeInTheDocument()
    expect(screen.getByText("edge.png")).toBeInTheDocument()
  })

  it("refuses to exceed the maximum number of images", async () => {
    render(<Harness initial={[existing()]} maxImages={2} />)

    await userEvent.upload(fileInput(), [png("a.png"), png("b.png")])

    expect(await screen.findByText("Maximum 2 images allowed")).toBeInTheDocument()
    expect(screen.queryByText("Pending")).not.toBeInTheDocument()
  })

  it("disables the picker once the limit is reached", () => {
    render(<Harness initial={[existing()]} maxImages={1} />)

    expect(fileInput()).toBeDisabled()
  })

  it("adds files dropped on the area and tracks drag state", () => {
    const onChange = vi.fn()
    render(<Harness onChange={onChange} />)
    const area = screen.getByText(/Drag and drop images here/).closest("div.border-dashed") as HTMLElement

    fireEvent.dragEnter(area)
    expect(area).toHaveClass("border-primary")
    fireEvent.dragLeave(area)
    expect(area).not.toHaveClass("border-primary")

    fireEvent.drop(area, { dataTransfer: { files: [png("dropped.png")] } })
    expect(onChange).toHaveBeenCalledTimes(1)
  })
})

describe("ImageUploadComponent: existing images", () => {
  it("labels saved images and shows the counter", () => {
    render(<Harness initial={[existing()]} maxImages={5} />)

    expect(screen.getByText("Saved")).toBeInTheDocument()
    expect(screen.getByText("Image Previews (1/5)")).toBeInTheDocument()
    expect(screen.getByText("Existing image")).toBeInTheDocument()
  })

  it("removes an image without revoking the URL of a saved one", async () => {
    const onChange = vi.fn()
    render(<Harness initial={[existing()]} onChange={onChange} />)

    await userEvent.click(screen.getByRole("button"))

    expect(onChange).toHaveBeenCalledWith([])
    expect(URL.revokeObjectURL).not.toHaveBeenCalled()
  })

  it("revokes the preview URL when removing a freshly added file", async () => {
    render(<Harness />)
    await userEvent.upload(fileInput(), png("new.png"))

    await userEvent.click(screen.getByRole("button", { name: "" }))

    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:preview")
    expect(screen.queryByText("new.png")).not.toBeInTheDocument()
  })

  it("falls back to a placeholder when an image fails to load", () => {
    render(<Harness initial={[existing()]} />)
    const image = screen.getByAltText("Preview 1")

    fireEvent.error(image)

    expect(image.getAttribute("src")).toBe("/placeholder.jpg")
  })
})

describe("ImageUploadComponent: uploading to Cloudinary", () => {
  it("offers the upload action only when there are pending files", async () => {
    render(<Harness initial={[existing()]} />)
    expect(screen.queryByRole("button", { name: "Upload images" })).not.toBeInTheDocument()

    await userEvent.upload(fileInput(), png())

    expect(screen.getByRole("button", { name: "Upload images" })).toBeInTheDocument()
  })

  it("posts pending files and stores the returned URLs", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        data: { images: [{ url: "https://res.cloudinary.com/new.jpg", publicId: "pid" }] },
      }),
    } as Response)
    const onChange = vi.fn()
    render(<Harness onChange={onChange} />)
    await userEvent.upload(fileInput(), png())

    await userEvent.click(screen.getByRole("button", { name: "Upload images" }))

    await waitFor(() => expect(screen.getByText("Uploaded")).toBeInTheDocument())
    expect(fetch).toHaveBeenCalledWith("/api/admin/images", { method: "POST", body: expect.any(FormData) })
    const body = vi.mocked(fetch).mock.calls[0][1]?.body as FormData
    expect(body.get("image0")).toBeInstanceOf(File)
    expect(onChange).toHaveBeenLastCalledWith([
      expect.objectContaining({ url: "https://res.cloudinary.com/new.jpg", publicId: "pid" }),
    ])
  })

  it("shows an error when the upload endpoint fails", async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: false } as Response)
    render(<Harness />)
    await userEvent.upload(fileInput(), png())

    await userEvent.click(screen.getByRole("button", { name: "Upload images" }))

    expect(await screen.findByText("Failed to upload images")).toBeInTheDocument()
    expect(screen.getByText("Pending")).toBeInTheDocument()
  })

  it("shows an error when the request itself throws", async () => {
    vi.mocked(fetch).mockRejectedValue(new Error("offline"))
    render(<Harness />)
    await userEvent.upload(fileInput(), png())

    await userEvent.click(screen.getByRole("button", { name: "Upload images" }))

    expect(await screen.findByText("offline")).toBeInTheDocument()
  })

  // SUSPECTED BUG (image-upload.tsx:242 and :286): the "Upload images" and remove (X)
  // buttons have no `type="button"`, so inside the <form> of ItemForm clicking them also
  // SUBMITS the form (the default button type is "submit").
  it("does not submit a surrounding form when removing an image", async () => {
    const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault())
    render(
      <form onSubmit={onSubmit}>
        <Harness initial={[existing()]} />
      </form>
    )

    await userEvent.click(screen.getByRole("button"))

    expect(onSubmit).not.toHaveBeenCalled()
  })
})
