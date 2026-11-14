"use client"

import { useState } from "react"
import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { signInAction } from "../actions/sign-in.action"
import { authErrorMessage } from "../domain/auth-errors"
import { loginInputSchema, type LoginInput } from "../domain/schemas"
import { AuthField, LINK_CLASSES, PRIMARY_BUTTON_CLASSES } from "./auth-field"
import { GoogleButton } from "./google-button"

type SignInFormProps = {
  /** Already sanitized on the server, and sanitized again by the sign-in action. */
  callbackUrl: string
  googleEnabled: boolean
  /** Auth.js `error` query value to explain (e.g. OAuthAccountNotLinked). */
  errorCode?: string
  /** Hard navigation after login so the whole page picks up the new session. */
  navigate?: (url: string) => void
}

const hardNavigate = (url: string) => window.location.assign(url)

export function SignInForm({ callbackUrl, googleEnabled, errorCode, navigate = hardNavigate }: SignInFormProps) {
  const [serverError, setServerError] = useState<string | null>(errorCode ? authErrorMessage(errorCode) : null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginInputSchema),
    defaultValues: { email: "", password: "" },
  })

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null)
    try {
      const result = await signInAction({ email: values.email, password: values.password }, callbackUrl)
      if (result.ok) {
        navigate(result.redirectTo)
        return
      }
      setServerError(result.message)
    } catch {
      setServerError("No pudimos iniciar sesión. Intentá de nuevo en unos minutos.")
    }
  })

  const signUpHref = callbackUrl === "/" ? "/sign-up" : `/sign-up?callbackUrl=${encodeURIComponent(callbackUrl)}`

  return (
    <div>
      <form onSubmit={onSubmit} noValidate aria-label="Iniciar sesión">
        <AuthField
          id="sign-in-email"
          label="Correo electrónico"
          type="email"
          autoComplete="email"
          registration={register("email")}
          error={errors.email?.message}
        />
        <AuthField
          id="sign-in-password"
          label="Contraseña"
          type="password"
          autoComplete="current-password"
          registration={register("password")}
          error={errors.password?.message}
        />

        {serverError ? (
          <p role="alert" aria-live="assertive" className="mt-2 border-l-2 border-black pl-3 text-sm text-neutral-900">
            {serverError}
          </p>
        ) : null}

        <button type="submit" disabled={isSubmitting} className={`${PRIMARY_BUTTON_CLASSES} mt-8`}>
          {isSubmitting ? "Ingresando..." : "Ingresar"}
        </button>
      </form>

      {googleEnabled ? (
        <div className="mt-6">
          <p className="mb-6 text-center text-[10px] font-semibold uppercase tracking-eyebrow text-neutral-400">o</p>
          <GoogleButton callbackUrl={callbackUrl} />
        </div>
      ) : null}

      <p className="mt-10 text-center text-sm text-neutral-600">
        ¿Todavía no tenés cuenta?{" "}
        <Link href={signUpHref} className={LINK_CLASSES}>
          Crear cuenta
        </Link>
      </p>
    </div>
  )
}
