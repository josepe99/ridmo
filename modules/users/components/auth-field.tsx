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

type AuthFieldProps = {
  id: string
  label: string
  registration: UseFormRegisterReturn
  type?: HTMLInputTypeAttribute
  autoComplete?: string
  error?: string
  hint?: string
  optional?: boolean
}

/** Underlined, label-on-top field shared by the sign-in and sign-up forms. */
export function AuthField({ id, label, registration, type = "text", autoComplete, error, hint, optional }: AuthFieldProps) {
  const errorId = `${id}-error`
  const hintId = `${id}-hint`
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(" ") || undefined

  return (
    <div className="pb-3">
      <label
        htmlFor={id}
        className="flex items-baseline justify-between text-[10px] font-semibold uppercase tracking-eyebrow text-neutral-500"
      >
        <span>{label}</span>
        {optional ? <span className="font-normal normal-case tracking-normal text-neutral-400">Opcional</span> : null}
      </label>
      <input
        id={id}
        type={type}
        autoComplete={autoComplete}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={CONTROL_CLASSES}
        {...registration}
      />
      {hint ? (
        <p id={hintId} className="mt-2 text-xs text-neutral-500">
          {hint}
        </p>
      ) : null}
      <p id={errorId} role={error ? "alert" : undefined} className="mt-2 min-h-4 text-xs font-medium text-neutral-900">
        {error}
      </p>
    </div>
  )
}

export const PRIMARY_BUTTON_CLASSES = cn(
  "w-full border border-black bg-black px-6 py-4 text-xs font-semibold uppercase tracking-label text-white",
  "transition-colors duration-200 hover:bg-white hover:text-black",
  "disabled:cursor-not-allowed disabled:opacity-50"
)

export const LINK_CLASSES =
  "underline underline-offset-4 decoration-neutral-300 transition-colors duration-200 hover:decoration-black"
