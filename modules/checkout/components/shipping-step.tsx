import type { FormEvent, ReactNode } from "react"
import type { UseFormReturn } from "react-hook-form"
import { SHIPPING_COUNTRY_NAMES } from "@/modules/orders"
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

/** Step 2: contact and shipping address. Values live in the parent form, so going back never loses them. */
export function ShippingStep({ form, message, onBack, onContinue, summary }: ShippingStepProps) {
  const {
    register,
    formState: { errors },
  } = form

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onContinue()
  }

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
          <TextField
            id="city"
            label="Ciudad"
            autoComplete="address-level2"
            registration={register("shippingAddress.city")}
            error={errors.shippingAddress?.city?.message}
          />
          <TextField
            id="department"
            label="Departamento / estado / provincia"
            autoComplete="address-level1"
            registration={register("shippingAddress.department")}
            error={errors.shippingAddress?.department?.message}
          />
          <SelectField
            id="country"
            label="País"
            autoComplete="country-name"
            options={SHIPPING_COUNTRY_NAMES}
            registration={register("shippingAddress.country")}
            error={errors.shippingAddress?.country?.message}
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
