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
  // Required: the order confirmation ("estamos verificando tu pedido") is sent to this address.
  email: z
    .string({ required_error: REQUIRED_MESSAGE })
    .trim()
    .min(1, REQUIRED_MESSAGE)
    .max(120, "Máximo 120 caracteres")
    .email("Ingresá un email válido"),
})

export const LOCATION_REQUIRED_MESSAGE = "Marcá tu ubicación en el mapa"

/** How the shopper gives the delivery location: a written address or a point marked on a map. */
export const LOCATION_MODES = ["address", "map"] as const
export type LocationMode = (typeof LOCATION_MODES)[number]

const locationSchema = z.object({
  lat: z
    .number({ invalid_type_error: "Ubicación inválida" })
    .finite()
    .min(-90, "Ubicación inválida")
    .max(90, "Ubicación inválida"),
  lng: z
    .number({ invalid_type_error: "Ubicación inválida" })
    .finite()
    .min(-180, "Ubicación inválida")
    .max(180, "Ubicación inválida"),
})

/** Written-address fields: validated only in address mode, ignored (and never stored) in map mode. */
const addressFieldsSchema = z.object({
  street: text(3, 150),
  reference: z.string().trim().max(100, "Máximo 100 caracteres").optional(),
  department: z.string().trim().max(80, "Máximo 80 caracteres").optional(),
  postalCode: z
    .string()
    .trim()
    .max(12, "Máximo 12 caracteres")
    .regex(POSTAL_CODE_PATTERN, "Usá solo letras, números, espacios o guiones")
    .optional(),
})

const cityTextSchema = text(2, 80)

const shippingAddressSchema = z
  .object({
    // Absent in payloads of older clients: those are always written addresses.
    locationMode: z.enum(LOCATION_MODES).optional(),
    // Loose on purpose: the mode-specific rules live in the superRefine below so a hidden field never blocks.
    street: z.string().trim().optional(),
    reference: z.string().trim().optional(),
    department: z.string().trim().optional(),
    postalCode: z.string().trim().optional(),
    // `null` is how the form says "no pin yet"; a pin is only required (and stored) in map mode.
    location: locationSchema.nullish(),
    city: z.string().trim().max(80, "Máximo 80 caracteres").optional(),
    // Server-side allow list: the name (not a code) is what orders store, so legacy "Paraguay" stays valid.
    country: text(2, 60).refine(isShippingCountry, "Elegí un país de la lista"),
    // Only an id: the server derives the price from it. Required for Paraguay (checked below), ignored abroad.
    shippingOptionId: z.string().trim().max(40, "Zona de envío inválida").optional(),
    notes: text(1, 500),
  })
  .superRefine((address, ctx) => {
    // An unknown country is already reported on its own field; do not pile a second error on top.
    const countryIsKnown = isShippingCountry(address.country) || address.country === ""
    const isDomestic = countryIsKnown && isDomesticShipment(address.country)
    const option = getShippingOption(address.shippingOptionId)

    if (isDomestic && !option) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["shippingOptionId"],
        message: SHIPPING_OPTION_MESSAGE,
      })
    }

    // A city zone fixes the city on the server; only interior and international orders need a typed one.
    const needsTypedCity = option ? option.kind === "interior" : countryIsKnown && !isDomestic
    if (needsTypedCity) {
      const city = cityTextSchema.safeParse(address.city ?? "")
      if (!city.success) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["city"], message: city.error.issues[0].message })
      }
    }

    if (address.locationMode === "map") {
      if (!address.location) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["location"], message: LOCATION_REQUIRED_MESSAGE })
      }
      return
    }

    const fields = addressFieldsSchema.safeParse(address)
    if (!fields.success) {
      for (const issue of fields.error.issues) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: issue.path, message: issue.message })
      }
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
