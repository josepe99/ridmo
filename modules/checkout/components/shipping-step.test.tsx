import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { describe, expect, it, vi } from "vitest"
import { buildFormDefaults } from "../domain/form-defaults"
import { checkoutFormSchema, type CheckoutFormValues } from "../schemas/checkout.schema"
import { ShippingStep } from "./shipping-step"

type HarnessProps = {
  defaults?: CheckoutFormValues
  onBack?: () => void
  onValid?: (values: CheckoutFormValues) => void
  message?: string | null
}

/** Mirrors how the flow wires the step: a shared form plus a `trigger()` on continue. */
function Harness({ defaults, onBack = vi.fn(), onValid = vi.fn(), message }: HarnessProps) {
  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutFormSchema),
    mode: "onTouched",
    defaultValues: defaults ?? buildFormDefaults(),
  })
  return (
    <ShippingStep
      form={form}
      message={message}
      onBack={onBack}
      onContinue={async () => {
        if (await form.trigger()) onValid(form.getValues())
      }}
      summary={<p>resumen compacto</p>}
    />
  )
}

const valid: CheckoutFormValues = {
  customer: { fullName: "Ana Perez", phone: "+595 981 000 000", email: "" },
  shippingAddress: {
    street: "Calle Palma 123",
    reference: "Casa 12",
    city: "Asuncion",
    department: "Central",
    country: "Paraguay",
    notes: "",
  },
}

describe("ShippingStep", () => {
  it("renders its heading and every labeled field", () => {
    render(<Harness />)

    expect(screen.getByRole("heading", { level: 2, name: "Datos de envío" })).toBeInTheDocument()
    expect(screen.getByText("Paso 2 de 3")).toBeInTheDocument()
    for (const label of ["Nombre completo", "Teléfono", "Calle", "Número o referencia", "Ciudad", "Departamento"]) {
      expect(screen.getByLabelText(label)).toBeInTheDocument()
    }
    expect(screen.getByLabelText(/^Email/)).toBeInTheDocument()
    expect(screen.getByLabelText(/^Notas de entrega/)).toBeInTheDocument()
  })

  it("shows Paraguay as a fixed country, not as an editable field", () => {
    render(<Harness />)

    expect(screen.getByText("Paraguay")).toBeInTheDocument()
    expect(screen.queryByLabelText("País")).not.toBeInTheDocument()
  })

  it("marks email and notes as optional", () => {
    render(<Harness />)

    expect(screen.getAllByText("Opcional")).toHaveLength(2)
  })

  it("shows a message per required field and does not continue with an empty form", async () => {
    const onValid = vi.fn()
    const user = userEvent.setup()
    render(<Harness onValid={onValid} />)

    await user.click(screen.getByRole("button", { name: "Continuar" }))

    expect(await screen.findAllByText("Completá este campo")).toHaveLength(6)
    expect(onValid).not.toHaveBeenCalled()
  })

  it("links each invalid field to its message with aria-invalid and aria-describedby", async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.click(screen.getByRole("button", { name: "Continuar" }))

    const name = screen.getByLabelText("Nombre completo")
    await waitFor(() => expect(name).toHaveAttribute("aria-invalid", "true"))
    expect(name).toHaveAttribute("aria-describedby", "fullName-error")
    expect(name).toHaveAccessibleDescription("Completá este campo")
    expect(screen.getByLabelText(/^Email/)).not.toHaveAttribute("aria-invalid")
  })

  it("rejects an invalid phone and an invalid email", async () => {
    const onValid = vi.fn()
    const user = userEvent.setup()
    render(
      <Harness
        defaults={{ ...valid, customer: { ...valid.customer, phone: "abc", email: "nope" } }}
        onValid={onValid}
      />
    )

    await user.click(screen.getByRole("button", { name: "Continuar" }))

    expect(await screen.findByText("Ingresá un teléfono válido")).toBeInTheDocument()
    expect(screen.getByText("Ingresá un email válido")).toBeInTheDocument()
    expect(onValid).not.toHaveBeenCalled()
  })

  it("continues with valid data and keeps the typed values", async () => {
    const onValid = vi.fn()
    const user = userEvent.setup()
    render(<Harness defaults={valid} onValid={onValid} />)

    await user.click(screen.getByRole("button", { name: "Continuar" }))

    await waitFor(() => expect(onValid).toHaveBeenCalledTimes(1))
    expect(onValid.mock.calls[0][0]).toEqual(valid)
  })

  it("continues with the Enter key", async () => {
    const onValid = vi.fn()
    const user = userEvent.setup()
    render(<Harness defaults={valid} onValid={onValid} />)

    await user.type(screen.getByLabelText("Ciudad"), "{Enter}")

    await waitFor(() => expect(onValid).toHaveBeenCalledTimes(1))
  })

  it("goes back with Volver", async () => {
    const onBack = vi.fn()
    const user = userEvent.setup()
    render(<Harness onBack={onBack} />)

    await user.click(screen.getByRole("button", { name: "Volver" }))

    expect(onBack).toHaveBeenCalledTimes(1)
  })

  it("announces a step level message and renders the compact summary", () => {
    render(<Harness message="Revisá los datos ingresados." />)

    expect(screen.getByRole("alert")).toHaveTextContent("Revisá los datos ingresados.")
    expect(screen.getByText("resumen compacto")).toBeInTheDocument()
  })
})
