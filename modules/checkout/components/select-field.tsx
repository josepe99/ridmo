"use client"

import type { UseFormRegisterReturn } from "react-hook-form"
import { cn } from "@/shared/lib/utils"

const CONTROL_CLASSES = cn(
  "block w-full rounded-none border-0 border-b border-neutral-300 bg-transparent px-0 py-3 text-base text-neutral-900",
  "outline-none transition-colors duration-200 ease-out",
  "hover:border-neutral-500 focus:border-black focus-visible:ring-0",
  "aria-[invalid=true]:border-b-2 aria-[invalid=true]:border-black"
)

type SelectFieldProps = {
  id: string
  label: string
  /** Visible text and submitted value of each option, in display order. */
  options: ReadonlyArray<string>
  registration: UseFormRegisterReturn
  error?: string
  autoComplete?: string
  className?: string
}

/** Underlined, label-on-top native select used by the checkout form. Wired to react-hook-form. */
export function SelectField({ id, label, options, registration, error, autoComplete, className }: SelectFieldProps) {
  const errorId = `${id}-error`

  return (
    <div className={cn("pb-3", className)}>
      <label
        htmlFor={id}
        className="flex items-baseline justify-between text-[10px] font-semibold uppercase tracking-eyebrow text-neutral-500"
      >
        <span>{label}</span>
      </label>
      <select
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        autoComplete={autoComplete}
        className={CONTROL_CLASSES}
        {...registration}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <p id={errorId} role={error ? "alert" : undefined} className="mt-2 min-h-4 text-xs font-medium text-neutral-900">
        {error}
      </p>
    </div>
  )
}
