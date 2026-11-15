import type { FormEvent, ReactNode } from "react"
import type { ChangeHandler, UseFormReturn } from "react-hook-form"
import {
  InternationalShippingNotice,
  SHIPPING_COUNTRY_NAMES,
  SHIPPING_OPTIONS,
  getShippingOption,
  isDomesticShipment,
} from "@/modules/orders"
import { formatGuaranies } from "@/shared/lib/currency"
import type { CheckoutFormValues } from "../schemas/checkout.schema"
import { StepActions } from "./step-actions"
import { SelectField } from "./select-field"
import { EYEBROW, StepHeading } from "./step-heading"
import { TextField } from "./text-field"

type ShippingStepProps = {
  form: UseFormReturn<CheckoutFormValues>
  /** Step-level message (e.g. "Revisá los datos ingresados." after a server validation error). */
  message?: string | null
  onBack: () => void
  /** Called on submit (button or Enter). The flow validates and decides whether to advance. */
  onContinue: () => void
  /** Compact order summary shown above the buttons on small screens. */
  summary?: ReactNode
}

const ZONE_OPTIONS = SHIPPING_OPTIONS.map((option) => ({
  value: option.id,
  label: `${option.label} · ${formatGuaranies(option.cost)}`,
}))

const ZONE_HINT_ID = "shippingOptionId-hint"

/** Step 2: contact and shipping address. Values live in the parent form, so going back never loses them. */
export function ShippingStep({ form, message, onBack, onContinue, summary }: ShippingStepProps) {
  const {
    register,
    setValue,
    clearErrors,
    formState: { errors },
  } = form

  const country = form.watch("shippingAddress.country")
  const isDomestic = isDomesticShipment(country)
  const zone = isDomestic ? getShippingOption(form.watch("shippingAddress.shippingOptionId")) : null
  // A city zone fixes the city (and its price); only interior deliveries use the typed one.
  const cityIsFixed = zone?.kind === "city"
  const cityError = errors.shippingAddress?.city?.message

  const zoneRegistration = register("shippingAddress.shippingOptionId")
  const countryRegistration = register("shippingAddress.country")

  const setCity = (value: string) =>
    setValue("shippingAddress.city", value, { shouldDirty: true, shouldValidate: Boolean(cityError) })

  const handleZoneChange: ChangeHandler = async (event) => {
    await zoneRegistration.onChange(event)
    const chosen = getShippingOption(event.target.value)
    clearErrors("shippingAddress.shippingOptionId")
    if (chosen?.city) setCity(chosen.city)
    else if (cityIsFixed) setCity("")
  }

  const handleCountryChange: ChangeHandler = async (event) => {
    await countryRegistration.onChange(event)
    if (isDomesticShipment(event.target.value)) return
    // The zone only makes sense in Paraguay; drop it, and the city it filled in.
    setValue("shippingAddress.shippingOptionId", "", { shouldDirty: true })
    clearErrors("shippingAddress.shippingOptionId")
    if (cityIsFixed) setCity("")
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onContinue()
  }

  const zoneHint = zone ? [zone.eta, zone.description].filter(Boolean).join(" ") : ""

  return (
    <form onSubmit={handleSubmit} noValidate aria-label="Datos de envío">
      <StepHeading step="shipping" title="Datos de envío" />

      {message ? (
        <p role="alert" className="mb-8 border-l-2 border-black pl-3 text-sm font-medium text-neutral-900">
          {message}
        </p>
      ) : null}

      <fieldset className="mb-12">
        <legend className={`${EYEBROW} mb-4`}>Contacto</legend>
        <div className="grid gap-x-8 sm:grid-cols-2">
          <TextField
            id="fullName"
            label="Nombre completo"
            autoComplete="name"
            registration={register("customer.fullName")}
            error={errors.customer?.fullName?.message}
            className="sm:col-span-2"
          />
          <TextField
            id="phone"
            label="Teléfono"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="+595 981 000 000"
            registration={register("customer.phone")}
            error={errors.customer?.phone?.message}
          />
          <TextField
            id="email"
            label="Email"
            type="email"
            inputMode="email"
            autoComplete="email"
            optional
            registration={register("customer.email")}
            error={errors.customer?.email?.message}
          />
        </div>
      </fieldset>

      <fieldset>
        <legend className={`${EYEBROW} mb-4`}>Dirección de envío</legend>
        <div className="grid gap-x-8 sm:grid-cols-2">
          <TextField
            id="street"
            label="Calle"
            autoComplete="address-line1"
            registration={register("shippingAddress.street")}
            error={errors.shippingAddress?.street?.message}
            className="sm:col-span-2"
          />
          <TextField
            id="reference"
            label="Número o referencia"
            autoComplete="address-line2"
            placeholder="Casa 12, portón negro"
            registration={register("shippingAddress.reference")}
            error={errors.shippingAddress?.reference?.message}
            className="sm:col-span-2"
          />
          <SelectField
            id="country"
            label="País"
            autoComplete="country-name"
            options={SHIPPING_COUNTRY_NAMES}
            registration={{ ...countryRegistration, onChange: handleCountryChange }}
            error={errors.shippingAddress?.country?.message}
          />
          {isDomestic ? (
            <SelectField
              id="shippingOptionId"
              label="Ciudad / zona de envío"
              options={ZONE_OPTIONS}
              placeholder="Elegí una zona"
              registration={{ ...zoneRegistration, onChange: handleZoneChange }}
              error={errors.shippingAddress?.shippingOptionId?.message}
              describedBy={zoneHint ? ZONE_HINT_ID : undefined}
            />
          ) : (
            <div className="sm:col-span-2 pb-3">
              <InternationalShippingNotice country={country} />
            </div>
          )}
          {zoneHint ? (
            <p id={ZONE_HINT_ID} className="-mt-1 mb-3 text-xs leading-5 text-neutral-500 sm:col-span-2">
              {zoneHint}
            </p>
          ) : null}
          <TextField
            id="city"
            label="Ciudad"
            autoComplete="address-level2"
            readOnly={cityIsFixed}
            registration={register("shippingAddress.city")}
            error={cityError}
          />
          <TextField
            id="department"
            label="Departamento / estado / provincia"
            autoComplete="address-level1"
            registration={register("shippingAddress.department")}
            error={errors.shippingAddress?.department?.message}
          />
          <TextField
            id="postalCode"
            label="Código postal"
            autoComplete="postal-code"
            optional
            registration={register("shippingAddress.postalCode")}
            error={errors.shippingAddress?.postalCode?.message}
          />
          <TextField
            id="notes"
            label="Notas de entrega"
            optional
            multiline
            registration={register("shippingAddress.notes")}
            error={errors.shippingAddress?.notes?.message}
            className="sm:col-span-2"
          />
        </div>
      </fieldset>

      <StepActions summary={summary} onBack={onBack} primaryLabel="Continuar" primaryType="submit" />
    </form>
  )
}
