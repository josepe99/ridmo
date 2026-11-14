import type { ReactNode } from "react"
import { cn } from "@/shared/lib/utils"

type StepActionsProps = {
  /** Compact order summary rendered above the buttons (small screens only, hidden on desktop). */
  summary?: ReactNode
  /** When set, a secondary "Volver" button is shown. */
  onBack?: () => void
  primaryLabel: string
  /** `submit` when the step is a form (Enter key works), `button` otherwise. */
  primaryType?: "button" | "submit"
  onPrimary?: () => void
  primaryDisabled?: boolean
}

/** "Volver" / primary action row shared by the three steps. */
export function StepActions({
  summary,
  onBack,
  primaryLabel,
  primaryType = "button",
  onPrimary,
  primaryDisabled,
}: StepActionsProps) {
  return (
    <div className="mt-10 space-y-6">
      {summary ? <div className="lg:hidden">{summary}</div> : null}
      <div className={cn("flex flex-col-reverse gap-4 sm:flex-row sm:items-center", onBack ? "sm:justify-between" : "sm:justify-end")}>
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="py-3 text-xs uppercase tracking-label text-neutral-500 underline-offset-4 transition-colors duration-200 hover:text-black hover:underline focus-visible:text-black focus-visible:underline"
          >
            Volver
          </button>
        ) : null}
        <button
          type={primaryType}
          onClick={onPrimary}
          disabled={primaryDisabled}
          className={cn(
            "w-full border border-black bg-black px-6 py-4 text-xs font-semibold uppercase tracking-label text-white sm:w-auto sm:min-w-56",
            "transition-colors duration-200 hover:bg-white hover:text-black",
            "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-black disabled:hover:text-white"
          )}
        >
          {primaryLabel}
        </button>
      </div>
    </div>
  )
}
