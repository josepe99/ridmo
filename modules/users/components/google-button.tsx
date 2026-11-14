"use client"

import { googleSignInAction } from "../actions/sign-in.action"

function GoogleMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" focusable="false">
      <path
        fill="currentColor"
        d="M21.35 11.1H12v2.98h5.35c-.23 1.5-1.7 4.4-5.35 4.4a5.9 5.9 0 1 1 0-11.8c1.9 0 3.17.8 3.9 1.5l2.65-2.55A9.5 9.5 0 0 0 12 2.5a9.5 9.5 0 1 0 0 19c5.5 0 9.1-3.85 9.1-9.3 0-.62-.07-1.1-.15-1.6Z"
      />
    </svg>
  )
}

/** Starts the Google flow. Render it only when Google is configured (see isGoogleConfigured). */
export function GoogleButton({ callbackUrl }: { callbackUrl: string }) {
  return (
    <form action={googleSignInAction.bind(null, callbackUrl)}>
      <button
        type="submit"
        className="flex w-full items-center justify-center gap-3 border border-neutral-300 bg-white px-6 py-4 text-xs font-semibold uppercase tracking-label text-neutral-900 transition-colors duration-200 hover:border-black"
      >
        <GoogleMark />
        Continuar con Google
      </button>
    </form>
  )
}
