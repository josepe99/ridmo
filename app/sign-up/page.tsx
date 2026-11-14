import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { SignUpForm, isGoogleConfigured, sanitizeCallbackUrl } from "@/modules/users"
import { getCurrentUser } from "@/modules/users/server"

export const metadata: Metadata = {
  title: "Crear cuenta | RIDMO",
  robots: { index: false, follow: false },
}

type SearchParams = Promise<{ callbackUrl?: string | string[] }>

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value)

export default async function SignUpPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const callbackUrl = sanitizeCallbackUrl(first(params.callbackUrl))

  const user = await getCurrentUser().catch(() => null)
  if (user) redirect(callbackUrl)

  return (
    <div className="mx-auto w-full max-w-md px-4 py-16 md:py-24">
      <p className="text-[10px] font-semibold uppercase tracking-eyebrow text-neutral-500">Tu cuenta</p>
      <h1 className="mt-3 mb-10 font-serif text-4xl tracking-display text-neutral-900 md:text-5xl">
        Crear cuenta
      </h1>
      <SignUpForm callbackUrl={callbackUrl} googleEnabled={isGoogleConfigured()} />
    </div>
  )
}
