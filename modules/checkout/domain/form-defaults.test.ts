import { describe, expect, it } from "vitest"
import { buildFormDefaults } from "./form-defaults"

describe("buildFormDefaults", () => {
  it("returns an empty form for guests with Paraguay preselected", () => {
    expect(buildFormDefaults()).toEqual({
      customer: { fullName: "", phone: "", email: "" },
      shippingAddress: {
        street: "",
        reference: "",
        city: "",
        department: "",
        country: "Paraguay",
        postalCode: "",
        notes: "",
      },
    })
  })

  it("prefills contact and address for a signed-in customer", () => {
    const values = buildFormDefaults({
      customer: { fullName: "Ana Perez", phone: "+595 981 000 000", email: "ana@example.com" },
      shippingAddress: {
        street: "Calle Palma 123",
        reference: "Casa 12",
        city: "Asuncion",
        department: "Central",
        country: "Paraguay",
        postalCode: "1234",
        notes: "Timbre roto",
      },
    })

    expect(values.customer).toEqual({ fullName: "Ana Perez", phone: "+595 981 000 000", email: "ana@example.com" })
    expect(values.shippingAddress).toMatchObject({
      street: "Calle Palma 123",
      city: "Asuncion",
      postalCode: "1234",
      notes: "Timbre roto",
    })
  })

  it("keeps a previously saved country that is in the allowed list", () => {
    const values = buildFormDefaults({
      shippingAddress: {
        street: "x",
        reference: "x",
        city: "x",
        department: "x",
        country: "Argentina",
        postalCode: "C1425",
        notes: "",
      },
    })

    expect(values.shippingAddress.country).toBe("Argentina")
    expect(values.shippingAddress.postalCode).toBe("C1425")
  })

  it.each(["Narnia", "", "argentina", "<b>x</b>"])("falls back to Paraguay for the saved country %j", (country) => {
    const values = buildFormDefaults({
      shippingAddress: { street: "x", reference: "x", city: "x", department: "x", country, postalCode: "", notes: "" },
    })

    expect(values.shippingAddress.country).toBe("Paraguay")
  })

  it("tolerates partial defaults", () => {
    const values = buildFormDefaults({ customer: { fullName: "Ana", phone: "", email: "" } })

    expect(values.customer.fullName).toBe("Ana")
    expect(values.shippingAddress.street).toBe("")
    expect(values.shippingAddress.country).toBe("Paraguay")
  })
})
