import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { resetNavigationMock, routerMock } from "@/tests/mocks/next-navigation"

vi.mock("next/navigation", async () => await import("@/tests/mocks/next-navigation"))
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

import { toast } from "sonner"
import { ItemForm } from "./item-form"

type Props = React.ComponentProps<typeof ItemForm>

function setup(props: Partial<Props> = {}) {
  const user = userEvent.setup({ delay: null })
  render(<ItemForm mode="create" collectionId="c1" {...props} />)
  return user
}

const okResponse = (body: unknown = { id: "i1" }) =>
  ({ ok: true, json: async () => body }) as Response

async function fillRequired(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("Nombre"), "Cadena")
  await user.type(screen.getByLabelText("Precio"), "1500.5")
  await user.type(screen.getByLabelText("Inventario"), "7")
}

const sentForm = () => vi.mocked(fetch).mock.calls[0][1]?.body as FormData

beforeEach(() => {
  resetNavigationMock()
  vi.mocked(toast.success).mockReset()
  vi.mocked(toast.error).mockReset()
  vi.stubGlobal("fetch", vi.fn(async () => okResponse()))
  vi.spyOn(console, "error").mockImplementation(() => {})
})

describe("ItemForm: fields", () => {
  it("derives the slug from the name", async () => {
    const user = setup()

    await user.type(screen.getByLabelText("Nombre"), "Cadena Milan 60")

    expect(screen.getByLabelText("Slug")).toHaveValue("cadena-milan-60")
  })

  it("starts from the initial values", () => {
    setup({
      mode: "edit",
      itemId: "i1",
      initialValues: {
        name: "Cadena",
        slug: "cadena",
        price: 100 as unknown as string,
        inventory: 3 as unknown as string,
        tags: ["oro"],
        isActive: false,
      },
    })

    expect(screen.getByLabelText("Precio")).toHaveValue(100)
    expect(screen.getByLabelText("Inventario")).toHaveValue(3)
    expect(screen.getByText("oro")).toBeInTheDocument()
    expect(screen.getByRole("switch", { name: "Activo" })).not.toBeChecked()
  })

  it("adds tags with the button or Enter, ignoring blanks and duplicates", async () => {
    const user = setup()
    const input = screen.getByPlaceholderText("Agregar etiqueta")

    await user.type(input, "oro")
    await user.click(screen.getByRole("button", { name: "Agregar" }))
    await user.type(input, "plata{Enter}")
    await user.type(input, "oro{Enter}")
    await user.clear(input)
    await user.type(input, "   {Enter}")

    expect(screen.getAllByText(/^(oro|plata)$/)).toHaveLength(2)
  })

  it("removes a tag", async () => {
    const user = setup({ initialValues: { tags: ["oro", "plata"] } })

    await user.click(screen.getByRole("button", { name: "Quitar oro" }))

    expect(screen.queryByText("oro")).not.toBeInTheDocument()
    expect(screen.getByText("plata")).toBeInTheDocument()
  })

  it("shows the collection picker only when options are given", () => {
    const first = render(<ItemForm mode="create" />)
    expect(screen.queryByText("Colección")).not.toBeInTheDocument()
    first.unmount()

    render(<ItemForm mode="create" collectionOptions={[{ id: "c1", name: "Cadenas" }]} />)
    expect(screen.getByText("Colección")).toBeInTheDocument()
    expect(screen.getByRole("combobox")).toHaveTextContent("Cadenas")
  })

  it("uses mode specific submit labels unless overridden", () => {
    const { rerender } = render(<ItemForm mode="create" collectionId="c1" />)
    expect(screen.getByRole("button", { name: "Crear producto" })).toBeInTheDocument()

    rerender(<ItemForm mode="edit" itemId="i1" />)
    expect(screen.getByRole("button", { name: "Actualizar producto" })).toBeInTheDocument()

    rerender(<ItemForm mode="edit" itemId="i1" submitLabel="Guardar" />)
    expect(screen.getByRole("button", { name: "Guardar" })).toBeInTheDocument()
  })
})

describe("ItemForm: create", () => {
  it("posts the multipart form to the items endpoint", async () => {
    const user = setup({ initialValues: { sku: " SKU-1 ", comparePrice: "2000" } })
    await fillRequired(user)
    await user.type(screen.getByLabelText("Descripción"), "  Oro  ")

    await user.click(screen.getByRole("button", { name: "Crear producto" }))

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1))
    expect(vi.mocked(fetch).mock.calls[0][0]).toBe("/api/admin/items")
    expect(vi.mocked(fetch).mock.calls[0][1]?.method).toBe("POST")
    const form = sentForm()
    expect(form.get("name")).toBe("Cadena")
    expect(form.get("slug")).toBe("cadena")
    expect(form.get("description")).toBe("Oro")
    expect(form.get("price")).toBe("1500.5")
    expect(form.get("comparePrice")).toBe("2000")
    expect(form.get("sku")).toBe("SKU-1")
    expect(form.get("inventory")).toBe("7")
    expect(form.get("collectionId")).toBe("c1")
    expect(form.get("tags")).toBe("[]")
    expect(form.get("isActive")).toBe("true")
  })

  it("omits optional fields that are empty", async () => {
    const user = setup()
    await fillRequired(user)

    await user.click(screen.getByRole("button", { name: "Crear producto" }))

    await waitFor(() => expect(fetch).toHaveBeenCalled())
    const form = sentForm()
    expect(form.has("comparePrice")).toBe(false)
    expect(form.has("sku")).toBe(false)
    expect(form.has("existingImages")).toBe(false)
  })

  it("requires a collection before creating", async () => {
    const user = setup({ collectionId: undefined })
    await fillRequired(user)

    await user.click(screen.getByRole("button", { name: "Crear producto" }))

    expect(toast.error).toHaveBeenCalledWith("Elegí una colección antes de crear el producto.")
    expect(fetch).not.toHaveBeenCalled()
  })

  it("resets the form, keeps the collection and refreshes after a successful create", async () => {
    const user = setup()
    await fillRequired(user)

    await user.click(screen.getByRole("button", { name: "Crear producto" }))

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("¡Producto creado con éxito!"))
    expect(screen.getByLabelText("Nombre")).toHaveValue("")
    expect(routerMock.refresh).toHaveBeenCalled()
  })

  it("calls onSuccess instead of resetting when provided", async () => {
    const onSuccess = vi.fn()
    const user = setup({ onSuccess })
    await fillRequired(user)

    await user.click(screen.getByRole("button", { name: "Crear producto" }))

    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith({ id: "i1" }))
    expect(screen.getByLabelText("Nombre")).toHaveValue("Cadena")
    expect(routerMock.refresh).not.toHaveBeenCalled()
  })

  it("surfaces the server error message", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      json: async () => ({ error: "An item with this slug already exists" }),
    } as Response)
    const user = setup()
    await fillRequired(user)

    await user.click(screen.getByRole("button", { name: "Crear producto" }))

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("An item with this slug already exists"))
    expect(screen.getByLabelText("Nombre")).toHaveValue("Cadena")
  })

  it("falls back to a generic message when the error body is not JSON", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      json: async () => {
        throw new Error("not json")
      },
    } as unknown as Response)
    const user = setup()
    await fillRequired(user)

    await user.click(screen.getByRole("button", { name: "Crear producto" }))

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("No se pudo crear el producto"))
  })

  it("reports network failures and re-enables the form", async () => {
    vi.mocked(fetch).mockRejectedValue(new Error("offline"))
    const user = setup()
    await fillRequired(user)

    await user.click(screen.getByRole("button", { name: "Crear producto" }))

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("offline"))
    expect(screen.getByRole("button", { name: "Crear producto" })).toBeEnabled()
  })

  it("sends the URLs of images that were already uploaded", async () => {
    const user = setup({ initialValues: { images: ["https://res.cloudinary.com/a.jpg"] } })
    await fillRequired(user)

    await user.click(screen.getByRole("button", { name: "Crear producto" }))

    await waitFor(() => expect(fetch).toHaveBeenCalled())
    expect(sentForm().get("existingImages")).toBe(JSON.stringify(["https://res.cloudinary.com/a.jpg"]))
  })
})

describe("ItemForm: edit", () => {
  it("puts the form to the item endpoint", async () => {
    const user = setup({
      mode: "edit",
      itemId: "i9",
      initialValues: { name: "Cadena", slug: "cadena", price: "10", inventory: "2" },
    })

    await user.click(screen.getByRole("button", { name: "Actualizar producto" }))

    await waitFor(() => expect(fetch).toHaveBeenCalled())
    expect(vi.mocked(fetch).mock.calls[0][0]).toBe("/api/admin/items/i9")
    expect(vi.mocked(fetch).mock.calls[0][1]?.method).toBe("PUT")
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("¡Producto actualizado con éxito!"))
  })

  it("falls back to the id inside the initial values", async () => {
    const user = setup({
      mode: "edit",
      initialValues: { id: "i7", name: "C", slug: "c", price: "1", inventory: "1" },
    })

    await user.click(screen.getByRole("button", { name: "Actualizar producto" }))

    await waitFor(() => expect(fetch).toHaveBeenCalled())
    expect(vi.mocked(fetch).mock.calls[0][0]).toBe("/api/admin/items/i7")
  })

  it("refuses to update without an item id", async () => {
    const user = setup({ mode: "edit", initialValues: { name: "C", slug: "c", price: "1", inventory: "1" } })

    await user.click(screen.getByRole("button", { name: "Actualizar producto" }))

    expect(toast.error).toHaveBeenCalledWith("Falta el id del producto a actualizar.")
    expect(fetch).not.toHaveBeenCalled()
  })

  it("keeps the values after saving (no reset) and refreshes", async () => {
    const user = setup({
      mode: "edit",
      itemId: "i9",
      initialValues: { name: "Cadena", slug: "cadena", price: "10", inventory: "2" },
    })

    await user.click(screen.getByRole("button", { name: "Actualizar producto" }))

    await waitFor(() => expect(routerMock.refresh).toHaveBeenCalled())
    expect(screen.getByLabelText("Nombre")).toHaveValue("Cadena")
  })

  it("calls onCancel", async () => {
    const onCancel = vi.fn()
    const user = setup({ mode: "edit", itemId: "i9", onCancel })

    await user.click(screen.getByRole("button", { name: "Cancelar" }))

    expect(onCancel).toHaveBeenCalled()
  })
})
