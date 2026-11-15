import type { FormEvent, ReactNode } from "react"
import { InternationalShippingNotice } from "@/modules/orders"
import { formatGuaranies } from "@/shared/lib/currency"
import { resolveShippingDisplay } from "../domain/shipping-display"
import type { CheckoutFormValues } from "../schemas/checkout.schema"
import type { BankTransferDetails } from "../services/bank-details"
import { BankTransferDetailsList } from "./bank-transfer-details"
import { StepActions } from "./step-actions"
import { EYEBROW, StepHeading } from "./step-heading"

type PaymentStepProps = {
  values: CheckoutFormValues
  bank: BankTransferDetails
  isPending: boolean
  /** Step-level error from the last attempt (e.g. an unexpected server failure). */
  message?: string | null
  onBack: () => void
  /** Sends the shopper back to the shipping step to fix contact or address data. */
  onEdit: () => void
  onConfirm: () => void
  /** Compact order summary shown above the confirm button on small screens. */
  summary?: ReactNode
}

function RecapRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1 py-3 sm:flex-row sm:justify-between sm:gap-8">
      <dt className={EYEBROW}>{label}</dt>
      <dd className="text-sm leading-6 text-neutral-900 sm:text-right">{children}</dd>
    </div>
  )
}

/** Step 3: payment method (bank transfer), read-only recap, transfer details and the final confirmation. */
export function PaymentStep({ values, bank, isPending, message, onBack, onEdit, onConfirm, summary }: PaymentStepProps) {
  const { customer, shippingAddress } = values
  const shipping = resolveShippingDisplay(shippingAddress.country, shippingAddress.shippingOptionId)

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onConfirm()
  }

  return (
    <form onSubmit={handleSubmit} aria-label="Datos de pago" aria-busy={isPending}>
      <StepHeading step="payment" title="Datos de pago" />

      <fieldset>
        <legend className="sr-only">Método de pago</legend>
        <label className="flex cursor-pointer items-start gap-4 border border-black p-5">
          <input type="radio" name="paymentMethod" value="TRANSFER" checked readOnly className="mt-1 h-4 w-4 accent-black" />
          <span>
            <span className="block text-sm font-medium text-neutral-900">Transferencia bancaria</span>
            <span className="mt-1 block text-sm leading-6 text-neutral-500">
              Es el único método de pago disponible por ahora.
            </span>
          </span>
        </label>
      </fieldset>

      <section aria-labelledby="transfer-details-heading" className="mt-10">
        <h3 id="transfer-details-heading" className={EYEBROW}>
          Datos para la transferencia
        </h3>
        <BankTransferDetailsList bank={bank} />
        <p className="mt-4 text-sm leading-6 text-neutral-700">
          Tu pedido queda pendiente hasta que recibamos la transferencia. Al confirmar te mostraremos el número de
          pedido para usar como concepto.
        </p>
      </section>

      <section aria-labelledby="recap-heading" className="mt-10 border-t border-neutral-200 pt-8">
        <div className="flex items-baseline justify-between">
          <h3 id="recap-heading" className={EYEBROW}>
            Tus datos
          </h3>
          <button
            type="button"
            onClick={onEdit}
            aria-label="Editar datos de envío"
            className="text-xs uppercase tracking-label text-neutral-500 underline underline-offset-4 transition-colors duration-200 hover:text-black focus-visible:text-black"
          >
            Editar
          </button>
        </div>
        <dl className="mt-4 divide-y divide-neutral-200">
          <RecapRow label="Nombre">{customer.fullName}</RecapRow>
          <RecapRow label="Teléfono">{customer.phone}</RecapRow>
          {customer.email ? <RecapRow label="Email">{customer.email}</RecapRow> : null}
          <RecapRow label="Dirección">
            {shippingAddress.street}, {shippingAddress.reference}
            <br />
            {shippingAddress.city}, {shippingAddress.department}
            <br />
            {shippingAddress.country}
          </RecapRow>
          {shipping.state === "priced" ? (
            <RecapRow label="Envío">
              {shipping.label} · {formatGuaranies(shipping.cost)}
            </RecapRow>
          ) : null}
          {shippingAddress.postalCode ? (
            <RecapRow label="Código postal">{shippingAddress.postalCode}</RecapRow>
          ) : null}
          {shippingAddress.notes ? <RecapRow label="Notas">{shippingAddress.notes}</RecapRow> : null}
        </dl>
        <div className="mt-4">
          <InternationalShippingNotice country={shippingAddress.country} />
        </div>
      </section>

      <p
        role="alert"
        aria-live="assertive"
        className={message ? "mt-8 border-l-2 border-black pl-3 text-sm font-medium text-neutral-900" : "sr-only"}
      >
        {message}
      </p>

      <StepActions
        summary={summary}
        onBack={onBack}
        primaryLabel={isPending ? "Procesando..." : "Confirmar pedido"}
        primaryType="submit"
        primaryDisabled={isPending}
      />
    </form>
  )
}
