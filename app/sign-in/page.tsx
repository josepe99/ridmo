import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { SignInForm, isGoogleConfigured, sanitizeCallbackUrl } from "@/modules/users"
import { getCurrentUser } from "@/modules/users/server"

export const metadata: Metadata = {
  title: "Iniciar sesión | RIDMO",
  robots: { index: false, follow: false },
}

type SearchParams = Promise<{ callbackUrl?: string | string[]; error?: string | string[] }>

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value)

export default async function SignInPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const callbackUrl = sanitizeCallbackUrl(first(params.callbackUrl))

  // Already signed in: nothing to do here. A failing session lookup just shows the form.
  const user = await getCurrentUser().catch(() => null)
  if (user) redirect(callbackUrl)

  return (
    <div className="mx-auto w-full max-w-md px-4 py-16 md:py-24">
      <p className="text-[10px] font-semibold uppercase tracking-eyebrow text-neutral-500">Tu cuenta</p>
      <h1 className="mt-3 mb-10 font-serif text-4xl tracking-display text-neutral-900 md:text-5xl">
        Iniciar sesión
      </h1>
      <SignInForm
        callbackUrl={callbackUrl}
        googleEnabled={isGoogleConfigured()}
        errorCode={first(params.error)}
      />
    </div>
  )
}
