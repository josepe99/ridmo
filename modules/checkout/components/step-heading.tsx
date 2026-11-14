import { CHECKOUT_STEPS, stepIndex, type CheckoutStep } from "../domain/checkout-steps"

export const EYEBROW = "text-[10px] font-semibold uppercase tracking-eyebrow text-neutral-500"

type StepHeadingProps = {
  step: CheckoutStep
  title: string
}

/**
 * Heading of a checkout step. It is the focus target when the step changes:
 * the flow moves focus to the element carrying `data-step-heading`.
 */
export function StepHeading({ step, title }: StepHeadingProps) {
  return (
    <header className="mb-8 border-b border-neutral-200 pb-4 md:mb-10">
      <p className={EYEBROW}>
        Paso {stepIndex(step) + 1} de {CHECKOUT_STEPS.length}
      </p>
      <h2
        tabIndex={-1}
        data-step-heading=""
        className="mt-2 font-serif text-2xl tracking-display text-neutral-900 outline-none md:text-3xl"
      >
        {title}
      </h2>
    </header>
  )
}
