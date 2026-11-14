import { Check } from "lucide-react"
import { cn } from "@/shared/lib/utils"
import { CHECKOUT_STEPS, stepIndex, type CheckoutStep } from "../domain/checkout-steps"

export const STEP_LABELS: Record<CheckoutStep, string> = {
  items: "Productos",
  shipping: "Datos de envío",
  payment: "Datos de pago",
}

type CheckoutStepperProps = {
  current: CheckoutStep
  /** Called with an already-completed step the shopper wants to go back to. */
  onSelect: (step: CheckoutStep) => void
}

/** Progress indicator. Completed steps are buttons, the current and future ones are plain text. */
export function CheckoutStepper({ current, onSelect }: CheckoutStepperProps) {
  const currentIndex = stepIndex(current)

  return (
    <nav aria-label="Pasos del pedido">
      <ol className="grid grid-cols-3 gap-3 md:gap-8">
        {CHECKOUT_STEPS.map((step, index) => {
          const isComplete = index < currentIndex
          const isCurrent = index === currentIndex

          const content = (
            <>
              <span
                aria-hidden="true"
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center border text-[11px] tabular-nums",
                  isCurrent && "border-black bg-black text-white",
                  isComplete && "border-black text-black",
                  !isCurrent && !isComplete && "border-neutral-300 text-neutral-400"
                )}
              >
                {isComplete ? <Check className="h-3 w-3" /> : index + 1}
              </span>
              <span
                className={cn(
                  "text-[10px] uppercase tracking-eyebrow md:text-xs",
                  isCurrent ? "font-semibold text-black" : isComplete ? "text-neutral-700" : "text-neutral-400"
                )}
              >
                {STEP_LABELS[step]}
              </span>
              {isComplete ? <span className="sr-only">{" (completado, volver a este paso)"}</span> : null}
            </>
          )

          return (
            <li
              key={step}
              aria-current={isCurrent ? "step" : undefined}
              className={cn(
                "border-t-2 pt-3 transition-colors duration-200",
                isCurrent ? "border-black" : isComplete ? "border-neutral-400" : "border-neutral-200"
              )}
            >
              {isComplete ? (
                <button
                  type="button"
                  onClick={() => onSelect(step)}
                  className="flex flex-col items-start gap-2 text-left transition-opacity duration-200 hover:opacity-70 md:flex-row md:items-center md:gap-3"
                >
                  {content}
                </button>
              ) : (
                <div className="flex flex-col items-start gap-2 md:flex-row md:items-center md:gap-3">{content}</div>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
