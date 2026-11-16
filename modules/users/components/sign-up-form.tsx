"use client"

import { useState } from "react"
import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { registerAction } from "../actions/register.action"
import { PASSWORD_MIN_LENGTH } from "../domain/password-policy"
import { registerInputSchema, type RegisterInput } from "../domain/schemas"
import { AuthField, LINK_CLASSES, PRIMARY_BUTTON_CLASSES } from "./auth-field"
import { GoogleButton } from "./google-button"

type SignUpFormProps = {
  callbackUrl: string
  googleEnabled: boolean
  navigate?: (url: string) => void
}

const hardNavigate = (url: string) => window.location.assign(url)

const FIELDS = ["name", "email", "password"] as const

export function SignUpForm({ callbackUrl, googleEnabled, navigate = hardNavigate }: SignUpFormProps) {
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerInputSchema),
    defaultValues: { name: "", email: "", password: "" },
  })

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null)
    try {
      // Only these three fields are ever sent: there is no way to ask for a role from the form.
      const result = await registerAction(
        { name: values.name, email: values.email, password: values.password },
        callbackUrl
      )
      if (result.ok) {
        navigate(result.redirectTo)
        return
      }
      if (result.code === "VALIDATION") {
        for (const field of FIELDS) {
          const message = result.fieldErrors[field]
          if (message) setError(field, { message })
        }
        return
      }
      setServerError(result.message)
    } catch {
      setServerError("No pudimos crear la cuenta. Intentá de nuevo en unos minutos.")
    }
  })

  const signInHref = callbackUrl === "/" ? "/sign-in" : `/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}`

  return (
    <div>
      {googleEnabled ? (
        <div className="mb-8">
          <GoogleButton callbackUrl={callbackUrl} />
          <p className="mt-8 text-center text-[10px] font-semibold uppercase tracking-eyebrow text-neutral-400">o</p>
        </div>
      ) : null}

      <form onSubmit={onSubmit} noValidate aria-label="Crear cuenta">
        <AuthField
          id="sign-up-name"
          label="Nombre"
          autoComplete="name"
          optional
          registration={register("name")}
          error={errors.name?.message}
        />
        <AuthField
          id="sign-up-email"
          label="Correo electrónico"
          type="email"
          autoComplete="email"
          registration={register("email")}
          error={errors.email?.message}
        />
        <AuthField
          id="sign-up-password"
          label="Contraseña"
          type="password"
          autoComplete="new-password"
          hint={`Al menos ${PASSWORD_MIN_LENGTH} caracteres. Una frase larga es mejor que una palabra complicada.`}
          registration={register("password")}
          error={errors.password?.message}
        />

        {serverError ? (
          <p role="alert" aria-live="assertive" className="mt-2 border-l-2 border-black pl-3 text-sm text-neutral-900">
            {serverError}
          </p>
        ) : null}

        <button type="submit" disabled={isSubmitting} className={`${PRIMARY_BUTTON_CLASSES} mt-8`}>
          {isSubmitting ? "Creando cuenta..." : "Crear cuenta"}
        </button>
      </form>

      <p className="mt-10 text-center text-sm text-neutral-600">
        ¿Ya tenés cuenta?{" "}
        <Link href={signInHref} className={LINK_CLASSES}>
          Iniciar sesión
        </Link>
      </p>
    </div>
  )
}
