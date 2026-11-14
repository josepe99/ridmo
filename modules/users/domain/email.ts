import { z } from "zod"

/**
 * Canonical form of an email address: Unicode NFKC (so full-width look-alikes collapse to
 * ASCII), trimmed and lowercased. Every lookup, uniqueness check and rate-limit key uses it.
 */
export function normalizeEmail(input: string): string {
  return input.normalize("NFKC").trim().toLowerCase()
}

/** RFC 5321 caps an address at 254 characters. */
export const EMAIL_MAX_LENGTH = 254

export const emailSchema = z
  .string({ required_error: "Ingresá tu correo electrónico", invalid_type_error: "Correo electrónico inválido" })
  .transform(normalizeEmail)
  .pipe(
    z
      .string()
      .min(1, "Ingresá tu correo electrónico")
      .max(EMAIL_MAX_LENGTH, "El correo electrónico es demasiado largo")
      .email("Ingresá un correo electrónico válido")
  )
