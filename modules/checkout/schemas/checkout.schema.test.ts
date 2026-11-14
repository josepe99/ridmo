import { describe, expect, it } from "vitest"
import { createOrderInputSchema, MAX_QUANTITY_PER_ITEM } from "./checkout.schema"

const validInput = {
  customer: { fullName: "  Maria Gomez ", phone: "+595 981 123 456", email: "maria@example.com" },
  shippingAddress: {
    street: "Av. Mariscal Lopez 1234",
    reference: "Casa 12, porton negro",
    city: "Asuncion",
    department: "Central",
    country: "Paraguay",
    notes: "Tocar timbre",
  },
  lines: [{ itemId: "665f1c2e8b3a4d0012a1b001", quantity: 2 }],
}

const withLines = (lines: unknown) => ({ ...validInput, lines })
const itemId = validInput.lines[0].itemId

describe("createOrderInputSchema", () => {
  it("accepts a valid payload and trims strings", () => {
    const parsed = createOrderInputSchema.safeParse(validInput)
    expect(parsed.success).toBe(true)
    if (parsed.success) expect(parsed.data.customer.fullName).toBe("Maria Gomez")
  })

  it("allows an empty email and empty notes", () => {
    const parsed = createOrderInputSchema.safeParse({
      ...validInput,
      customer: { ...validInput.customer, email: "" },
      shippingAddress: { ...validInput.shippingAddress, notes: "" },
    })
    expect(parsed.success).toBe(true)
  })

  it("allows omitting email and notes", () => {
    const { email: _email, ...customer } = validInput.customer
    const { notes: _notes, ...shippingAddress } = validInput.shippingAddress
    expect(createOrderInputSchema.safeParse({ ...validInput, customer, shippingAddress }).success).toBe(
      true
    )
  })

  it("rejects a malformed email", () => {
    const parsed = createOrderInputSchema.safeParse({
      ...validInput,
      customer: { ...validInput.customer, email: "not-an-email" },
    })
    expect(parsed.success).toBe(false)
  })

  it.each(["", " ", "a"])("rejects a too short full name %j", (fullName) => {
    const parsed = createOrderInputSchema.safeParse({
      ...validInput,
      customer: { ...validInput.customer, fullName },
    })
    expect(parsed.success).toBe(false)
  })

  it.each(["abc", "12", "++++++", "1".repeat(31)])("rejects invalid phone %j", (phone) => {
    const parsed = createOrderInputSchema.safeParse({
      ...validInput,
      customer: { ...validInput.customer, phone },
    })
    expect(parsed.success).toBe(false)
  })

  it("rejects over-long free text", () => {
    const parsed = createOrderInputSchema.safeParse({
      ...validInput,
      shippingAddress: { ...validInput.shippingAddress, notes: "x".repeat(501) },
    })
    expect(parsed.success).toBe(false)
  })

  it.each(["street", "reference", "city", "department", "country"] as const)(
    "requires shipping %s",
    (field) => {
      const parsed = createOrderInputSchema.safeParse({
        ...validInput,
        shippingAddress: { ...validInput.shippingAddress, [field]: "" },
      })
      expect(parsed.success).toBe(false)
    }
  )

  describe("lines", () => {
    it(`accepts quantities from 1 to ${MAX_QUANTITY_PER_ITEM}`, () => {
      for (const quantity of [1, MAX_QUANTITY_PER_ITEM]) {
        expect(createOrderInputSchema.safeParse(withLines([{ itemId, quantity }])).success).toBe(
          true
        )
      }
    })

    it.each([0, -1, 1.5, MAX_QUANTITY_PER_ITEM + 1, "2", null, Number.NaN])(
      "rejects quantity %j",
      (quantity) => {
        expect(createOrderInputSchema.safeParse(withLines([{ itemId, quantity }])).success).toBe(
          false
        )
      }
    )

    it("requires at least one line", () => {
      expect(createOrderInputSchema.safeParse(withLines([])).success).toBe(false)
    })

    it("caps the number of distinct lines", () => {
      const many = Array.from({ length: 51 }, (_, i) => ({
        itemId: i.toString(16).padStart(24, "0"),
        quantity: 1,
      }))
      expect(createOrderInputSchema.safeParse(withLines(many)).success).toBe(false)
    })

    it("rejects ids that are not Mongo ObjectIds", () => {
      expect(
        createOrderInputSchema.safeParse(withLines([{ itemId: "abc", quantity: 1 }])).success
      ).toBe(false)
      expect(
        createOrderInputSchema.safeParse(withLines([{ itemId: "z".repeat(24), quantity: 1 }]))
          .success
      ).toBe(false)
    })

    it("rejects duplicated item ids", () => {
      const line = { itemId, quantity: 1 }
      expect(createOrderInputSchema.safeParse(withLines([line, line])).success).toBe(false)
    })

    it("strips any client supplied price from the parsed lines", () => {
      const parsed = createOrderInputSchema.safeParse(
        withLines([{ itemId, quantity: 1, price: 1, unitPrice: 1, lineTotal: 1 }])
      )
      expect(parsed.success).toBe(true)
      if (parsed.success) {
        expect(Object.keys(parsed.data.lines[0]).sort()).toEqual(["itemId", "quantity"])
      }
    })
  })

  it("ignores a legacy displayCountry sent by an old client instead of storing it", () => {
    const parsed = createOrderInputSchema.safeParse({ ...validInput, displayCountry: "AR" })

    expect(parsed.success).toBe(true)
    if (parsed.success) expect(parsed.data).not.toHaveProperty("displayCountry")
  })
})
