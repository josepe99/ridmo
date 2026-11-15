import { z } from "zod"
import { MAX_QUANTITY_PER_ITEM, getShippingOption, isDomesticShipment, isShippingCountry } from "@/modules/orders"

export { MAX_QUANTITY_PER_ITEM }

/** Mongo ObjectId as a 24 char hex string. */
const OBJECT_ID_PATTERN = /^[a-f0-9]{24}$/i
const PHONE_PATTERN = /^\+?[\d\s().-]{6,30}$/
/** Postal / ZIP codes worldwide: letters, digits, spaces and hyphens only (empty allowed). */
const POSTAL_CODE_PATTERN = /^[A-Za-z0-9 -]*$/

const REQUIRED_MESSAGE = "Completá este campo"
export const SHIPPING_OPTION_MESSAGE = "Elegí una zona de envío"

const text = (min: number, max: number) => {
  const base = z.string({ required_error: REQUIRED_MESSAGE }).trim().min(1, REQUIRED_MESSAGE)
  const withMin = min > 1 ? base.min(min, `Ingresá al menos ${min} caracteres`) : base
  return withMin.max(max, `Máximo ${max} caracteres`)
}

const customerSchema = z.object({
  fullName: text(2, 100),
  phone: text(1, 30)
    .regex(PHONE_PATTERN, "Ingresá un teléfono válido")
    .refine((value) => {
      const digits = value.replace(/\D/g, "").length
      return digits >= 6 && digits <= 15
    }, "Ingresá un teléfono válido"),
  email: z
    .string()
    .trim()
    .max(120, "Máximo 120 caracteres")
    .email("Ingresá un email válido")
    .or(z.literal(""))
    .optional(),
})

const shippingAddressSchema = z
  .object({
    street: text(3, 150),
    reference: text(1, 100),
    city: text(2, 80),
    department: text(2, 80),
    // Server-side allow list: the name (not a code) is what orders store, so legacy "Paraguay" stays valid.
    country: text(2, 60).refine(isShippingCountry, "Elegí un país de la lista"),
    // Only an id: the server derives the price from it. Required for Paraguay (checked below), ignored abroad.
    shippingOptionId: z.string().trim().max(40, "Zona de envío inválida").optional(),
    postalCode: z
      .string()
      .trim()
      .max(12, "Máximo 12 caracteres")
      .regex(POSTAL_CODE_PATTERN, "Usá solo letras, números, espacios o guiones")
      .optional(),
    notes: z.string().trim().max(500, "Máximo 500 caracteres").optional(),
  })
  .superRefine((address, ctx) => {
    // An unknown country is already reported on its own field; do not pile a second error on top.
    const countryIsKnown = isShippingCountry(address.country) || address.country === ""
    if (countryIsKnown && isDomesticShipment(address.country) && !getShippingOption(address.shippingOptionId)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["shippingOptionId"],
        message: SHIPPING_OPTION_MESSAGE,
      })
    }
  })

/** Fields the shopper fills in the checkout form. */
export const checkoutFormSchema = z.object({
  customer: customerSchema,
  shippingAddress: shippingAddressSchema,
})

/** A cart line as accepted by the server: an item and a quantity, never a price. */
const orderLineInputSchema = z.object({
  itemId: z.string().regex(OBJECT_ID_PATTERN, "Producto inválido"),
  quantity: z
    .number({ invalid_type_error: "Cantidad inválida" })
    .int("La cantidad debe ser un número entero")
    .min(1, "La cantidad mínima es 1")
    .max(MAX_QUANTITY_PER_ITEM, `La cantidad máxima por producto es ${MAX_QUANTITY_PER_ITEM}`),
})

/** Full payload of the `createOrder` server action. */
export const createOrderInputSchema = checkoutFormSchema.extend({
  lines: z
    .array(orderLineInputSchema)
    .min(1, "Tu carrito está vacío")
    .max(50, "Demasiados productos en el pedido")
    .superRefine((lines, ctx) => {
      const seen = new Set<string>()
      for (const [index, line] of lines.entries()) {
        if (seen.has(line.itemId)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [index, "itemId"],
            message: "Producto duplicado en el pedido",
          })
        }
        seen.add(line.itemId)
      }
    }),
})

export type CheckoutFormValues = z.infer<typeof checkoutFormSchema>
export type CreateOrderInput = z.infer<typeof createOrderInputSchema>
