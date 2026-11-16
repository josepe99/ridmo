"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, type FieldPath } from "react-hook-form"
import { useCart } from "@/modules/cart"
import type { CheckoutDefaults } from "@/modules/orders"
import { createOrder } from "../actions/create-order.action"
import {
  canNavigateTo,
  isShippingFieldPath,
  nextStep,
  previousStep,
  resolveStep,
  stepForServerFailure,
  type CheckoutStep,
  type StepGuardContext,
} from "../domain/checkout-steps"
import { buildFormDefaults } from "../domain/form-defaults"
import { resolveShippingDisplay } from "../domain/shipping-display"
import { checkoutFormSchema, type CheckoutFormValues } from "../schemas/checkout.schema"
import type { BankTransferDetails } from "../services/bank-details"
import { CartItemsStep } from "./cart-items-step"
import { CheckoutStepper } from "./checkout-stepper"
import { EmptyCart } from "./empty-cart"
import { OrderSummary } from "./order-summary"
import { PaymentStep } from "./payment-step"
import { ShippingStep } from "./shipping-step"
import { EYEBROW } from "./step-heading"

const EMPTY_BANK: BankTransferDetails = { bankName: "", accountHolder: "", accountNumber: "", alias: "", notes: "" }

type CheckoutFlowProps = {
  /** Prefills contact and address for a signed-in customer; guests get an empty form. */
  defaults?: CheckoutDefaults
  /** Bank transfer instructions, read on the server and shown on the payment step. */
  bank?: BankTransferDetails
}

/** A message tied to the step where the shopper can act on it. */
type StepNotice = { step: CheckoutStep; message: string }

/**
 * Orchestrates the three checkout steps (products -> shipping -> payment).
 *
 * The cart lives in `useCart`; contact and address live in a single react-hook-form instance that
 * outlives the step components, so going back never loses what was typed (nothing is persisted).
 * Step rules come from the pure state machine in `../domain/checkout-steps`.
 */
export function CheckoutFlow({ defaults, bank = EMPTY_BANK }: CheckoutFlowProps = {}) {
  const router = useRouter()
  const { items, isLoading, updateQuantity, removeItem, clear, totalPrice, totalQuantity } = useCart()
  const [step, setStep] = useState<CheckoutStep>("items")
  const [notice, setNotice] = useState<StepNotice | null>(null)
  const [lineErrors, setLineErrors] = useState<Record<string, string>>({})
  const [isPending, setIsPending] = useState(false)
  const [isPlaced, setIsPlaced] = useState(false)
  const submittingRef = useRef(false)
  const stepRegionRef = useRef<HTMLDivElement>(null)
  const hasNavigatedRef = useRef(false)

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutFormSchema),
    mode: "onTouched",
    defaultValues: buildFormDefaults(defaults),
  })

  // Display only: the server recomputes the shipping cost from the option id when the order is placed.
  const shipping = resolveShippingDisplay(
    form.watch("shippingAddress.country"),
    form.watch("shippingAddress.shippingOptionId")
  )

  const guards = (): StepGuardContext => ({
    itemCount: items.length,
    shippingValid: checkoutFormSchema.safeParse(form.getValues()).success,
  })

  // An emptied cart (or invalid data) can never keep the shopper on a later step.
  const activeStep = resolveStep(step, guards())

  useEffect(() => {
    if (activeStep !== step) setStep(activeStep)
  }, [activeStep, step])

  // After a step change: focus the new step heading and start at the top of the page.
  useEffect(() => {
    if (!hasNavigatedRef.current) return
    stepRegionRef.current?.querySelector<HTMLElement>("[data-step-heading]")?.focus({ preventScroll: true })
    window.scrollTo({ top: 0 })
  }, [activeStep])

  const goTo = (target: CheckoutStep, message?: string) => {
    hasNavigatedRef.current = true
    setNotice(message ? { step: target, message } : null)
    setStep(target)
  }

  const continueFromItems = () => {
    const target = nextStep("items", guards())
    if (target !== "items") goTo(target)
  }

  const continueFromShipping = async () => {
    // Validates every contact and address field, shows the messages and focuses the first invalid one.
    const isValid = await form.trigger(undefined, { shouldFocus: true })
    if (!isValid) return
    const target = nextStep("shipping", guards())
    if (target !== "shipping") goTo(target)
  }

  const goBack = () => goTo(previousStep(activeStep))

  const selectStep = (target: CheckoutStep) => {
    if (canNavigateTo(target, activeStep, guards())) goTo(target)
  }

  const confirmOrder = async () => {
    if (activeStep !== "payment" || submittingRef.current) return
    submittingRef.current = true
    setIsPending(true)
    setNotice(null)
    setLineErrors({})

    try {
      if (!(await form.trigger())) {
        goTo("shipping", "Revisá los datos ingresados.")
        return
      }

      const { customer, shippingAddress } = form.getValues()
      const result = await createOrder({
        customer,
        shippingAddress,
        // Only ids and quantities travel: the server prices the order from the catalog.
        lines: items.map((item) => ({ itemId: item.id, quantity: item.quantity })),
      })

      if (result.ok) {
        setIsPlaced(true)
        router.push(`/order/${result.orderNumber}?token=${encodeURIComponent(result.accessToken)}`)
        clear()
        return
      }

      let message = result.message
      if (result.code === "VALIDATION") {
        let hasUnmapped = false
        for (const [path, fieldMessage] of Object.entries(result.fieldErrors)) {
          if (isShippingFieldPath(path)) {
            // A bad coordinate is shown on the map field, which owns the whole pin.
            const field = path.startsWith("shippingAddress.location.") ? "shippingAddress.location" : path
            form.setError(field as FieldPath<CheckoutFormValues>, { type: "server", message: fieldMessage })
          } else {
            hasUnmapped = true
          }
        }
        if (hasUnmapped) message = "Revisá los productos de tu carrito."
      } else if (result.code === "INVALID_SHIPPING_OPTION") {
        form.setError("shippingAddress.shippingOptionId", { type: "server", message: result.message })
      } else if (result.itemId) {
        setLineErrors({ [result.itemId]: result.message })
      }

      goTo(stepForServerFailure(result), message)
      submittingRef.current = false
    } catch {
      goTo("payment", "No pudimos registrar tu pedido. Intentá de nuevo en unos minutos.")
      submittingRef.current = false
    } finally {
      setIsPending(false)
    }
  }

  if (isLoading || isPlaced) {
    return (
      <section className="mx-auto max-w-6xl px-4 py-24 text-center md:px-8">
        <p className={EYEBROW} role="status">
          {isPlaced ? "Pedido registrado, redirigiendo..." : "Cargando tu bolsa..."}
        </p>
      </section>
    )
  }

  if (items.length === 0) return <EmptyCart />

  const message = notice?.step === activeStep ? notice.message : null
  const compactSummary = (
    <OrderSummary variant="compact" totalQuantity={totalQuantity} totalPrice={totalPrice} shipping={shipping} />
  )

  return (
    <section className="mx-auto max-w-6xl px-4 py-12 md:px-8 md:py-20">
      <header className="mb-10 md:mb-14">
        <p className={EYEBROW}>Tu bolsa</p>
        <h1 className="mt-3 font-serif text-4xl tracking-display text-neutral-900 md:text-6xl">Finalizar compra</h1>
      </header>

      <div className="mb-12 md:mb-16">
        <CheckoutStepper current={activeStep} onSelect={selectStep} />
      </div>

      <div className="grid gap-16 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-20">
        <div ref={stepRegionRef} key={activeStep} className="animate-step-in">
          {activeStep === "items" ? (
            <CartItemsStep
              items={items}
              subtotal={totalPrice}
              lineErrors={lineErrors}
              message={message}
              onQuantityChange={updateQuantity}
              onRemove={removeItem}
              onClear={clear}
              onContinue={continueFromItems}
              summary={compactSummary}
            />
          ) : null}
          {activeStep === "shipping" ? (
            <ShippingStep
              form={form}
              message={message}
              onBack={goBack}
              onContinue={continueFromShipping}
              summary={compactSummary}
            />
          ) : null}
          {activeStep === "payment" ? (
            <PaymentStep
              values={form.getValues()}
              bank={bank}
              isPending={isPending}
              message={message}
              onBack={goBack}
              onEdit={() => goTo("shipping")}
              onConfirm={confirmOrder}
              summary={compactSummary}
            />
          ) : null}
        </div>

        <aside aria-label="Resumen del pedido" className="hidden lg:sticky lg:top-24 lg:block lg:self-start">
          <OrderSummary totalQuantity={totalQuantity} totalPrice={totalPrice} shipping={shipping} />
        </aside>
      </div>
    </section>
  )
}
