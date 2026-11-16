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
    shippingOptionId: "asuncion",
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

  it("allows an empty email", () => {
    const parsed = createOrderInputSchema.safeParse({
      ...validInput,
      customer: { ...validInput.customer, email: "" },
    })
    expect(parsed.success).toBe(true)
  })

  it("allows omitting the email", () => {
    const { email: _email, ...customer } = validInput.customer
    expect(createOrderInputSchema.safeParse({ ...validInput, customer }).success).toBe(true)
  })

  it.each([undefined, "", "   "])("requires delivery notes: rejects %j", (notes) => {
    const parsed = createOrderInputSchema.safeParse({
      ...validInput,
      shippingAddress: { ...validInput.shippingAddress, notes },
    })
    expect(parsed.success).toBe(false)
    if (!parsed.success) {
      const issue = parsed.error.issues.find((i) => i.path.join(".") === "shippingAddress.notes")
      expect(issue?.message).toBe("Completá este campo")
    }
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

  it.each(["street", "country"] as const)(
    "requires shipping %s",
    (field) => {
      const parsed = createOrderInputSchema.safeParse({
        ...validInput,
        shippingAddress: { ...validInput.shippingAddress, [field]: "" },
      })
      expect(parsed.success).toBe(false)
    }
  )

  it.each(["reference", "department", "postalCode"] as const)("does not require %s", (field) => {
    const { [field]: _omitted, ...shippingAddress } = { ...validInput.shippingAddress, [field]: "x" } as Record<
      string,
      string
    >
    expect(createOrderInputSchema.safeParse({ ...validInput, shippingAddress }).success).toBe(true)
    expect(
      createOrderInputSchema.safeParse({
        ...validInput,
        shippingAddress: { ...validInput.shippingAddress, [field]: "" },
      }).success
    ).toBe(true)
  })

  describe("city", () => {
    const withCity = (shippingAddress: Record<string, unknown>) =>
      createOrderInputSchema.safeParse({
        ...validInput,
        shippingAddress: { ...validInput.shippingAddress, ...shippingAddress },
      })
    const cityIssue = (result: ReturnType<typeof withCity>) =>
      result.success ? undefined : result.error.issues.find((i) => i.path.join(".") === "shippingAddress.city")

    it("is derived from a city zone, so the typed one is not required", () => {
      expect(withCity({ shippingOptionId: "luque-1", city: "" }).success).toBe(true)
    })

    it.each(["", "  ", "a"])("is required for an interior zone: rejects %j", (city) => {
      expect(cityIssue(withCity({ shippingOptionId: "interior", city }))).toBeDefined()
    })

    it("accepts a typed city for an interior zone", () => {
      expect(withCity({ shippingOptionId: "interior-door", city: "Encarnación" }).success).toBe(true)
    })

    it.each(["", "  ", "a"])("is required abroad: rejects %j", (city) => {
      expect(cityIssue(withCity({ country: "Argentina", shippingOptionId: "", city }))).toBeDefined()
    })

    it("accepts a typed city abroad", () => {
      expect(withCity({ country: "Argentina", shippingOptionId: "", city: "Rosario" }).success).toBe(true)
    })

    it("does not pile a city error on top of a missing zone", () => {
      const result = withCity({ shippingOptionId: "", city: "" })
      expect(result.success).toBe(false)
      expect(cityIssue(result)).toBeUndefined()
    })

    it("rejects an over-long city", () => {
      expect(withCity({ country: "Argentina", city: "x".repeat(81) }).success).toBe(false)
    })
  })

  describe("location mode", () => {
    const base = { ...validInput.shippingAddress }
    const { street: _street, reference: _reference, department: _department, ...withoutAddressFields } = base
    const mapAddress = { ...withoutAddressFields, locationMode: "map", location: { lat: -25.2637, lng: -57.5759 } }
    const parse = (shippingAddress: Record<string, unknown>) =>
      createOrderInputSchema.safeParse({ ...validInput, shippingAddress })
    const issueAt = (result: ReturnType<typeof parse>, path: string) =>
      result.success ? undefined : result.error.issues.find((i) => i.path.join(".") === path)

    it("treats a payload without a mode as an address payload (legacy clients)", () => {
      expect(parse({ ...base }).success).toBe(true)
      expect(issueAt(parse({ ...base, street: "" }), "shippingAddress.street")?.message).toBe("Completá este campo")
    })

    it("accepts an explicit address mode", () => {
      expect(parse({ ...base, locationMode: "address" }).success).toBe(true)
    })

    it("requires at least 3 characters for the street in address mode", () => {
      expect(issueAt(parse({ ...base, locationMode: "address", street: "ab" }), "shippingAddress.street")?.message).toBe(
        "Ingresá al menos 3 caracteres"
      )
    })

    it("still validates the optional address fields in address mode", () => {
      expect(parse({ ...base, locationMode: "address", postalCode: "12<3>" }).success).toBe(false)
      expect(parse({ ...base, locationMode: "address", reference: "x".repeat(101) }).success).toBe(false)
      expect(parse({ ...base, locationMode: "address", department: "x".repeat(81) }).success).toBe(false)
      expect(parse({ ...base, locationMode: "address", street: "x".repeat(151) }).success).toBe(false)
    })

    it("accepts a map payload with a location and no street, reference or department", () => {
      const parsed = parse(mapAddress)

      expect(parsed.success).toBe(true)
      if (parsed.success) {
        expect(parsed.data.shippingAddress.locationMode).toBe("map")
        expect(parsed.data.shippingAddress.location).toEqual({ lat: -25.2637, lng: -57.5759 })
      }
    })

    it("does not validate the hidden address fields in map mode", () => {
      expect(parse({ ...mapAddress, street: "", postalCode: "12<3>", reference: "x".repeat(500) }).success).toBe(true)
    })

    it.each([undefined, null])("rejects map mode without a location (%j)", (location) => {
      const result = parse({ ...mapAddress, location })

      expect(result.success).toBe(false)
      expect(issueAt(result, "shippingAddress.location")?.message).toBe("Marcá tu ubicación en el mapa")
    })

    it("keeps requiring country, zone, city rules and notes in map mode", () => {
      expect(parse({ ...mapAddress, notes: "" }).success).toBe(false)
      expect(parse({ ...mapAddress, country: "Narnia" }).success).toBe(false)
      expect(issueAt(parse({ ...mapAddress, shippingOptionId: "" }), "shippingAddress.shippingOptionId")).toBeDefined()
      expect(parse({ ...mapAddress, country: "Argentina", shippingOptionId: "", city: "" }).success).toBe(false)
      expect(parse({ ...mapAddress, shippingOptionId: "interior", city: "" }).success).toBe(false)
      expect(parse({ ...mapAddress, shippingOptionId: "interior", city: "Encarnación" }).success).toBe(true)
    })

    it("does not need a location in address mode and ignores one if sent", () => {
      expect(parse({ ...base, location: null }).success).toBe(true)
      expect(parse({ ...base, location: { lat: 1, lng: 2 } }).success).toBe(true)
    })

    it("rejects an unknown mode", () => {
      expect(parse({ ...base, locationMode: "gps" }).success).toBe(false)
      expect(parse({ ...base, locationMode: 1 }).success).toBe(false)
    })

    it.each([
      ["latitude above 90", { lat: 90.0001, lng: 0 }],
      ["latitude below -90", { lat: -90.0001, lng: 0 }],
      ["longitude above 180", { lat: 0, lng: 180.0001 }],
      ["longitude below -180", { lat: 0, lng: -180.0001 }],
      ["NaN", { lat: Number.NaN, lng: 0 }],
      ["Infinity", { lat: 0, lng: Number.POSITIVE_INFINITY }],
      ["numeric strings", { lat: "-25.2", lng: "-57.5" }],
      ["a missing longitude", { lat: -25.2 }],
      ["null coordinates", { lat: null, lng: null }],
    ])("rejects an invalid location: %s", (_label, location) => {
      expect(parse({ ...mapAddress, location }).success).toBe(false)
    })

    it.each([
      { lat: 90, lng: 180 },
      { lat: -90, lng: -180 },
      { lat: 0, lng: 0 },
    ])("accepts the boundary coordinates %j", (location) => {
      expect(parse({ ...mapAddress, location }).success).toBe(true)
    })

    it("rejects out-of-range coordinates even in address mode", () => {
      expect(parse({ ...base, location: { lat: 100, lng: 0 } }).success).toBe(false)
    })
  })

  describe("shipping country", () => {
    const withCountry = (country: unknown) =>
      createOrderInputSchema.safeParse({
        ...validInput,
        shippingAddress: { ...validInput.shippingAddress, country },
      })

    it.each(["Paraguay", "Argentina", "Estados Unidos", "España", "Brasil"])("accepts %j", (country) => {
      expect(withCountry(country).success).toBe(true)
    })

    it("accepts the legacy Paraguay payload with no postal code", () => {
      const parsed = createOrderInputSchema.safeParse(validInput)

      expect(parsed.success).toBe(true)
      if (parsed.success) expect(parsed.data.shippingAddress.postalCode).toBeUndefined()
    })

    it("trims the country before checking it against the list", () => {
      const parsed = withCountry("  Argentina ")

      expect(parsed.success).toBe(true)
      if (parsed.success) expect(parsed.data.shippingAddress.country).toBe("Argentina")
    })

    it.each([
      ["unknown country", "Narnia"],
      ["different casing", "argentina"],
      ["ISO code instead of the name", "AR"],
      ["empty", ""],
      ["blank", "   "],
      ["script injection", "<script>alert(1)</script>"],
      ["SQL injection", "Argentina'; DROP TABLE orders;--"],
      ["NoSQL operator string", '{"$ne":null}'],
      ["country plus suffix", "Paraguay, Asuncion"],
      ["null byte", "Paraguay\u0000"],
      ["prototype key", "__proto__"],
      ["too long", "A".repeat(61)],
    ])("rejects %s", (_label, country) => {
      expect(withCountry(country).success).toBe(false)
    })

    it.each([null, undefined, 1, {}, ["Paraguay"], { $ne: "x" }])("rejects the non-string %j", (country) => {
      expect(withCountry(country).success).toBe(false)
    })

    it("reports the failure on the country field with a Spanish message", () => {
      const parsed = withCountry("Narnia")

      expect(parsed.success).toBe(false)
      if (!parsed.success) {
        const issue = parsed.error.issues.find((i) => i.path.join(".") === "shippingAddress.country")
        expect(issue?.message).toBe("Elegí un país de la lista")
      }
    })
  })

  describe("shipping option", () => {
    const withOption = (shippingOptionId: unknown, country = "Paraguay") =>
      createOrderInputSchema.safeParse({
        ...validInput,
        shippingAddress: { ...validInput.shippingAddress, country, shippingOptionId },
      })

    const optionIssue = (result: ReturnType<typeof withOption>) =>
      result.success
        ? undefined
        : result.error.issues.find((issue) => issue.path.join(".") === "shippingAddress.shippingOptionId")

    it.each(["asuncion", "luque-1", "luque-2", "interior", "interior-door"])("accepts %j for Paraguay", (id) => {
      const parsed = withOption(id)

      expect(parsed.success).toBe(true)
      if (parsed.success) expect(parsed.data.shippingAddress.shippingOptionId).toBe(id)
    })

    it.each([undefined, "", "   ", "unknown", "ASUNCION", "__proto__", "asuncion; drop"])(
      "requires a valid option for Paraguay: rejects %j",
      (id) => {
        const parsed = withOption(id)

        expect(parsed.success).toBe(false)
        expect(optionIssue(parsed)?.message).toBe("Elegí una zona de envío")
      }
    )

    it("requires a valid option when the country is empty (legacy payloads are domestic)", () => {
      const parsed = withOption(undefined, "")

      expect(optionIssue(parsed)?.message).toBe("Elegí una zona de envío")
    })

    it.each([undefined, "", "asuncion"])("does not need an option abroad: accepts %j", (id) => {
      expect(withOption(id, "Argentina").success).toBe(true)
    })

    it("does not flag the option when the country itself is invalid", () => {
      const parsed = withOption(undefined, "Narnia")

      expect(parsed.success).toBe(false)
      expect(optionIssue(parsed)).toBeUndefined()
    })

    it.each([null, 1, {}, ["asuncion"], { $ne: "x" }])("rejects the non-string %j", (id) => {
      expect(withOption(id).success).toBe(false)
      expect(withOption(id, "Argentina").success).toBe(false)
    })

    it("rejects an over-long option id", () => {
      expect(withOption("a".repeat(41), "Argentina").success).toBe(false)
    })

    it("never accepts a shipping cost from the client: it is stripped from the payload", () => {
      const parsed = createOrderInputSchema.safeParse({
        ...validInput,
        shippingCost: 1,
        shippingAddress: { ...validInput.shippingAddress, shippingCost: 1, shippingPrice: 1 },
      })

      expect(parsed.success).toBe(true)
      if (parsed.success) {
        expect(parsed.data).not.toHaveProperty("shippingCost")
        expect(parsed.data.shippingAddress).not.toHaveProperty("shippingCost")
        expect(parsed.data.shippingAddress).not.toHaveProperty("shippingPrice")
      }
    })
  })

  describe("postal code", () => {
    const withPostalCode = (postalCode: unknown) =>
      createOrderInputSchema.safeParse({
        ...validInput,
        shippingAddress: { ...validInput.shippingAddress, country: "Argentina", postalCode },
      })

    it.each([undefined, "", "   ", "C1425", "SW1A 1AA", "12345-678", "1000"])("accepts %j", (postalCode) => {
      expect(withPostalCode(postalCode).success).toBe(true)
    })

    it("trims the postal code", () => {
      const parsed = withPostalCode("  C1425 ")

      expect(parsed.success).toBe(true)
      if (parsed.success) expect(parsed.data.shippingAddress.postalCode).toBe("C1425")
    })

    it.each(["<b>1</b>", "1000; DROP", "12_34", "12.34", "ñandú", "1".repeat(13), "{$ne:1}"])(
      "rejects %j",
      (postalCode) => {
        expect(withPostalCode(postalCode).success).toBe(false)
      }
    )

    it("accepts a code of exactly 12 characters", () => {
      expect(withPostalCode("A".repeat(12)).success).toBe(true)
    })
  })

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
