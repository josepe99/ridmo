import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { describe, expect, it, vi } from "vitest"
import { INTERNATIONAL_SHIPPING_NOTICE, SHIPPING_COUNTRY_NAMES, SHIPPING_OPTIONS } from "@/modules/orders"
import { buildFormDefaults } from "../domain/form-defaults"
import { checkoutFormSchema, type CheckoutFormValues } from "../schemas/checkout.schema"
import { ShippingStep } from "./shipping-step"

// Leaflet needs a real browser: the tests drive the step through a stand-in picker with the same contract.
vi.mock("./location-picker", () => ({
  LocationPicker: ({
    value,
    onChange,
    describedBy,
  }: {
    value: { lat: number; lng: number } | null
    onChange: (next: { lat: number; lng: number } | null) => void
    describedBy?: string
  }) => (
    <div data-testid="map-picker" data-value={JSON.stringify(value)} data-described-by={describedBy}>
      <button type="button" onClick={() => onChange({ lat: -25.3, lng: -57.6 })}>
        Marcar punto de prueba
      </button>
    </div>
  ),
}))

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
  customer: { fullName: "Ana Perez", phone: "+595 981 000 000", email: "ana@example.com" },
  shippingAddress: {
    street: "Calle Palma 123",
    reference: "Casa 12",
    city: "Asunción",
    department: "Central",
    country: "Paraguay",
    shippingOptionId: "asuncion",
    postalCode: "",
    notes: "Tocar timbre",
    locationMode: "address",
    location: null,
  },
}

const withAddress = (overrides: Partial<CheckoutFormValues["shippingAddress"]>): CheckoutFormValues => ({
  ...valid,
  shippingAddress: { ...valid.shippingAddress, ...overrides },
})

const PIN = { lat: -25.3, lng: -57.6 }
const mapDefaults = withAddress({ locationMode: "map", street: "", reference: "", department: "" })
const mapWithPin = withAddress({ locationMode: "map", location: PIN })

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
      ZONE,
      "Ciudad",
      "País",
      "Notas de entrega",
    ]) {
      expect(screen.getByLabelText(label)).toBeInTheDocument()
    }
    for (const label of [/^Email/, /^Número o referencia/, /^Departamento \/ estado \/ provincia/, /^Código postal/]) {
      expect(screen.getByLabelText(label)).toBeInTheDocument()
    }
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

  it("marks reference, department and postal code as optional, and nothing else", () => {
    render(<Harness />)

    expect(screen.getAllByText("Opcional")).toHaveLength(3)
    for (const label of [/^Número o referencia.*Opcional$/, /^Departamento.*Opcional$/, /^Código postal.*Opcional$/]) {
      expect(screen.getByLabelText(label)).toBeInTheDocument()
    }
    for (const label of ["Calle", "País", ZONE, "Notas de entrega", "Nombre completo", "Teléfono", "Email"]) {
      // An exact-name lookup only matches labels without the "Opcional" suffix.
      expect(screen.getByLabelText(label)).toBeInTheDocument()
    }
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
        defaults={withAddress({ country: "Narnia" })}
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

    // Name, phone, email, street and notes; the city comes from the zone that is still to be chosen.
    expect(await screen.findAllByText("Completá este campo")).toHaveLength(5)
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
    expect(screen.getByLabelText("Email")).toHaveAttribute("aria-invalid", "true")
    expect(screen.getByLabelText(/^Código postal/)).not.toHaveAttribute("aria-invalid")
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

  describe("required common fields", () => {
    it.each([
      ["address", valid],
      ["map", mapWithPin],
    ])("requires delivery notes in %s mode and reports it on the field", async (_mode, defaults) => {
      const onValid = vi.fn()
      const user = userEvent.setup()
      render(
        <Harness
          defaults={{ ...defaults, shippingAddress: { ...defaults.shippingAddress, notes: "" } }}
          onValid={onValid}
        />
      )

      await user.click(screen.getByRole("button", { name: "Continuar" }))

      const notes = screen.getByLabelText("Notas de entrega")
      await waitFor(() => expect(notes).toHaveAttribute("aria-invalid", "true"))
      expect(notes).toHaveAccessibleDescription("Completá este campo")
      expect(onValid).not.toHaveBeenCalled()
    })

    it("does not accept whitespace as delivery notes", async () => {
      const onValid = vi.fn()
      const user = userEvent.setup()
      render(<Harness defaults={withAddress({ notes: "   " })} onValid={onValid} />)

      await user.click(screen.getByRole("button", { name: "Continuar" }))

      expect(await screen.findByText("Completá este campo")).toBeInTheDocument()
      expect(onValid).not.toHaveBeenCalled()
    })
  })

  describe("address mode", () => {
    it("is the default: street and the optional fields are shown and the map is not", () => {
      render(<Harness />)

      expect(screen.getByRole("radio", { name: "Escribir dirección" })).toBeChecked()
      expect(screen.getByRole("radio", { name: "Marcar en el mapa" })).not.toBeChecked()
      for (const label of ["Calle", /^Número o referencia/, /^Departamento/, /^Código postal/]) {
        expect(screen.getByLabelText(label)).toBeInTheDocument()
      }
      expect(screen.queryByTestId("map-picker")).not.toBeInTheDocument()
    })

    it("continues with only the street, the common fields and no optional field", async () => {
      const onValid = vi.fn()
      const user = userEvent.setup()
      render(<Harness defaults={withAddress({ reference: "", department: "", postalCode: "" })} onValid={onValid} />)

      await user.click(screen.getByRole("button", { name: "Continuar" }))

      await waitFor(() => expect(onValid).toHaveBeenCalledTimes(1))
      expect(onValid.mock.calls[0][0].shippingAddress).toMatchObject({
        street: "Calle Palma 123",
        locationMode: "address",
      })
    })

    it("requires the street", async () => {
      const onValid = vi.fn()
      const user = userEvent.setup()
      render(<Harness defaults={withAddress({ street: "" })} onValid={onValid} />)

      await user.click(screen.getByRole("button", { name: "Continuar" }))

      await waitFor(() => expect(screen.getByLabelText("Calle")).toHaveAttribute("aria-invalid", "true"))
      expect(onValid).not.toHaveBeenCalled()
    })
  })

  describe("location mode toggle", () => {
    const group = () => screen.getByRole("radiogroup", { name: /ubicación/i })

    it("offers a labelled radiogroup with the two options", () => {
      render(<Harness />)

      const radios = within(group()).getAllByRole("radio")
      expect(radios.map((radio) => radio.getAttribute("value"))).toEqual(["address", "map"])
      expect(within(group()).getByRole("radio", { name: "Escribir dirección" })).toBeInTheDocument()
      expect(within(group()).getByRole("radio", { name: "Marcar en el mapa" })).toBeInTheDocument()
    })

    it("switches with the keyboard", async () => {
      const user = userEvent.setup()
      render(<Harness />)

      screen.getByRole("radio", { name: "Escribir dirección" }).focus()
      await user.keyboard("{ArrowRight}")

      expect(screen.getByRole("radio", { name: "Marcar en el mapa" })).toBeChecked()
      expect(await screen.findByTestId("map-picker")).toBeInTheDocument()
    })

    it("hides the address inputs and shows the map in map mode, keeping the common fields", async () => {
      const user = userEvent.setup()
      render(<Harness />)

      await user.click(screen.getByRole("radio", { name: "Marcar en el mapa" }))

      expect(await screen.findByTestId("map-picker")).toBeInTheDocument()
      for (const label of ["Calle", /^Número o referencia/, /^Departamento/, /^Código postal/]) {
        expect(screen.queryByLabelText(label)).not.toBeInTheDocument()
      }
      for (const label of ["País", ZONE, "Notas de entrega", "Nombre completo", "Teléfono"]) {
        expect(screen.getByLabelText(label)).toBeInTheDocument()
      }
    })

    it("keeps the common values and the typed address when switching modes back and forth", async () => {
      const user = userEvent.setup()
      render(<Harness />)
      await user.type(screen.getByLabelText("Calle"), "Av. España 100")
      await user.type(screen.getByLabelText(/^Código postal/), "1234")
      await user.selectOptions(screen.getByLabelText(ZONE), "lambare")
      await user.type(screen.getByLabelText("Notas de entrega"), "Portón negro")

      await user.click(screen.getByRole("radio", { name: "Marcar en el mapa" }))
      await screen.findByTestId("map-picker")
      expect(screen.getByLabelText(ZONE)).toHaveValue("lambare")
      expect(screen.getByLabelText("Notas de entrega")).toHaveValue("Portón negro")
      expect(screen.getByLabelText("País")).toHaveValue("Paraguay")

      await user.click(screen.getByRole("radio", { name: "Escribir dirección" }))

      expect(screen.getByLabelText("Calle")).toHaveValue("Av. España 100")
      expect(screen.getByLabelText(/^Código postal/)).toHaveValue("1234")
      expect(screen.getByLabelText(ZONE)).toHaveValue("lambare")
      expect(screen.getByLabelText("Notas de entrega")).toHaveValue("Portón negro")
      expect(screen.queryByTestId("map-picker")).not.toBeInTheDocument()
    })

    it("keeps the pin when going back to address mode and returning to the map", async () => {
      const user = userEvent.setup()
      render(<Harness />)
      await user.click(screen.getByRole("radio", { name: "Marcar en el mapa" }))
      await user.click(await screen.findByRole("button", { name: "Marcar punto de prueba" }))

      await user.click(screen.getByRole("radio", { name: "Escribir dirección" }))
      await user.click(screen.getByRole("radio", { name: "Marcar en el mapa" }))

      expect((await screen.findByTestId("map-picker")).dataset.value).toBe(JSON.stringify(PIN))
    })

    it("does not let a hidden, invalid address field block the map order", async () => {
      const onValid = vi.fn()
      const user = userEvent.setup()
      render(
        <Harness
          defaults={withAddress({ postalCode: "12<3>", street: "", locationMode: "map", location: PIN })}
          onValid={onValid}
        />
      )

      await user.click(screen.getByRole("button", { name: "Continuar" }))

      await waitFor(() => expect(onValid).toHaveBeenCalledTimes(1))
    })

    it("drops the street error once the shopper moves to the map and back", async () => {
      const user = userEvent.setup()
      render(<Harness defaults={withAddress({ street: "" })} />)
      await user.click(screen.getByRole("button", { name: "Continuar" }))
      await waitFor(() => expect(screen.getByLabelText("Calle")).toHaveAttribute("aria-invalid", "true"))

      await user.click(screen.getByRole("radio", { name: "Marcar en el mapa" }))
      await user.click(screen.getByRole("radio", { name: "Escribir dirección" }))

      expect(screen.getByLabelText("Calle")).not.toHaveAttribute("aria-invalid")
    })
  })

  describe("map mode", () => {
    it("shows the map field with its label and no pin readout at first", async () => {
      render(<Harness defaults={mapDefaults} />)

      expect(await screen.findByTestId("map-picker")).toBeInTheDocument()
      expect(screen.getByText("Ubicación en el mapa")).toBeInTheDocument()
      expect(screen.queryByRole("button", { name: "Quitar ubicación" })).not.toBeInTheDocument()
    })

    it("blocks continuing without a pin and announces the error on the map field", async () => {
      const onValid = vi.fn()
      const user = userEvent.setup()
      render(<Harness defaults={mapDefaults} onValid={onValid} />)

      await user.click(screen.getByRole("button", { name: "Continuar" }))

      const alert = await screen.findByText("Marcá tu ubicación en el mapa")
      expect(alert).toHaveAttribute("role", "alert")
      expect(alert).toHaveAttribute("id", "location-error")
      expect(screen.getByTestId("map-picker").dataset.describedBy).toContain("location-error")
      expect(onValid).not.toHaveBeenCalled()
    })

    it("marks a pin, shows the readout and continues with the coordinates", async () => {
      const onValid = vi.fn()
      const user = userEvent.setup()
      render(<Harness defaults={mapDefaults} onValid={onValid} />)

      await user.click(await screen.findByRole("button", { name: "Marcar punto de prueba" }))

      expect(screen.getByText(/-25\.300000, -57\.600000/)).toBeInTheDocument()
      await user.click(screen.getByRole("button", { name: "Continuar" }))

      await waitFor(() => expect(onValid).toHaveBeenCalledTimes(1))
      expect(onValid.mock.calls[0][0].shippingAddress).toMatchObject({
        locationMode: "map",
        location: PIN,
        shippingOptionId: "asuncion",
        notes: "Tocar timbre",
      })
    })

    it("clears the missing-pin error as soon as a pin is marked", async () => {
      const user = userEvent.setup()
      render(<Harness defaults={mapDefaults} />)
      await user.click(screen.getByRole("button", { name: "Continuar" }))
      await screen.findByText("Marcá tu ubicación en el mapa")

      await user.click(screen.getByRole("button", { name: "Marcar punto de prueba" }))

      expect(screen.queryByText("Marcá tu ubicación en el mapa")).not.toBeInTheDocument()
    })

    it("removes the pin with Quitar ubicación", async () => {
      const onValid = vi.fn()
      const user = userEvent.setup()
      render(<Harness defaults={mapDefaults} onValid={onValid} />)
      await user.click(await screen.findByRole("button", { name: "Marcar punto de prueba" }))

      await user.click(screen.getByRole("button", { name: "Quitar ubicación" }))

      expect(screen.queryByRole("button", { name: "Quitar ubicación" })).not.toBeInTheDocument()
      expect(screen.getByTestId("map-picker").dataset.value).toBe("null")
      await user.click(screen.getByRole("button", { name: "Continuar" }))
      expect(await screen.findByText("Marcá tu ubicación en el mapa")).toBeInTheDocument()
      expect(onValid).not.toHaveBeenCalled()
    })

    it("hides the typed city for a city zone and sends the city of the zone", async () => {
      const onValid = vi.fn()
      const user = userEvent.setup()
      render(
        <Harness
          defaults={withAddress({ locationMode: "map", location: PIN, shippingOptionId: "", city: "" })}
          onValid={onValid}
        />
      )
      expect(screen.queryByLabelText("Ciudad")).not.toBeInTheDocument()

      await user.selectOptions(screen.getByLabelText(ZONE), "luque-2")

      expect(screen.queryByLabelText("Ciudad")).not.toBeInTheDocument()
      await user.click(screen.getByRole("button", { name: "Continuar" }))
      await waitFor(() => expect(onValid).toHaveBeenCalledTimes(1))
      expect(onValid.mock.calls[0][0].shippingAddress).toMatchObject({ shippingOptionId: "luque-2", city: "Luque" })
    })

    it("asks for a zone, not for a hidden city, when none is chosen yet", async () => {
      const user = userEvent.setup()
      render(<Harness defaults={withAddress({ locationMode: "map", location: PIN, shippingOptionId: "", city: "" })} />)

      await user.click(screen.getByRole("button", { name: "Continuar" }))

      expect(await screen.findByText("Elegí una zona de envío")).toBeInTheDocument()
      expect(screen.getByLabelText(ZONE)).toHaveAttribute("aria-invalid", "true")
    })

    it("keeps a required typed city for an interior zone", async () => {
      const onValid = vi.fn()
      const user = userEvent.setup()
      render(<Harness defaults={mapWithPin} onValid={onValid} />)

      await user.selectOptions(screen.getByLabelText(ZONE), "interior")

      expect(screen.getByLabelText("Ciudad")).toHaveValue("")
      await user.click(screen.getByRole("button", { name: "Continuar" }))
      await waitFor(() => expect(screen.getByLabelText("Ciudad")).toHaveAttribute("aria-invalid", "true"))
      expect(onValid).not.toHaveBeenCalled()

      await user.type(screen.getByLabelText("Ciudad"), "Encarnación")
      await user.click(screen.getByRole("button", { name: "Continuar" }))
      await waitFor(() => expect(onValid).toHaveBeenCalledTimes(1))
    })

    it("keeps a required typed city abroad", async () => {
      const onValid = vi.fn()
      const user = userEvent.setup()
      render(<Harness defaults={mapWithPin} onValid={onValid} />)

      await user.selectOptions(screen.getByLabelText("País"), "Argentina")

      expect(screen.getByLabelText("Ciudad")).toHaveValue("")
      await user.click(screen.getByRole("button", { name: "Continuar" }))
      await waitFor(() => expect(screen.getByLabelText("Ciudad")).toHaveAttribute("aria-invalid", "true"))
      expect(onValid).not.toHaveBeenCalled()

      await user.type(screen.getByLabelText("Ciudad"), "Buenos Aires")
      await user.click(screen.getByRole("button", { name: "Continuar" }))
      await waitFor(() => expect(onValid).toHaveBeenCalledTimes(1))
    })
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
      render(<Harness defaults={withAddress({ shippingOptionId: "" })} onValid={onValid} />)

      await user.click(screen.getByRole("button", { name: "Continuar" }))

      expect(await screen.findByText("Elegí una zona de envío")).toBeInTheDocument()
      expect(zone()).toHaveAttribute("aria-invalid", "true")
      expect(onValid).not.toHaveBeenCalled()
    })

    it("clears the zone error once a zone is chosen", async () => {
      const user = userEvent.setup()
      render(<Harness defaults={withAddress({ shippingOptionId: "" })} />)
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
        <Harness defaults={withAddress({ shippingOptionId: "interior", city: "Encarnación" })} onValid={onValid} />
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
