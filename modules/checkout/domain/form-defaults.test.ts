import { describe, expect, it } from "vitest"
import { SHIPPING_COUNTRY, buildFormDefaults } from "./form-defaults"

describe("buildFormDefaults", () => {
  it("returns an empty form for guests with Paraguay as the country", () => {
    expect(buildFormDefaults()).toEqual({
      customer: { fullName: "", phone: "", email: "" },
      shippingAddress: {
        street: "",
        reference: "",
        city: "",
        department: "",
        country: SHIPPING_COUNTRY,
        notes: "",
      },
    })
    expect(SHIPPING_COUNTRY).toBe("Paraguay")
  })

  it("prefills contact and address for a signed-in customer", () => {
    const values = buildFormDefaults({
      customer: { fullName: "Ana Perez", phone: "+595 981 000 000", email: "ana@example.com" },
      shippingAddress: {
        street: "Calle Palma 123",
        reference: "Casa 12",
        city: "Asuncion",
        department: "Central",
        country: "Argentina",
        notes: "Timbre roto",
      },
    })

    expect(values.customer).toEqual({ fullName: "Ana Perez", phone: "+595 981 000 000", email: "ana@example.com" })
    expect(values.shippingAddress).toMatchObject({ street: "Calle Palma 123", city: "Asuncion", notes: "Timbre roto" })
  })

  it("always ships to Paraguay, ignoring a country saved in an old order", () => {
    const values = buildFormDefaults({
      shippingAddress: { street: "x", reference: "x", city: "x", department: "x", country: "Argentina", notes: "" },
    })

    expect(values.shippingAddress.country).toBe("Paraguay")
  })

  it("tolerates partial defaults", () => {
    const values = buildFormDefaults({ customer: { fullName: "Ana", phone: "", email: "" } })

    expect(values.customer.fullName).toBe("Ana")
    expect(values.shippingAddress.street).toBe("")
  })
})
