/**
 * Pure state machine of the three-step checkout.
 *
 *   items -> shipping -> payment
 *
 * Guards:
 *  - `shipping` needs a non-empty cart;
 *  - `payment` needs a non-empty cart AND shipping data that passes the shared zod schema.
 *
 * Going back is always allowed to earlier steps; data lives in the caller's state, never here.
 */
export const CHECKOUT_STEPS = ["items", "shipping", "payment"] as const

export type CheckoutStep = (typeof CHECKOUT_STEPS)[number]

/** Facts the guards need; computed by the caller from the cart and the form. */
export type StepGuardContext = {
  itemCount: number
  /** `true` when contact + address pass `checkoutFormSchema`. */
  shippingValid: boolean
}

export function stepIndex(step: CheckoutStep): number {
  return CHECKOUT_STEPS.indexOf(step)
}

export function canEnterStep(target: CheckoutStep, ctx: StepGuardContext): boolean {
  switch (target) {
    case "items":
      return true
    case "shipping":
      return ctx.itemCount > 0
    case "payment":
      return ctx.itemCount > 0 && ctx.shippingValid
  }
}

/** The following step when its guards pass, otherwise the current one. */
export function nextStep(current: CheckoutStep, ctx: StepGuardContext): CheckoutStep {
  const candidate = CHECKOUT_STEPS[stepIndex(current) + 1]
  return candidate && canEnterStep(candidate, ctx) ? candidate : current
}

export function previousStep(current: CheckoutStep): CheckoutStep {
  return CHECKOUT_STEPS[Math.max(0, stepIndex(current) - 1)]
}

/** Only already-completed (earlier) steps can be jumped to; never the current or a future one. */
export function canNavigateTo(target: CheckoutStep, current: CheckoutStep, ctx: StepGuardContext): boolean {
  return stepIndex(target) < stepIndex(current) && canEnterStep(target, ctx)
}

/** Clamps a requested step to the furthest one whose guards pass (e.g. empty cart -> items). */
export function resolveStep(requested: CheckoutStep, ctx: StepGuardContext): CheckoutStep {
  for (let index = stepIndex(requested); index > 0; index--) {
    const step = CHECKOUT_STEPS[index]
    if (canEnterStep(step, ctx)) return step
  }
  return "items"
}

const SHIPPING_FIELD_PATHS: ReadonlySet<string> = new Set([
  "customer.fullName",
  "customer.phone",
  "customer.email",
  "shippingAddress.street",
  "shippingAddress.reference",
  "shippingAddress.city",
  "shippingAddress.department",
  "shippingAddress.country",
  "shippingAddress.postalCode",
  "shippingAddress.notes",
])

/** Whether a dotted `createOrder` field path belongs to the shipping step form. */
export function isShippingFieldPath(path: string): boolean {
  return SHIPPING_FIELD_PATHS.has(path)
}

/** Structural view of a failed `createOrder` result (kept independent from the server action types). */
export type ServerFailureInfo = {
  code: string
  fieldErrors?: Record<string, string>
}

const CART_FAILURE_CODES: ReadonlySet<string> = new Set([
  "EMPTY_CART",
  "INVALID_QUANTITY",
  "ITEM_UNAVAILABLE",
  "INSUFFICIENT_STOCK",
])

/** The step the shopper must return to so the failure can be fixed where it originated. */
export function stepForServerFailure(failure: ServerFailureInfo): CheckoutStep {
  if (CART_FAILURE_CODES.has(failure.code)) return "items"

  if (failure.code === "VALIDATION") {
    const paths = Object.keys(failure.fieldErrors ?? {})
    if (paths.some((path) => !isShippingFieldPath(path))) return "items"
    if (paths.length > 0) return "shipping"
  }

  return "payment"
}
