"use client"

import Link from "next/link"

/**
 * Error boundary of the admin area. The layout redirects visitors who are not admins on full
 * page loads; pages also re-check the role on every render, and when that check fails during
 * a client-side navigation (session expired, role revoked) the error lands here.
 */
export default function AdminError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <h2 className="text-xl font-semibold text-gray-900">No pudimos mostrar esta página</h2>
      <p className="mt-2 text-gray-600">
        Es posible que tu sesión haya vencido o que ya no tengas acceso de administrador.
      </p>
      <div className="mt-6 flex items-center justify-center gap-4 text-sm">
        <button type="button" onClick={reset} className="underline underline-offset-4">
          Reintentar
        </button>
        <Link href="/sign-in?callbackUrl=%2Fadmin" className="underline underline-offset-4">
          Iniciar sesión
        </Link>
        <Link href="/" className="underline underline-offset-4">
          Volver a la tienda
        </Link>
      </div>
    </div>
  )
}
