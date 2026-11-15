"use client"

import type { UseFormRegisterReturn } from "react-hook-form"
import { cn } from "@/shared/lib/utils"

const CONTROL_CLASSES = cn(
  "block w-full rounded-none border-0 border-b border-neutral-300 bg-transparent px-0 py-3 text-base text-neutral-900",
  "outline-none transition-colors duration-200 ease-out",
  "hover:border-neutral-500 focus:border-black focus-visible:ring-0",
  "aria-[invalid=true]:border-b-2 aria-[invalid=true]:border-black"
)

export type SelectOption = string | { value: string; label: string }

type SelectFieldProps = {
  id: string
  label: string
  /** Each option in display order: a string is both text and value, an object separates them. */
  options: ReadonlyArray<SelectOption>
  registration: UseFormRegisterReturn
  /** When set, adds a first option with an empty value that shows this text. */
  placeholder?: string
  error?: string
  /** Extra text announced with the control (e.g. a hint), joined with the error id. */
  describedBy?: string
  autoComplete?: string
  className?: string
}

const toOption = (option: SelectOption) => (typeof option === "string" ? { value: option, label: option } : option)

/** Underlined, label-on-top native select used by the checkout form. Wired to react-hook-form. */
export function SelectField({
  id,
  label,
  options,
  registration,
  placeholder,
  error,
  describedBy,
  autoComplete,
  className,
}: SelectFieldProps) {
  const errorId = `${id}-error`
  const describedByIds = [error ? errorId : null, describedBy].filter(Boolean).join(" ") || undefined

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
        aria-describedby={describedByIds}
        autoComplete={autoComplete}
        className={CONTROL_CLASSES}
        {...registration}
      >
        {placeholder ? <option value="">{placeholder}</option> : null}
        {options.map((option) => {
          const { value, label: text } = toOption(option)
          return (
            <option key={value} value={value}>
              {text}
            </option>
          )
        })}
      </select>
      <p id={errorId} role={error ? "alert" : undefined} className="mt-2 min-h-4 text-xs font-medium text-neutral-900">
        {error}
      </p>
    </div>
  )
}
