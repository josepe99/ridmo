import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { describe, expect, it, vi } from "vitest"
import { INTERNATIONAL_SHIPPING_NOTICE, SHIPPING_COUNTRY_NAMES, SHIPPING_OPTIONS } from "@/modules/orders"
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
    city: "Asunción",
    department: "Central",
    country: "Paraguay",
    shippingOptionId: "asuncion",
    postalCode: "",
    notes: "",
  },
}

const ZONE = "Ciudad / zona de envío"

describe("ShippingStep", () => {
  it("renders its heading and every labeled field", () => {
    render(<Harness />)

    expect(screen.getByRole("heading", { level: 2, name: "Datos de envío" })).toBeInTheDocument()
    expect(screen.getByText("Paso 2 de 3")).toBeInTheDocument()
    for (const label of [
      "Nombre completo",
      "Teléfono",
      "Calle",
      "Número o referencia",
      ZONE,
      "Ciudad",
      "Departamento / estado / provincia",
      "País",
    ]) {
      expect(screen.getByLabelText(label)).toBeInTheDocument()
    }
    expect(screen.getByLabelText(/^Email/)).toBeInTheDocument()
    expect(screen.getByLabelText(/^Notas de entrega/)).toBeInTheDocument()
    expect(screen.getByLabelText(/^Código postal/)).toBeInTheDocument()
  })

  it("offers a country selector with Paraguay preselected and first", () => {
    render(<Harness />)

    const country = screen.getByLabelText("País")
    expect(country.tagName).toBe("SELECT")
    expect(country).toHaveValue("Paraguay")
    const options = within(country)
      .getAllByRole("option")
      .map((option) => option.textContent)
    expect(options[0]).toBe("Paraguay")
    expect(options).toEqual(SHIPPING_COUNTRY_NAMES)
    expect(options).toContain("Argentina")
  })

  it("marks email, postal code and notes as optional", () => {
    render(<Harness />)

    expect(screen.getAllByText("Opcional")).toHaveLength(3)
  })

  it("continues with another country and a postal code", async () => {
    const onValid = vi.fn()
    const user = userEvent.setup()
    render(<Harness defaults={valid} onValid={onValid} />)

    await user.selectOptions(screen.getByLabelText("País"), "Argentina")
    await user.type(screen.getByLabelText("Ciudad"), "Buenos Aires")
    await user.type(screen.getByLabelText(/^Código postal/), "C1425")
    await user.click(screen.getByRole("button", { name: "Continuar" }))

    await waitFor(() => expect(onValid).toHaveBeenCalledTimes(1))
    expect(onValid.mock.calls[0][0].shippingAddress).toMatchObject({ country: "Argentina", postalCode: "C1425" })
  })

  it("blocks a country outside the list and reports it on the field", async () => {
    const onValid = vi.fn()
    const user = userEvent.setup()
    render(
      <Harness
        defaults={{ ...valid, shippingAddress: { ...valid.shippingAddress, country: "Narnia" } }}
        onValid={onValid}
      />
    )

    await user.click(screen.getByRole("button", { name: "Continuar" }))

    expect(await screen.findByText("Elegí un país de la lista")).toBeInTheDocument()
    const country = screen.getByLabelText("País")
    expect(country).toHaveAttribute("aria-invalid", "true")
    expect(country).toHaveAccessibleDescription("Elegí un país de la lista")
    expect(onValid).not.toHaveBeenCalled()
  })

  it("rejects a postal code with unsupported characters", async () => {
    const onValid = vi.fn()
    const user = userEvent.setup()
    render(<Harness defaults={valid} onValid={onValid} />)

    await user.type(screen.getByLabelText(/^Código postal/), "12<3>")
    await user.click(screen.getByRole("button", { name: "Continuar" }))

    expect(await screen.findByText("Usá solo letras, números, espacios o guiones")).toBeInTheDocument()
    expect(onValid).not.toHaveBeenCalled()
  })

  it("shows a message per required field and does not continue with an empty form", async () => {
    const onValid = vi.fn()
    const user = userEvent.setup()
    render(<Harness onValid={onValid} />)

    await user.click(screen.getByRole("button", { name: "Continuar" }))

    expect(await screen.findAllByText("Completá este campo")).toHaveLength(6)
    expect(screen.getByText("Elegí una zona de envío")).toBeInTheDocument()
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

    await user.type(screen.getByLabelText("Calle"), "{Enter}")

    await waitFor(() => expect(onValid).toHaveBeenCalledTimes(1))
  })

  describe("Paraguay shipping zone", () => {
    const zone = () => screen.getByLabelText(ZONE) as HTMLSelectElement
    const optionTexts = () => Array.from(zone().options).map((option) => option.textContent)

    it("offers every zone with its price after a placeholder, defaulting to none", () => {
      render(<Harness />)

      expect(zone().tagName).toBe("SELECT")
      expect(zone()).toHaveValue("")
      expect(optionTexts()[0]).toBe("Elegí una zona")
      expect(optionTexts()).toContain("Asunción · Gs. 20.000")
      expect(optionTexts()).toContain("Lambaré · Gs. 15.000")
      expect(optionTexts()).toContain("Luque 1 · Gs. 30.000")
      expect(optionTexts()).toContain("Luque 2 · Gs. 35.000")
      expect(optionTexts()).toContain("Interior del país · Gs. 30.000")
      expect(optionTexts()).toContain("Interior del país, entrega en puerta · Gs. 35.000")
      expect(optionTexts()).toHaveLength(1 + SHIPPING_OPTIONS.length)
    })

    it("fills the city from a city zone and does not let it be edited", async () => {
      const user = userEvent.setup()
      render(<Harness />)

      await user.selectOptions(zone(), "luque-2")

      expect(screen.getByLabelText("Ciudad")).toHaveValue("Luque")
      expect(screen.getByLabelText("Ciudad")).toHaveAttribute("readonly")
    })

    it("lets the shopper type the city for interior deliveries and clears the one filled by a city zone", async () => {
      const user = userEvent.setup()
      render(<Harness />)
      await user.selectOptions(zone(), "asuncion")
      expect(screen.getByLabelText("Ciudad")).toHaveValue("Asunción")

      await user.selectOptions(zone(), "interior")

      expect(screen.getByLabelText("Ciudad")).toHaveValue("")
      expect(screen.getByLabelText("Ciudad")).not.toHaveAttribute("readonly")
      await user.type(screen.getByLabelText("Ciudad"), "Encarnación")
      await user.selectOptions(zone(), "interior-door")
      expect(screen.getByLabelText("Ciudad")).toHaveValue("Encarnación")
    })

    it("explains how an interior delivery works and when it arrives", async () => {
      const user = userEvent.setup()
      render(<Harness />)

      await user.selectOptions(zone(), "interior-door")

      expect(screen.getByText(/Entrega en la puerta de tu domicilio/)).toBeInTheDocument()
      expect(screen.getByText(/Llega en 1 día/)).toBeInTheDocument()
      expect(zone()).toHaveAccessibleDescription(/Llega en 1 día/)
    })

    it("requires a zone to continue and reports it on the field", async () => {
      const onValid = vi.fn()
      const user = userEvent.setup()
      render(
        <Harness
          defaults={{ ...valid, shippingAddress: { ...valid.shippingAddress, shippingOptionId: "" } }}
          onValid={onValid}
        />
      )

      await user.click(screen.getByRole("button", { name: "Continuar" }))

      expect(await screen.findByText("Elegí una zona de envío")).toBeInTheDocument()
      expect(zone()).toHaveAttribute("aria-invalid", "true")
      expect(onValid).not.toHaveBeenCalled()
    })

    it("clears the zone error once a zone is chosen", async () => {
      const user = userEvent.setup()
      render(<Harness defaults={{ ...valid, shippingAddress: { ...valid.shippingAddress, shippingOptionId: "" } }} />)
      await user.click(screen.getByRole("button", { name: "Continuar" }))
      await screen.findByText("Elegí una zona de envío")

      await user.selectOptions(zone(), "lambare")

      await waitFor(() => expect(screen.queryByText("Elegí una zona de envío")).not.toBeInTheDocument())
    })

    it("continues with the chosen zone and the city taken from it", async () => {
      const onValid = vi.fn()
      const user = userEvent.setup()
      render(<Harness defaults={valid} onValid={onValid} />)

      await user.selectOptions(zone(), "luque-1")
      await user.click(screen.getByRole("button", { name: "Continuar" }))

      await waitFor(() => expect(onValid).toHaveBeenCalledTimes(1))
      expect(onValid.mock.calls[0][0].shippingAddress).toMatchObject({
        shippingOptionId: "luque-1",
        city: "Luque",
      })
    })

    it("requires the typed city for an interior delivery", async () => {
      const onValid = vi.fn()
      const user = userEvent.setup()
      render(<Harness defaults={valid} onValid={onValid} />)

      await user.selectOptions(zone(), "interior")
      await user.click(screen.getByRole("button", { name: "Continuar" }))

      expect(await screen.findByText("Completá este campo")).toBeInTheDocument()
      expect(onValid).not.toHaveBeenCalled()
    })
  })

  describe("international destinations", () => {
    it("hides the zone selector, shows the coordination notice and no price", async () => {
      const user = userEvent.setup()
      render(<Harness defaults={valid} />)

      await user.selectOptions(screen.getByLabelText("País"), "Argentina")

      expect(screen.queryByLabelText(ZONE)).not.toBeInTheDocument()
      expect(screen.getByRole("note")).toHaveTextContent(INTERNATIONAL_SHIPPING_NOTICE)
      expect(screen.queryByText(/Gs\./)).not.toBeInTheDocument()
    })

    it("drops the Paraguay zone and the city it filled when the country changes", async () => {
      const user = userEvent.setup()
      render(<Harness defaults={valid} />)

      await user.selectOptions(screen.getByLabelText("País"), "Argentina")

      expect(screen.getByLabelText("Ciudad")).toHaveValue("")
      expect(screen.getByLabelText("Ciudad")).not.toHaveAttribute("readonly")
    })

    it("keeps a city the shopper typed themselves when the country changes", async () => {
      const onValid = vi.fn()
      const user = userEvent.setup()
      render(
        <Harness
          defaults={{ ...valid, shippingAddress: { ...valid.shippingAddress, shippingOptionId: "interior", city: "Encarnación" } }}
          onValid={onValid}
        />
      )

      await user.selectOptions(screen.getByLabelText("País"), "Argentina")
      await user.click(screen.getByRole("button", { name: "Continuar" }))

      await waitFor(() => expect(onValid).toHaveBeenCalledTimes(1))
      expect(onValid.mock.calls[0][0].shippingAddress).toMatchObject({
        country: "Argentina",
        city: "Encarnación",
        shippingOptionId: "",
      })
    })

    it("continues without a zone for another country", async () => {
      const onValid = vi.fn()
      const user = userEvent.setup()
      render(<Harness defaults={valid} onValid={onValid} />)

      await user.selectOptions(screen.getByLabelText("País"), "Argentina")
      await user.type(screen.getByLabelText("Ciudad"), "Rosario")
      await user.click(screen.getByRole("button", { name: "Continuar" }))

      await waitFor(() => expect(onValid).toHaveBeenCalledTimes(1))
    })

    it("shows the zone selector again when going back to Paraguay", async () => {
      const user = userEvent.setup()
      render(<Harness defaults={valid} />)
      await user.selectOptions(screen.getByLabelText("País"), "Argentina")

      await user.selectOptions(screen.getByLabelText("País"), "Paraguay")

      expect(screen.getByLabelText(ZONE)).toHaveValue("")
    })
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
