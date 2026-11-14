import { z } from "zod"
import { emailSchema } from "./email"
import {
  checkPasswordPolicy,
  PASSWORD_MAX_LENGTH,
  PASSWORD_POLICY_MESSAGES,
} from "./password-policy"

export const NAME_MAX_LENGTH = 80

const nameSchema = z
  .string({ invalid_type_error: "Nombre inválido" })
  .trim()
  .max(NAME_MAX_LENGTH, `Máximo ${NAME_MAX_LENGTH} caracteres`)
  .optional()
  .transform((value) => (value ? value : undefined))

/**
 * Server-side registration payload. Unknown keys (notably `role`) are stripped by zod, so a
 * client can never smuggle a privileged field into the user that gets created.
 */
export const registerInputSchema = z
  .object({
    name: nameSchema,
    email: emailSchema,
    password: z.string({ required_error: "Ingresá una contraseña", invalid_type_error: "Contraseña inválida" }),
  })
  .superRefine((value, ctx) => {
    const policy = checkPasswordPolicy(value.password, { email: value.email })
    if (!policy.ok) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["password"],
        message: PASSWORD_POLICY_MESSAGES[policy.reason],
      })
    }
  })

export type RegisterInput = z.infer<typeof registerInputSchema>

/**
 * Login payload. Deliberately NOT subject to the registration policy: it only bounds the
 * input so a huge password cannot be used to burn CPU, and it never explains password rules.
 */
export const loginInputSchema = z.object({
  email: emailSchema,
  password: z
    .string({ required_error: "Ingresá tu contraseña", invalid_type_error: "Contraseña inválida" })
    .min(1, "Ingresá tu contraseña")
    .max(PASSWORD_MAX_LENGTH, "Contraseña inválida"),
})

export type LoginInput = z.infer<typeof loginInputSchema>
