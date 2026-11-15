import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { resetNavigationMock, routerMock } from "@/tests/mocks/next-navigation"

vi.mock("next/navigation", async () => await import("@/tests/mocks/next-navigation"))
vi.mock("next/image", async () => await import("@/tests/mocks/next-image"))
vi.mock("next/link", async () => await import("@/tests/mocks/next-link"))
vi.mock("../actions/create-order.action", () => ({ createOrder: vi.fn() }))

// `useCart` stays real; one test swaps it for a stub to simulate the cart being emptied elsewhere.
const cartStub = vi.hoisted(() => ({ items: null as unknown[] | null }))
vi.mock("@/modules/cart", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/modules/cart")>()
  return {
    ...actual,
    useCart: () => {
      const real = actual.useCart()
      if (cartStub.items === null) return real
      const items = cartStub.items as typeof real.items
      return {
        ...real,
        items,
        isLoading: false,
        totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0),
        totalPrice: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
      }
    },
  }
})

import type { CartItem } from "@/modules/cart"
import { createOrder } from "../actions/create-order.action"
import type { BankTransferDetails } from "../services/bank-details"
import { CheckoutFlow } from "./checkout-flow"

const ID_A = "665f1c2e8b3a4d0012a1b001"
const ID_B = "665f1c2e8b3a4d0012a1b002"

const line = (overrides: Partial<CartItem> = {}): CartItem => ({
  id: ID_A,
  name: "Cadena Milan",
  price: 3_900_000,
  image: "https://res.cloudinary.com/a.jpg",
  slug: "cadena-milan",
  quantity: 1,
  addedAt: "2026-01-01T00:00:00.000Z",
  ...overrides,
})

const bank: BankTransferDetails = {
  bankName: "Banco Ueno",
  accountHolder: "RIDMO S.A.",
  accountNumber: "123456789",
  alias: "ridmo.pay",
  notes: "",
}

type User = ReturnType<typeof userEvent.setup>

const seedCart = (items: CartItem[]) => localStorage.setItem("cart", JSON.stringify(items))

async function renderCheckout(props: Partial<React.ComponentProps<typeof CheckoutFlow>> = {}) {
  const user = userEvent.setup({ delay: null })
  const view = render(<CheckoutFlow bank={bank} {...props} />)
  await screen.findByRole("heading", { level: 1 })
  return { user, ...view }
}

const stepHeading = (name: string) => screen.findByRole("heading", { level: 2, name })
const cont = (user: User) => user.click(screen.getByRole("button", { name: "Continuar" }))

async function fillShipping(user: User) {
  await user.type(screen.getByLabelText("Nombre completo"), "Ana Perez")
  await user.type(screen.getByLabelText("Teléfono"), "+595 981 000 000")
  await user.type(screen.getByLabelText("Calle"), "Calle Palma 123")
  await user.type(screen.getByLabelText("Número o referencia"), "Casa 12")
  await user.selectOptions(screen.getByLabelText("Ciudad / zona de envío"), "asuncion")
  await user.type(screen.getByLabelText("Departamento / estado / provincia"), "Central")
}

async function goToShipping(user: User) {
  await cont(user)
  await stepHeading("Datos de envío")
}

async function goToPayment(user: User) {
  await goToShipping(user)
  await fillShipping(user)
  await cont(user)
  await stepHeading("Datos de pago")
}

const confirm = (user: User) => user.click(screen.getByRole("button", { name: /Confirmar pedido|Procesando/ }))

const currentStep = () => screen.getAllByRole("listitem").find((item) => item.getAttribute("aria-current") === "step")

beforeEach(() => {
  localStorage.clear()
  resetNavigationMock()
  cartStub.items = null
  vi.mocked(createOrder).mockReset()
  vi.spyOn(window, "scrollTo").mockImplementation(() => {})
})

describe("CheckoutFlow: step 1 (products)", () => {
  it("shows the empty cart message with a link back to the store", async () => {
    render(<CheckoutFlow bank={bank} />)

    expect(await screen.findByRole("heading", { name: "Tu carrito está vacío" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Seguir comprando" })).toHaveAttribute("href", "/")
  })

  it("starts on the products step with the stepper and the heading", async () => {
    seedCart([line({ quantity: 2 })])
    await renderCheckout()

    expect(screen.getByRole("heading", { level: 1, name: "Finalizar compra" })).toBeInTheDocument()
    expect(await stepHeading("Tu selección")).toBeInTheDocument()
    expect(currentStep()).toHaveTextContent("Productos")
    expect(screen.queryByLabelText("Nombre completo")).not.toBeInTheDocument()
  })

  it("lists the cart lines and the totals in guaranies only", async () => {
    seedCart([line({ quantity: 2 })])
    await renderCheckout()

    const items = screen.getByRole("list", { name: "Productos en tu carrito" })
    expect(within(items).getByText("Cadena Milan")).toBeInTheDocument()
    expect(screen.getAllByText("Gs. 7.800.000").length).toBeGreaterThan(0)
    expect(screen.getAllByText("2 artículos").length).toBeGreaterThan(0)
    expect(screen.queryByText(/ARS|Argentina/)).not.toBeInTheDocument()
    expect(screen.queryByText(/El pedido se registra en guaraníes/)).not.toBeInTheDocument()
  })

  it("shows a sticky summary column and a compact one for small screens", async () => {
    seedCart([line()])
    await renderCheckout()

    expect(screen.getByRole("complementary", { name: "Resumen del pedido" })).toHaveTextContent("Gs. 3.900.000")
    expect(screen.getByText("Subtotal", { selector: "dt" })).toBeInTheDocument()
  })

  it("adds one unit", async () => {
    seedCart([line()])
    const { user } = await renderCheckout()

    await user.click(screen.getByRole("button", { name: "Agregar una unidad de Cadena Milan" }))

    expect(JSON.parse(localStorage.getItem("cart") ?? "[]")[0].quantity).toBe(2)
    expect(screen.getAllByText("Gs. 7.800.000").length).toBeGreaterThan(0)
  })

  it("removes one unit and the empty cart view appears when it reaches zero", async () => {
    seedCart([line()])
    const { user } = await renderCheckout()

    await user.click(screen.getByRole("button", { name: "Quitar una unidad de Cadena Milan" }))

    expect(await screen.findByRole("heading", { name: "Tu carrito está vacío" })).toBeInTheDocument()
  })

  it("removes a single line and keeps the other", async () => {
    seedCart([line(), line({ id: ID_B, name: "Pulsera" })])
    const { user } = await renderCheckout()

    await user.click(screen.getByRole("button", { name: "Quitar Cadena Milan del carrito" }))

    expect(screen.queryByText("Cadena Milan")).not.toBeInTheDocument()
    expect(screen.getByText("Pulsera")).toBeInTheDocument()
  })

  it("empties the cart with Vaciar carrito", async () => {
    seedCart([line()])
    const { user } = await renderCheckout()

    await user.click(screen.getByRole("button", { name: "Vaciar carrito" }))

    expect(await screen.findByRole("heading", { name: "Tu carrito está vacío" })).toBeInTheDocument()
    expect(localStorage.getItem("cart")).toBeNull()
  })
})

describe("CheckoutFlow: step navigation", () => {
  it("moves from products to shipping and marks the products step as completed", async () => {
    seedCart([line()])
    const { user } = await renderCheckout()

    await goToShipping(user)

    expect(currentStep()).toHaveTextContent("Datos de envío")
    expect(screen.getByRole("button", { name: /^Productos/ })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /Datos de pago/ })).not.toBeInTheDocument()
  })

  it("moves focus to the new step heading and scrolls to the top on every change", async () => {
    seedCart([line()])
    const { user } = await renderCheckout()
    expect(window.scrollTo).not.toHaveBeenCalled()
    expect(screen.getByRole("heading", { level: 2, name: "Tu selección" })).not.toHaveFocus()

    await goToShipping(user)

    await waitFor(() => expect(screen.getByRole("heading", { level: 2, name: "Datos de envío" })).toHaveFocus())
    expect(window.scrollTo).toHaveBeenCalledWith(expect.objectContaining({ top: 0 }))
  })

  it("lets the shopper return to a completed step through the stepper", async () => {
    seedCart([line()])
    const { user } = await renderCheckout()
    await goToPayment(user)

    await user.click(screen.getByRole("button", { name: /^Productos/ }))

    expect(await stepHeading("Tu selección")).toBeInTheDocument()
    expect(currentStep()).toHaveTextContent("Productos")
    // Datos de pago is now a future step again: not clickable.
    expect(screen.queryByRole("button", { name: /Datos de pago/ })).not.toBeInTheDocument()
  })

  it("does not let the stepper skip ahead", async () => {
    seedCart([line()])
    await renderCheckout()

    expect(screen.queryByRole("button", { name: /Datos de envío/ })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /Datos de pago/ })).not.toBeInTheDocument()
  })

  it("returns to the first step when the cart is emptied while on a later step, even if refilled", async () => {
    cartStub.items = [line()]
    const { user, rerender } = await renderCheckout()
    await goToPayment(user)

    cartStub.items = []
    rerender(<CheckoutFlow bank={bank} />)
    expect(await screen.findByRole("heading", { name: "Tu carrito está vacío" })).toBeInTheDocument()

    cartStub.items = [line()]
    rerender(<CheckoutFlow bank={bank} />)

    expect(await stepHeading("Tu selección")).toBeInTheDocument()
    expect(currentStep()).toHaveTextContent("Productos")
    expect(screen.queryByRole("button", { name: /Confirmar pedido/ })).not.toBeInTheDocument()
  })
})

describe("CheckoutFlow: step 2 (shipping)", () => {
  it("cannot advance with an empty form and shows the validation messages", async () => {
    seedCart([line()])
    const { user } = await renderCheckout()
    await goToShipping(user)

    await cont(user)

    expect(await screen.findAllByText("Completá este campo")).toHaveLength(6)
    expect(currentStep()).toHaveTextContent("Datos de envío")
    expect(screen.queryByRole("heading", { level: 2, name: "Datos de pago" })).not.toBeInTheDocument()
    expect(createOrder).not.toHaveBeenCalled()
  })

  it("marks invalid fields with aria-invalid and links the message", async () => {
    seedCart([line()])
    const { user } = await renderCheckout()
    await goToShipping(user)

    await cont(user)

    const name = screen.getByLabelText("Nombre completo")
    await waitFor(() => expect(name).toHaveAttribute("aria-invalid", "true"))
    expect(name).toHaveAccessibleDescription("Completá este campo")
    expect(screen.getByLabelText(/^Email/)).not.toHaveAttribute("aria-invalid")
  })

  it("rejects an invalid phone", async () => {
    seedCart([line()])
    const { user } = await renderCheckout()
    await goToShipping(user)
    await fillShipping(user)
    await user.clear(screen.getByLabelText("Teléfono"))
    await user.type(screen.getByLabelText("Teléfono"), "abc")

    await cont(user)

    expect(await screen.findByText("Ingresá un teléfono válido")).toBeInTheDocument()
    expect(currentStep()).toHaveTextContent("Datos de envío")
  })

  it("rejects an invalid email but accepts an empty one", async () => {
    seedCart([line()])
    const { user } = await renderCheckout()
    await goToShipping(user)
    await fillShipping(user)
    await user.type(screen.getByLabelText(/^Email/), "not-an-email")

    await cont(user)

    expect(await screen.findByText("Ingresá un email válido")).toBeInTheDocument()
    expect(currentStep()).toHaveTextContent("Datos de envío")
  })

  it("asks for a zone in the summary and prices the shipping live as the shopper chooses", async () => {
    seedCart([line()])
    const { user } = await renderCheckout()
    await goToShipping(user)
    const summary = screen.getByRole("complementary", { name: "Resumen del pedido" })
    expect(within(summary).getByText("Elegí una zona")).toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText("Ciudad / zona de envío"), "lambare")
    expect(within(summary).getByText("Gs. 15.000")).toBeInTheDocument()
    expect(within(summary).getByText("Gs. 3.915.000")).toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText("Ciudad / zona de envío"), "interior-door")
    expect(within(summary).getByText("Gs. 35.000")).toBeInTheDocument()
    expect(within(summary).getByText("Gs. 3.935.000")).toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText("País"), "Argentina")
    expect(within(summary).getByText("A coordinar")).toBeInTheDocument()
    expect(within(summary).queryByText("Gs. 3.935.000")).not.toBeInTheDocument()
  })

  it("cannot advance without choosing a shipping zone", async () => {
    seedCart([line()])
    const { user } = await renderCheckout()
    await goToShipping(user)
    await fillShipping(user)
    await user.selectOptions(screen.getByLabelText("Ciudad / zona de envío"), "")

    await cont(user)

    expect(await screen.findByText("Elegí una zona de envío")).toBeInTheDocument()
    expect(currentStep()).toHaveTextContent("Datos de envío")
  })

  it("offers a country selector that defaults to Paraguay", async () => {
    seedCart([line()])
    const { user } = await renderCheckout()
    await goToShipping(user)

    expect(screen.getByLabelText("País")).toHaveValue("Paraguay")
    expect(screen.getByRole("option", { name: "Argentina" })).toBeInTheDocument()
  })

  it("keeps the typed values when going back to the products step and forward again", async () => {
    seedCart([line()])
    const { user } = await renderCheckout()
    await goToShipping(user)
    await fillShipping(user)

    await user.click(screen.getByRole("button", { name: "Volver" }))
    await stepHeading("Tu selección")
    await goToShipping(user)

    expect(screen.getByLabelText("Nombre completo")).toHaveValue("Ana Perez")
    expect(screen.getByLabelText("Teléfono")).toHaveValue("+595 981 000 000")
    expect(screen.getByLabelText("Calle")).toHaveValue("Calle Palma 123")
    expect(screen.getByLabelText("Departamento / estado / provincia")).toHaveValue("Central")
  })

  it("keeps the values when returning from the payment step with Volver and with Editar", async () => {
    seedCart([line()])
    const { user } = await renderCheckout()
    await goToPayment(user)

    await user.click(screen.getByRole("button", { name: "Volver" }))
    await stepHeading("Datos de envío")
    expect(screen.getByLabelText("Ciudad")).toHaveValue("Asunción")
    expect(screen.getByLabelText("Ciudad / zona de envío")).toHaveValue("asuncion")

    await cont(user)
    await stepHeading("Datos de pago")
    await user.click(screen.getByRole("button", { name: "Editar datos de envío" }))
    await stepHeading("Datos de envío")
    expect(screen.getByLabelText("Nombre completo")).toHaveValue("Ana Perez")
  })

  it("does not persist personal data in the browser storage", async () => {
    seedCart([line()])
    const { user } = await renderCheckout()
    await goToPayment(user)

    const stored = JSON.stringify({ ...localStorage }) + JSON.stringify({ ...sessionStorage })
    expect(stored).not.toContain("Ana Perez")
    expect(stored).not.toContain("Calle Palma")
    expect(stored).not.toContain("981")
    expect(Object.keys(localStorage)).toEqual(["cart"])
  })

  it("falls back to Paraguay when the saved country is no longer allowed", async () => {
    seedCart([line()])
    const { user } = await renderCheckout({
      defaults: {
        shippingAddress: {
          street: "x",
          reference: "x",
          city: "x",
          department: "x",
          country: "Narnia",
          postalCode: "",
          notes: "",
        },
      },
    })
    await goToShipping(user)

    expect(screen.getByLabelText("País")).toHaveValue("Paraguay")
  })

  it("prefills the form for a signed-in customer", async () => {
    seedCart([line()])
    const { user } = await renderCheckout({
      defaults: {
        customer: { fullName: "Ana Perez", phone: "+595 981 000 000", email: "ana@example.com" },
        shippingAddress: {
          street: "Calle Palma 123",
          reference: "Casa 12",
          city: "Asuncion",
          department: "Central",
          country: "Argentina",
          postalCode: "C1425",
          notes: "",
        },
      },
    })
    await goToShipping(user)

    expect(screen.getByLabelText("País")).toHaveValue("Argentina")
    expect(screen.getByLabelText(/^Código postal/)).toHaveValue("C1425")

    expect(screen.getByLabelText("Nombre completo")).toHaveValue("Ana Perez")
    expect(screen.getByLabelText(/^Email/)).toHaveValue("ana@example.com")
    expect(screen.getByLabelText("Ciudad")).toHaveValue("Asuncion")
    // A prefilled, valid form goes straight to payment.
    await cont(user)
    expect(await stepHeading("Datos de pago")).toBeInTheDocument()
  })
})

describe("CheckoutFlow: step 3 (payment)", () => {
  it("shows the transfer details, the recap, the summary and the final button", async () => {
    seedCart([line({ quantity: 2 })])
    const { user } = await renderCheckout()

    await goToPayment(user)

    expect(currentStep()).toHaveTextContent("Datos de pago")
    expect(screen.getByRole("radio", { name: /Transferencia bancaria/ })).toBeChecked()
    expect(screen.getByText("Banco Ueno")).toBeInTheDocument()
    expect(screen.getByText("ridmo.pay")).toBeInTheDocument()
    expect(screen.getByText(/queda pendiente hasta que recibamos la transferencia/)).toBeInTheDocument()
    expect(screen.getByText("Ana Perez")).toBeInTheDocument()
    expect(screen.getByRole("complementary", { name: "Resumen del pedido" })).toHaveTextContent("Gs. 7.800.000")
    expect(screen.getByRole("button", { name: "Confirmar pedido" })).toBeEnabled()
  })

  it("shows the shipping in the recap and the summary, with the total including it", async () => {
    seedCart([line({ quantity: 2 })])
    const { user } = await renderCheckout()

    await goToPayment(user)

    expect(screen.getByText("Asunción · Gs. 20.000")).toBeInTheDocument()
    const summary = screen.getByRole("complementary", { name: "Resumen del pedido" })
    expect(within(summary).getByText("Envío").nextSibling).toHaveTextContent("Gs. 20.000")
    expect(within(summary).getByText("Gs. 7.820.000")).toBeInTheDocument()
    // The compact summary above the button carries the same total.
    expect(screen.getAllByText("Gs. 7.820.000").length).toBeGreaterThanOrEqual(2)
  })

  it("sends only ids, quantities, contact and address, then redirects to the confirmation", async () => {
    seedCart([line({ quantity: 2 })])
    vi.mocked(createOrder).mockResolvedValue({ ok: true, orderNumber: "RID-000007", accessToken: "tok/en+1" })
    const { user } = await renderCheckout()
    await goToPayment(user)

    await confirm(user)

    await waitFor(() => expect(createOrder).toHaveBeenCalledTimes(1))
    expect(createOrder).toHaveBeenCalledWith({
      customer: { fullName: "Ana Perez", phone: "+595 981 000 000", email: "" },
      shippingAddress: {
        street: "Calle Palma 123",
        reference: "Casa 12",
        city: "Asunción",
        department: "Central",
        country: "Paraguay",
        shippingOptionId: "asuncion",
        postalCode: "",
        notes: "",
      },
      lines: [{ itemId: ID_A, quantity: 2 }],
    })
    await waitFor(() => expect(routerMock.push).toHaveBeenCalledWith("/order/RID-000007?token=tok%2Fen%2B1"))
  })

  it("shows no international notice in the payment recap for Paraguay", async () => {
    seedCart([line()])
    const { user } = await renderCheckout()
    await goToPayment(user)

    expect(screen.queryByRole("note")).not.toBeInTheDocument()
  })

  it("ships to another country: shows the notice, keeps the total in guaranies and sends country and postal code", async () => {
    seedCart([line({ quantity: 2 })])
    vi.mocked(createOrder).mockResolvedValue({ ok: true, orderNumber: "RID-000010", accessToken: "tok" })
    const { user } = await renderCheckout()
    await goToShipping(user)
    await fillShipping(user)
    await user.selectOptions(screen.getByLabelText("País"), "Argentina")
    await user.type(screen.getByLabelText("Ciudad"), "Buenos Aires")
    await user.type(screen.getByLabelText(/^Código postal/), "C1425")
    await cont(user)
    await stepHeading("Datos de pago")

    expect(screen.getByRole("note")).toHaveTextContent(/costo y el plazo de entrega se coordinan/)
    const summary = screen.getByRole("complementary", { name: "Resumen del pedido" })
    expect(summary).toHaveTextContent("Gs. 7.800.000")
    expect(within(summary).getByText("A coordinar")).toBeInTheDocument()
    expect(screen.queryByText(/Gs\. 7\.8[1-9]/)).not.toBeInTheDocument()

    await confirm(user)

    await waitFor(() => expect(createOrder).toHaveBeenCalledTimes(1))
    const payload = vi.mocked(createOrder).mock.calls[0][0] as { shippingAddress: Record<string, string> }
    expect(payload.shippingAddress).toMatchObject({ country: "Argentina", postalCode: "C1425", shippingOptionId: "" })
    expect(JSON.stringify(payload)).not.toMatch(/price|total|currency|cost/i)
  })

  it("clears the cart and shows the redirecting status after a successful order", async () => {
    seedCart([line()])
    vi.mocked(createOrder).mockResolvedValue({ ok: true, orderNumber: "RID-000007", accessToken: "tok" })
    const { user } = await renderCheckout()
    await goToPayment(user)

    await confirm(user)

    expect(await screen.findByText("Pedido registrado, redirigiendo...")).toBeInTheDocument()
    expect(localStorage.getItem("cart")).toBeNull()
  })

  it("disables the button and shows progress while the order is being placed", async () => {
    seedCart([line()])
    let resolveOrder!: (value: Awaited<ReturnType<typeof createOrder>>) => void
    vi.mocked(createOrder).mockReturnValue(new Promise((resolve) => (resolveOrder = resolve)))
    const { user } = await renderCheckout()
    await goToPayment(user)

    await confirm(user)

    const button = await screen.findByRole("button", { name: "Procesando..." })
    expect(button).toBeDisabled()
    resolveOrder({ ok: false, code: "INTERNAL", message: "Fallo" })
    expect(await screen.findByRole("button", { name: "Confirmar pedido" })).toBeEnabled()
  })

  it("calls the action only once on a double click", async () => {
    seedCart([line()])
    let resolveOrder!: (value: Awaited<ReturnType<typeof createOrder>>) => void
    vi.mocked(createOrder).mockReturnValue(new Promise((resolve) => (resolveOrder = resolve)))
    const { user } = await renderCheckout()
    await goToPayment(user)

    await user.dblClick(screen.getByRole("button", { name: "Confirmar pedido" }))
    await user.click(screen.getByRole("button", { name: /Procesando|Confirmar pedido/ }))

    expect(createOrder).toHaveBeenCalledTimes(1)
    resolveOrder({ ok: true, orderNumber: "RID-000008", accessToken: "tok" })
    await waitFor(() => expect(routerMock.push).toHaveBeenCalledTimes(1))
  })

  it("stays on the payment step with the message for an unexpected failure", async () => {
    seedCart([line()])
    vi.mocked(createOrder).mockResolvedValue({
      ok: false,
      code: "INTERNAL",
      message: "No pudimos registrar tu pedido. Intentá de nuevo en unos minutos.",
    })
    const { user } = await renderCheckout()
    await goToPayment(user)

    await confirm(user)

    expect(await screen.findByText(/No pudimos registrar tu pedido/)).toBeInTheDocument()
    expect(currentStep()).toHaveTextContent("Datos de pago")
    expect(routerMock.push).not.toHaveBeenCalled()
    expect(localStorage.getItem("cart")).not.toBeNull()
  })
})

describe("CheckoutFlow: server errors route back to the right step", () => {
  it("sends shipping field errors back to step 2 and marks the field", async () => {
    seedCart([line()])
    vi.mocked(createOrder).mockResolvedValue({
      ok: false,
      code: "VALIDATION",
      message: "Revisá los datos ingresados.",
      fieldErrors: { "customer.phone": "Ingresá un teléfono válido" },
    })
    const { user } = await renderCheckout()
    await goToPayment(user)

    await confirm(user)

    expect(await stepHeading("Datos de envío")).toBeInTheDocument()
    expect(currentStep()).toHaveTextContent("Datos de envío")
    const phone = screen.getByLabelText("Teléfono")
    expect(phone).toHaveAttribute("aria-invalid", "true")
    expect(phone).toHaveAccessibleDescription("Ingresá un teléfono válido")
    expect(screen.getByText("Revisá los datos ingresados.")).toBeInTheDocument()
    expect(screen.getByLabelText("Nombre completo")).toHaveValue("Ana Perez")
  })

  it("sends a rejected country back to step 2 and marks the country field", async () => {
    seedCart([line()])
    vi.mocked(createOrder).mockResolvedValue({
      ok: false,
      code: "VALIDATION",
      message: "Revisá los datos ingresados.",
      fieldErrors: { "shippingAddress.country": "Elegí un país de la lista" },
    })
    const { user } = await renderCheckout()
    await goToPayment(user)

    await confirm(user)

    expect(await stepHeading("Datos de envío")).toBeInTheDocument()
    const country = screen.getByLabelText("País")
    expect(country).toHaveAttribute("aria-invalid", "true")
    expect(country).toHaveAccessibleDescription("Elegí un país de la lista")
  })

  it("sends a rejected shipping option back to step 2 and marks the zone field", async () => {
    seedCart([line()])
    vi.mocked(createOrder).mockResolvedValue({
      ok: false,
      code: "INVALID_SHIPPING_OPTION",
      message: "Elegí una zona de envío válida para continuar.",
    })
    const { user } = await renderCheckout()
    await goToPayment(user)

    await confirm(user)

    expect(await stepHeading("Datos de envío")).toBeInTheDocument()
    const zone = screen.getByLabelText("Ciudad / zona de envío")
    expect(zone).toHaveAttribute("aria-invalid", "true")
    expect(zone).toHaveAccessibleDescription("Elegí una zona de envío válida para continuar.")
  })

  it("lets the shopper fix the field and reach the payment step again", async () => {
    seedCart([line()])
    vi.mocked(createOrder).mockResolvedValueOnce({
      ok: false,
      code: "VALIDATION",
      message: "Revisá los datos ingresados.",
      fieldErrors: { "customer.phone": "Ingresá un teléfono válido" },
    })
    vi.mocked(createOrder).mockResolvedValueOnce({ ok: true, orderNumber: "RID-000009", accessToken: "tok" })
    const { user } = await renderCheckout()
    await goToPayment(user)
    await confirm(user)
    await stepHeading("Datos de envío")

    await cont(user)
    await stepHeading("Datos de pago")
    await confirm(user)

    await waitFor(() => expect(routerMock.push).toHaveBeenCalledWith("/order/RID-000009?token=tok"))
    expect(createOrder).toHaveBeenCalledTimes(2)
  })

  it("sends a stock failure back to step 1 with a clear message and the line error", async () => {
    seedCart([line()])
    vi.mocked(createOrder).mockResolvedValue({
      ok: false,
      code: "INSUFFICIENT_STOCK",
      message: "Solo quedan 1 unidades de uno de tus productos.",
      itemId: ID_A,
      available: 1,
    })
    const { user } = await renderCheckout()
    await goToPayment(user)

    await confirm(user)

    expect(await stepHeading("Tu selección")).toBeInTheDocument()
    expect(currentStep()).toHaveTextContent("Productos")
    const alerts = screen.getAllByRole("alert")
    expect(alerts.some((alert) => /Solo quedan 1 unidades/.test(alert.textContent ?? ""))).toBe(true)
    expect(within(screen.getByRole("list", { name: "Productos en tu carrito" })).queryByText("Cadena Milan")).toBeInTheDocument()
    expect(routerMock.push).not.toHaveBeenCalled()
    expect(localStorage.getItem("cart")).not.toBeNull()
  })

  it.each([
    ["ITEM_UNAVAILABLE", "Uno de tus productos ya no está disponible. Quitalo del carrito para continuar."],
    ["INVALID_QUANTITY", "La cantidad de uno de tus productos no es válida."],
  ] as const)("sends %s back to step 1", async (code, message) => {
    seedCart([line()])
    vi.mocked(createOrder).mockResolvedValue({ ok: false, code, message, itemId: ID_A })
    const { user } = await renderCheckout()
    await goToPayment(user)

    await confirm(user)

    expect(await stepHeading("Tu selección")).toBeInTheDocument()
    expect(screen.getAllByText(message).length).toBeGreaterThan(0)
  })

  it("asks to review the cart when the server rejects a line field", async () => {
    seedCart([line()])
    vi.mocked(createOrder).mockResolvedValue({
      ok: false,
      code: "VALIDATION",
      message: "Revisá los datos ingresados.",
      fieldErrors: { "lines.0.quantity": "La cantidad máxima por producto es 20" },
    })
    const { user } = await renderCheckout()
    await goToPayment(user)

    await confirm(user)

    expect(await stepHeading("Tu selección")).toBeInTheDocument()
    expect(screen.getByText("Revisá los productos de tu carrito.")).toBeInTheDocument()
  })

  it("moves focus to the heading of the step the shopper is sent back to", async () => {
    seedCart([line()])
    vi.mocked(createOrder).mockResolvedValue({ ok: false, code: "EMPTY_CART", message: "Tu carrito está vacío." })
    const { user } = await renderCheckout()
    await goToPayment(user)

    await confirm(user)

    await waitFor(() => expect(screen.getByRole("heading", { level: 2, name: "Tu selección" })).toHaveFocus())
  })
})
