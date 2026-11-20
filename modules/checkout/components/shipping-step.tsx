import type { FormEvent, ReactNode } from "react"
import dynamic from "next/dynamic"
import type { ChangeHandler, UseFormReturn } from "react-hook-form"
import {
  InternationalShippingNotice,
  SHIPPING_COUNTRY_NAMES,
  SHIPPING_OPTIONS,
  getShippingOption,
  isDomesticShipment,
} from "@/modules/orders"
import { formatGuaranies } from "@/shared/lib/currency"
import type { CheckoutFormValues, LocationMode } from "../schemas/checkout.schema"
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
const LOCATION_HELP_ID = "location-help"
const LOCATION_ERROR_ID = "location-error"
const LOCATION_MODE_LABEL_ID = "location-mode-label"

const LOCATION_MODE_OPTIONS: ReadonlyArray<{ value: LocationMode; label: string }> = [
  { value: "address", label: "Escribir dirección" },
  { value: "map", label: "Marcar en el mapa" },
]

/** Written-address inputs that stay out of the form while the shopper marks the location on a map. */
const ADDRESS_ONLY_FIELDS = [
  "shippingAddress.street",
  "shippingAddress.reference",
  "shippingAddress.department",
  "shippingAddress.postalCode",
] as const

// Leaflet touches `window`, so the map is loaded in the browser only, and only once the shopper needs it.
const LocationPicker = dynamic(() => import("./location-picker").then((module) => module.LocationPicker), {
  ssr: false,
  loading: () => (
    <div
      role="status"
      className="flex h-72 w-full items-center justify-center border border-neutral-300 text-xs uppercase tracking-label text-neutral-500 sm:h-96"
    >
      Cargando mapa...
    </div>
  ),
})

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

  const isMapMode = form.watch("shippingAddress.locationMode") === "map"
  const location = form.watch("shippingAddress.location") ?? null
  const locationError = errors.shippingAddress?.location?.message
  // The map takes the street's place, so a typed city is only needed where the zone does not fix one.
  const showCityInput = !isMapMode || !isDomestic || zone?.kind === "interior"

  const zoneRegistration = register("shippingAddress.shippingOptionId")
  const countryRegistration = register("shippingAddress.country")
  const modeRegistration = register("shippingAddress.locationMode")

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

  const handleModeChange: ChangeHandler = async (event) => {
    await modeRegistration.onChange(event)
    // Errors of the fields that just left the form must not linger (and are not rechecked while hidden).
    if (event.target.value === "map") clearErrors(ADDRESS_ONLY_FIELDS)
    else clearErrors("shippingAddress.location")
  }

  const handleLocationChange = (next: { lat: number; lng: number } | null) => {
    setValue("shippingAddress.location", next, { shouldDirty: true })
    clearErrors("shippingAddress.location")
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
            registration={register("customer.email")}
            error={errors.customer?.email?.message}
          />
        </div>
      </fieldset>

      <fieldset>
        <legend className={`${EYEBROW} mb-4`}>Dirección de envío</legend>

        <p id={LOCATION_MODE_LABEL_ID} className="mb-3 text-sm text-neutral-700">
          ¿Cómo querés indicar la ubicación de entrega?
        </p>
        <div role="radiogroup" aria-labelledby={LOCATION_MODE_LABEL_ID} className="mb-8 grid gap-3 sm:grid-cols-2">
          {LOCATION_MODE_OPTIONS.map((option) => (
            <label
              key={option.value}
              className="flex cursor-pointer items-center gap-3 border border-neutral-300 p-4 transition-colors duration-200 hover:border-neutral-500 has-[:checked]:border-black has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-black has-[:focus-visible]:ring-offset-2"
            >
              <input
                type="radio"
                value={option.value}
                className="h-4 w-4 accent-black"
                {...modeRegistration}
                onChange={handleModeChange}
              />
              <span className="text-sm font-medium text-neutral-900">{option.label}</span>
            </label>
          ))}
        </div>

        <div className="grid gap-x-8 sm:grid-cols-2">
          {isMapMode ? null : (
            <>
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
                optional
                registration={register("shippingAddress.reference")}
                error={errors.shippingAddress?.reference?.message}
                className="sm:col-span-2"
              />
            </>
          )}
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
          {showCityInput ? (
            <TextField
              id="city"
              label="Ciudad"
              autoComplete="address-level2"
              readOnly={cityIsFixed}
              registration={register("shippingAddress.city")}
              error={cityError}
            />
          ) : null}
          {isMapMode ? null : (
            <>
              <TextField
                id="department"
                label="Departamento / estado / provincia"
                autoComplete="address-level1"
                optional
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
            </>
          )}
          {isMapMode ? (
            <div className="pb-3 sm:col-span-2">
              <p className="text-[10px] font-semibold uppercase tracking-eyebrow text-neutral-500">
                Ubicación en el mapa
              </p>
              <p id={LOCATION_HELP_ID} className="mb-3 mt-2 text-xs leading-5 text-neutral-500">
                Tocá el mapa para marcar dónde entregamos y arrastrá el pin para ajustarlo. Si preferís no usar el
                mapa, elegí «Escribir dirección».
              </p>
              <LocationPicker
                value={location}
                onChange={handleLocationChange}
                describedBy={[LOCATION_HELP_ID, locationError ? LOCATION_ERROR_ID : null].filter(Boolean).join(" ")}
              />
              <div className="mt-3 flex min-h-5 items-center justify-between gap-4 text-xs text-neutral-700">
                <p aria-live="polite">
                  {location
                    ? `Ubicación marcada: ${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`
                    : "Todavía no marcaste ninguna ubicación."}
                </p>
                {location ? (
                  <button
                    type="button"
                    onClick={() => handleLocationChange(null)}
                    className="uppercase tracking-label text-neutral-500 underline underline-offset-4 transition-colors duration-200 hover:text-black focus-visible:text-black"
                  >
                    Quitar ubicación
                  </button>
                ) : null}
              </div>
              <p
                id={LOCATION_ERROR_ID}
                role={locationError ? "alert" : undefined}
                className="mt-2 min-h-4 text-xs font-medium text-neutral-900"
              >
                {locationError}
              </p>
            </div>
          ) : null}
          <TextField
            id="notes"
            label="Notas de entrega"
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
