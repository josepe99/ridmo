"use client"

import type { HTMLInputTypeAttribute } from "react"
import type { UseFormRegisterReturn } from "react-hook-form"
import { cn } from "@/shared/lib/utils"

const CONTROL_CLASSES = cn(
  "block w-full rounded-none border-0 border-b border-neutral-300 bg-transparent px-0 py-3 text-base text-neutral-900",
  "placeholder:text-neutral-400 outline-none transition-colors duration-200 ease-out",
  "hover:border-neutral-500 focus:border-black focus-visible:ring-0",
  "aria-[invalid=true]:border-b-2 aria-[invalid=true]:border-black"
)

type TextFieldProps = {
  id: string
  label: string
  registration: UseFormRegisterReturn
  error?: string
  optional?: boolean
  type?: HTMLInputTypeAttribute
  autoComplete?: string
  inputMode?: "text" | "tel" | "email" | "numeric"
  placeholder?: string
  multiline?: boolean
  /** Shows a value the shopper cannot edit (e.g. a city fixed by the chosen shipping zone). */
  readOnly?: boolean
  className?: string
}

/** Underlined, label-on-top field used by the checkout form. Wired to react-hook-form. */
export function TextField({
  id,
  label,
  registration,
  error,
  optional,
  type = "text",
  autoComplete,
  inputMode,
  placeholder,
  multiline,
  readOnly,
  className,
}: TextFieldProps) {
  const errorId = `${id}-error`
  const sharedProps = {
    id,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? errorId : undefined,
    autoComplete,
    placeholder,
    readOnly,
    className: cn(CONTROL_CLASSES, readOnly && "cursor-default text-neutral-500 hover:border-neutral-300"),
    ...registration,
  }

  return (
    <div className={cn("pb-3", className)}>
      <label
        htmlFor={id}
        className="flex items-baseline justify-between text-[10px] font-semibold uppercase tracking-eyebrow text-neutral-500"
      >
        <span>{label}</span>
        {optional ? <span className="font-normal normal-case tracking-normal text-neutral-400">Opcional</span> : null}
      </label>
      {multiline ? (
        <textarea rows={2} {...sharedProps} />
      ) : (
        <input type={type} inputMode={inputMode} {...sharedProps} />
      )}
      <p id={errorId} role={error ? "alert" : undefined} className="mt-2 min-h-4 text-xs font-medium text-neutral-900">
        {error}
      </p>
    </div>
  )
}
