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
        shippingOptionId: "",
        postalCode: "",
        notes: "",
        locationMode: "address",
        location: null,
      },
    })
  })

  describe("location mode", () => {
    it("starts in address mode with no pin", () => {
      const { shippingAddress } = buildFormDefaults()

      expect(shippingAddress.locationMode).toBe("address")
      expect(shippingAddress.location).toBeNull()
    })

    it("starts in address mode when the saved address was a written one", () => {
      const { shippingAddress } = buildFormDefaults({
        shippingAddress: { street: "Calle Palma 123", reference: "", city: "x", department: "", country: "Paraguay", postalCode: "", notes: "" },
      })

      expect(shippingAddress.locationMode).toBe("address")
      expect(shippingAddress.location).toBeNull()
    })

    it("reuses the pin of a previous map order and opens in map mode", () => {
      const { shippingAddress } = buildFormDefaults({
        shippingAddress: {
          street: "",
          reference: "",
          city: "Asunción",
          department: "",
          country: "Paraguay",
          shippingOptionId: "asuncion",
          postalCode: "",
          notes: "Portón verde",
          location: { lat: -25.28, lng: -57.63 },
        },
      })

      expect(shippingAddress).toMatchObject({
        locationMode: "map",
        location: { lat: -25.28, lng: -57.63 },
        street: "",
        notes: "Portón verde",
      })
    })
  })

  describe("shipping option", () => {
    const withSaved = (country: string, shippingOptionId: string | undefined) =>
      buildFormDefaults({
        shippingAddress: { street: "x", reference: "x", city: "Luque", department: "x", country, shippingOptionId, postalCode: "", notes: "" },
      }).shippingAddress

    it("keeps a saved option that still exists for a Paraguay address", () => {
      expect(withSaved("Paraguay", "luque-2").shippingOptionId).toBe("luque-2")
    })

    it("takes the city from a city option and keeps the typed one for interior deliveries", () => {
      const city = (id: string, saved: string) =>
        buildFormDefaults({
          shippingAddress: { street: "x", reference: "x", city: saved, department: "x", country: "Paraguay", shippingOptionId: id, postalCode: "", notes: "" },
        }).shippingAddress.city

      expect(city("asuncion", "Otro")).toBe("Asunción")
      expect(city("interior", "Encarnación")).toBe("Encarnación")
    })

    it.each([undefined, "", "retired-option", "ASUNCION"])("starts empty for the saved option %j", (id) => {
      expect(withSaved("Paraguay", id).shippingOptionId).toBe("")
    })

    it("drops the option when the saved country is not Paraguay", () => {
      expect(withSaved("Argentina", "asuncion").shippingOptionId).toBe("")
    })

    it("drops the option when the saved country is no longer allowed and falls back to Paraguay", () => {
      const address = withSaved("Narnia", "asuncion")

      expect(address.country).toBe("Paraguay")
      expect(address.shippingOptionId).toBe("")
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
