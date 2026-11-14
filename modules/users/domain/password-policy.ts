import { normalizeEmail } from "./email"

export const PASSWORD_MIN_LENGTH = 10
export const PASSWORD_MAX_LENGTH = 128

/**
 * Small built-in blocklist of passwords that satisfy the length rule but are among the most
 * guessed ones. Compared lowercase. It is a floor, not a breach-corpus check.
 */
export const COMMON_PASSWORDS: ReadonlySet<string> = new Set([
  "password12",
  "password123",
  "password1234",
  "password123!",
  "passw0rd123",
  "passw0rd!!!",
  "1234567890",
  "12345678910",
  "123456789012",
  "0123456789",
  "1234512345",
  "1111111111",
  "0000000000",
  "qwertyuiop",
  "qwerty1234",
  "qwerty12345",
  "qwertyuiop1",
  "asdfghjkl1",
  "asdfghjkl123",
  "zxcvbnm123",
  "1q2w3e4r5t",
  "1qaz2wsx3edc",
  "iloveyou12",
  "iloveyou123",
  "iloveyou1234",
  "letmein123",
  "welcome123",
  "welcome1234",
  "administrator",
  "admin12345",
  "admin123456",
  "changeme123",
  "abcd123456",
  "abc1234567",
  "contraseña123",
  "contrasena123",
  "contraseña1234",
  "mypassword1",
  "monkey1234",
  "dragon12345",
  "football123",
  "baseball123",
  "superman123",
  "trustno1234",
  "sunshine123",
  "princess123",
  "football1234",
  "mercadolibre",
  "paraguay123",
  "argentina123",
  "asuncion123",
])

export type PasswordPolicyResult =
  | { ok: true }
  | { ok: false; reason: "too_short" | "too_long" | "equals_email" | "too_common" }

/**
 * Registration password rules. The password is never trimmed or normalised (spaces and
 * Unicode are legitimate); only the comparison against the email and the blocklist is
 * case-insensitive.
 */
export function checkPasswordPolicy(password: string, context: { email?: string } = {}): PasswordPolicyResult {
  if (password.length < PASSWORD_MIN_LENGTH) return { ok: false, reason: "too_short" }
  if (password.length > PASSWORD_MAX_LENGTH) return { ok: false, reason: "too_long" }

  const lowered = password.trim().toLowerCase()
  if (context.email && lowered === normalizeEmail(context.email)) {
    return { ok: false, reason: "equals_email" }
  }
  if (COMMON_PASSWORDS.has(lowered) || new Set(password).size === 1) {
    return { ok: false, reason: "too_common" }
  }
  return { ok: true }
}

export const PASSWORD_POLICY_MESSAGES: Record<Exclude<PasswordPolicyResult, { ok: true }>["reason"], string> = {
  too_short: `La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres`,
  too_long: `La contraseña no puede superar los ${PASSWORD_MAX_LENGTH} caracteres`,
  equals_email: "La contraseña no puede ser igual a tu email",
  too_common: "Esta contraseña es demasiado común. Elegí otra",
}
