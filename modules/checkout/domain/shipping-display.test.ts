import { describe, expect, it } from "vitest"
import { resolveShippingDisplay, shippingDisplayTotal } from "./shipping-display"

describe("resolveShippingDisplay", () => {
  it("prices a Paraguay order from the chosen option", () => {
    expect(resolveShippingDisplay("Paraguay", "asuncion")).toEqual({ state: "priced", cost: 20_000, label: "Asunción" })
    expect(resolveShippingDisplay("Paraguay", "interior-door")).toEqual({
      state: "priced",
      cost: 35_000,
      label: "Interior del país, entrega en puerta",
    })
  })

  it.each([undefined, "", "unknown", "ASUNCION"])("asks the shopper to choose a zone for %j", (optionId) => {
    expect(resolveShippingDisplay("Paraguay", optionId)).toEqual({ state: "unselected" })
  })

  it("leaves the cost to be quoted for any other country, whatever option is left in the form", () => {
    expect(resolveShippingDisplay("Argentina", "")).toEqual({ state: "to-be-quoted" })
    expect(resolveShippingDisplay("Argentina", "asuncion")).toEqual({ state: "to-be-quoted" })
  })
})

describe("shippingDisplayTotal", () => {
  it("adds the shipping cost only when it is priced", () => {
    expect(shippingDisplayTotal(100_000, { state: "priced", cost: 20_000, label: "Asunción" })).toBe(120_000)
    expect(shippingDisplayTotal(100_000, { state: "unselected" })).toBe(100_000)
    expect(shippingDisplayTotal(100_000, { state: "to-be-quoted" })).toBe(100_000)
  })
})
