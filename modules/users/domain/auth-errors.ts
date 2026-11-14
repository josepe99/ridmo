export const GENERIC_SIGN_IN_ERROR = "Correo o contraseña incorrectos."

const MESSAGES: Record<string, string> = {
  // The email of the Google account already belongs to an account created with email and
  // password. Linking is deliberately not automatic (it would allow account takeover).
  OAuthAccountNotLinked:
    "Ya existe una cuenta con ese correo. Por seguridad no la vinculamos automáticamente: ingresá con tu correo y contraseña.",
  GoogleEmailNotVerified: "No pudimos verificar tu correo en Google. Verificalo en tu cuenta de Google e intentá de nuevo.",
  AccessDenied: "No tenés acceso con esta cuenta.",
  too_many_attempts: "Demasiados intentos. Esperá unos minutos antes de volver a intentar.",
  Configuration: "El inicio de sesión no está disponible por el momento. Intentá más tarde.",
}

/**
 * Spanish message for an Auth.js `error` / `code` value. Unknown codes get the generic
 * credentials message, and the raw code is never echoed back to the page.
 */
export function authErrorMessage(code: string | null | undefined): string {
  if (code && Object.prototype.hasOwnProperty.call(MESSAGES, code)) return MESSAGES[code]
  return GENERIC_SIGN_IN_ERROR
}
