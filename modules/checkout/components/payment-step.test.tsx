import type { ComponentProps } from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { INTERNATIONAL_SHIPPING_NOTICE } from "@/modules/orders"
import type { CheckoutFormValues } from "../schemas/checkout.schema"
import type { BankTransferDetails } from "../services/bank-details"
import { PaymentStep } from "./payment-step"

const values: CheckoutFormValues = {
  customer: { fullName: "Ana Perez", phone: "+595 981 000 000", email: "ana@example.com" },
  shippingAddress: {
    street: "Calle Palma 123",
    reference: "Casa 12",
    city: "Asuncion",
    department: "Central",
    country: "Paraguay",
    shippingOptionId: "asuncion",
    postalCode: "",
    notes: "Portón negro",
  },
}

const bank: BankTransferDetails = {
  bankName: "Banco Ueno",
  accountHolder: "RIDMO S.A.",
  accountNumber: "123456789",
  alias: "ridmo.pay",
  notes: "Enviar comprobante por WhatsApp",
}

function setup(props: Partial<ComponentProps<typeof PaymentStep>> = {}) {
  const handlers = { onBack: vi.fn(), onEdit: vi.fn(), onConfirm: vi.fn() }
  render(<PaymentStep values={values} bank={bank} isPending={false} {...handlers} {...props} />)
  return { ...handlers, user: userEvent.setup() }
}

describe("PaymentStep", () => {
  it("renders its heading and a pre-selected, only payment method", () => {
    setup()

    expect(screen.getByRole("heading", { level: 2, name: "Datos de pago" })).toBeInTheDocument()
    expect(screen.getByText("Paso 3 de 3")).toBeInTheDocument()
    const radios = screen.getAllByRole("radio")
    expect(radios).toHaveLength(1)
    expect(radios[0]).toBeChecked()
    expect(screen.getByText("Transferencia bancaria")).toBeInTheDocument()
  })

  it("shows the configured bank transfer details", () => {
    setup()

    expect(screen.getByText("Banco Ueno")).toBeInTheDocument()
    expect(screen.getByText("RIDMO S.A.")).toBeInTheDocument()
    expect(screen.getByText("123456789")).toBeInTheDocument()
    expect(screen.getByText("ridmo.pay")).toBeInTheDocument()
    expect(screen.getByText("Enviar comprobante por WhatsApp")).toBeInTheDocument()
  })

  it("falls back to a message when the bank details are not configured", () => {
    setup({ bank: { bankName: "", accountHolder: "", accountNumber: "", alias: "", notes: "" } })

    expect(screen.getByText(/Te enviaremos los datos bancarios/)).toBeInTheDocument()
  })

  it("explains that the order stays pending until the transfer is received", () => {
    setup()

    expect(screen.getByText(/queda pendiente hasta que recibamos la transferencia/)).toBeInTheDocument()
  })

  it("recaps contact and address read-only", () => {
    setup()

    for (const text of ["Ana Perez", "+595 981 000 000", "ana@example.com", "Portón negro"]) {
      expect(screen.getByText(text)).toBeInTheDocument()
    }
    expect(screen.getByText(/Calle Palma 123, Casa 12/)).toBeInTheDocument()
    expect(screen.getByText(/Asuncion, Central/)).toBeInTheDocument()
    expect(screen.getByText(/Paraguay/)).toBeInTheDocument()
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument()
  })

  it("recaps the chosen shipping zone with its price", () => {
    setup()

    expect(screen.getByText("Envío")).toBeInTheDocument()
    expect(screen.getByText("Asunción · Gs. 20.000")).toBeInTheDocument()
  })

  it("recaps the interior delivery type with its price", () => {
    setup({ values: { ...values, shippingAddress: { ...values.shippingAddress, shippingOptionId: "interior-door" } } })

    expect(screen.getByText("Interior del país, entrega en puerta · Gs. 35.000")).toBeInTheDocument()
  })

  it("shows no shipping price for an international address, only the coordination notice", () => {
    setup({
      values: {
        ...values,
        shippingAddress: { ...values.shippingAddress, country: "Argentina", shippingOptionId: "asuncion" },
      },
    })

    expect(screen.queryByText("Envío")).not.toBeInTheDocument()
    expect(screen.queryByText(/Gs\./)).not.toBeInTheDocument()
    expect(screen.getByText(INTERNATIONAL_SHIPPING_NOTICE)).toBeInTheDocument()
  })

  it("omits the shipping row when no zone was chosen", () => {
    setup({ values: { ...values, shippingAddress: { ...values.shippingAddress, shippingOptionId: "" } } })

    expect(screen.queryByText("Envío")).not.toBeInTheDocument()
  })

  it("shows the postal code row only when provided", () => {
    const { unmount } = render(
      <PaymentStep
        values={{ ...values, shippingAddress: { ...values.shippingAddress, postalCode: "C1425" } }}
        bank={bank}
        isPending={false}
        onBack={vi.fn()}
        onEdit={vi.fn()}
        onConfirm={vi.fn()}
      />
    )
    expect(screen.getByText("Código postal")).toBeInTheDocument()
    expect(screen.getByText("C1425")).toBeInTheDocument()
    unmount()

    setup()
    expect(screen.queryByText("Código postal")).not.toBeInTheDocument()
  })

  it("shows no international shipping notice for a Paraguay address", () => {
    setup()

    expect(screen.queryByText(INTERNATIONAL_SHIPPING_NOTICE)).not.toBeInTheDocument()
  })

  it("shows the country and the international shipping notice for another country", () => {
    setup({ values: { ...values, shippingAddress: { ...values.shippingAddress, country: "Argentina" } } })

    expect(screen.getByText(/Argentina/)).toBeInTheDocument()
    expect(screen.getByText(INTERNATIONAL_SHIPPING_NOTICE)).toBeInTheDocument()
  })

  it("omits email and notes from the recap when empty", () => {
    setup({
      values: {
        customer: { ...values.customer, email: "" },
        shippingAddress: { ...values.shippingAddress, notes: "" },
      },
    })

    expect(screen.queryByText("Email")).not.toBeInTheDocument()
    expect(screen.queryByText("Notas")).not.toBeInTheDocument()
  })

  it("sends the shopper back to the shipping step with Editar", async () => {
    const { user, onEdit } = setup()

    await user.click(screen.getByRole("button", { name: "Editar datos de envío" }))

    expect(onEdit).toHaveBeenCalledTimes(1)
  })

  it("goes back with Volver", async () => {
    const { user, onBack } = setup()

    await user.click(screen.getByRole("button", { name: "Volver" }))

    expect(onBack).toHaveBeenCalledTimes(1)
  })

  it("confirms the order with the final button", async () => {
    const { user, onConfirm } = setup()

    await user.click(screen.getByRole("button", { name: "Confirmar pedido" }))

    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it("disables the button and shows progress while pending", () => {
    setup({ isPending: true })

    expect(screen.getByRole("button", { name: "Procesando..." })).toBeDisabled()
    expect(screen.getByRole("form", { name: "Datos de pago" })).toHaveAttribute("aria-busy", "true")
  })

  it("announces an error message", () => {
    setup({ message: "No pudimos registrar tu pedido." })

    expect(screen.getByRole("alert")).toHaveTextContent("No pudimos registrar tu pedido.")
  })

  it("renders the compact summary slot", () => {
    setup({ summary: <p>resumen compacto</p> })

    expect(screen.getByText("resumen compacto")).toBeInTheDocument()
  })
})
