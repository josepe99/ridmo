import { describe, expect, it } from "vitest"
import {
  CHECKOUT_STEPS,
  canEnterStep,
  canNavigateTo,
  isShippingFieldPath,
  nextStep,
  previousStep,
  resolveStep,
  stepForServerFailure,
  stepIndex,
  type StepGuardContext,
} from "./checkout-steps"

const ready: StepGuardContext = { itemCount: 2, shippingValid: true }
const noShipping: StepGuardContext = { itemCount: 2, shippingValid: false }
const emptyCart: StepGuardContext = { itemCount: 0, shippingValid: true }

describe("CHECKOUT_STEPS", () => {
  it("orders the steps items -> shipping -> payment", () => {
    expect(CHECKOUT_STEPS).toEqual(["items", "shipping", "payment"])
    expect(stepIndex("items")).toBe(0)
    expect(stepIndex("payment")).toBe(2)
  })
})

describe("canEnterStep", () => {
  it("always allows the items step", () => {
    expect(canEnterStep("items", emptyCart)).toBe(true)
    expect(canEnterStep("items", noShipping)).toBe(true)
  })

  it("requires at least one cart item to enter shipping", () => {
    expect(canEnterStep("shipping", emptyCart)).toBe(false)
    expect(canEnterStep("shipping", noShipping)).toBe(true)
  })

  it("requires a non-empty cart and valid shipping data to enter payment", () => {
    expect(canEnterStep("payment", ready)).toBe(true)
    expect(canEnterStep("payment", noShipping)).toBe(false)
    expect(canEnterStep("payment", emptyCart)).toBe(false)
  })
})

describe("nextStep", () => {
  it("moves items -> shipping -> payment when the guards pass", () => {
    expect(nextStep("items", ready)).toBe("shipping")
    expect(nextStep("shipping", ready)).toBe("payment")
  })

  it("cannot leave items with an empty cart", () => {
    expect(nextStep("items", emptyCart)).toBe("items")
  })

  it("cannot leave shipping while the shipping data is invalid", () => {
    expect(nextStep("shipping", noShipping)).toBe("shipping")
  })

  it("stays on payment, the last step", () => {
    expect(nextStep("payment", ready)).toBe("payment")
  })
})

describe("previousStep", () => {
  it("goes back one step and stops at items", () => {
    expect(previousStep("payment")).toBe("shipping")
    expect(previousStep("shipping")).toBe("items")
    expect(previousStep("items")).toBe("items")
  })
})

describe("canNavigateTo", () => {
  it("allows completed (earlier) steps", () => {
    expect(canNavigateTo("items", "payment", ready)).toBe(true)
    expect(canNavigateTo("shipping", "payment", ready)).toBe(true)
    expect(canNavigateTo("items", "shipping", ready)).toBe(true)
  })

  it("does not allow the current or future steps", () => {
    expect(canNavigateTo("shipping", "shipping", ready)).toBe(false)
    expect(canNavigateTo("payment", "items", ready)).toBe(false)
    expect(canNavigateTo("payment", "shipping", ready)).toBe(false)
  })
})

describe("resolveStep", () => {
  it("keeps a step whose guards pass", () => {
    expect(resolveStep("payment", ready)).toBe("payment")
    expect(resolveStep("shipping", ready)).toBe("shipping")
  })

  it("bounces any step back to items when the cart is empty", () => {
    expect(resolveStep("shipping", emptyCart)).toBe("items")
    expect(resolveStep("payment", emptyCart)).toBe("items")
  })

  it("bounces payment back to shipping when the shipping data is not valid", () => {
    expect(resolveStep("payment", noShipping)).toBe("shipping")
  })
})

describe("isShippingFieldPath", () => {
  it.each([
    "customer.fullName",
    "customer.phone",
    "customer.email",
    "shippingAddress.street",
    "shippingAddress.reference",
    "shippingAddress.city",
    "shippingAddress.department",
    "shippingAddress.country",
    "shippingAddress.shippingOptionId",
    "shippingAddress.postalCode",
    "shippingAddress.notes",
    "shippingAddress.locationMode",
    "shippingAddress.location",
    "shippingAddress.location.lat",
    "shippingAddress.location.lng",
  ])("maps %s to the shipping step", (path) => {
    expect(isShippingFieldPath(path)).toBe(true)
  })

  it.each(["lines", "lines.0.quantity", "lines.1.itemId", "customer", "shippingAddress.unknown", ""])(
    "does not map %s",
    (path) => {
      expect(isShippingFieldPath(path)).toBe(false)
    }
  )
})

describe("stepForServerFailure", () => {
  it("routes shipping field errors to the shipping step", () => {
    expect(
      stepForServerFailure({
        code: "VALIDATION",
        fieldErrors: { "customer.phone": "x", "shippingAddress.city": "y" },
      })
    ).toBe("shipping")
  })

  it("routes a rejected country or postal code back to the shipping step", () => {
    expect(
      stepForServerFailure({
        code: "VALIDATION",
        fieldErrors: { "shippingAddress.country": "Elegí un país de la lista" },
      })
    ).toBe("shipping")
    expect(
      stepForServerFailure({
        code: "VALIDATION",
        fieldErrors: { "shippingAddress.postalCode": "x" },
      })
    ).toBe("shipping")
  })

  it("routes cart line validation errors to the items step", () => {
    expect(
      stepForServerFailure({ code: "VALIDATION", fieldErrors: { "lines.0.quantity": "max 20" } })
    ).toBe("items")
  })

  it("routes to the earliest step when both cart and shipping fields failed", () => {
    expect(
      stepForServerFailure({
        code: "VALIDATION",
        fieldErrors: { "customer.phone": "x", "lines.0.quantity": "max 20" },
      })
    ).toBe("items")
  })

  it.each(["EMPTY_CART", "INVALID_QUANTITY", "ITEM_UNAVAILABLE", "INSUFFICIENT_STOCK"])(
    "routes the catalog/stock failure %s to the items step",
    (code) => {
      expect(stepForServerFailure({ code })).toBe("items")
    }
  )

  it("routes a missing or tampered shipping option back to the shipping step", () => {
    expect(stepForServerFailure({ code: "INVALID_SHIPPING_OPTION" })).toBe("shipping")
    expect(
      stepForServerFailure({
        code: "VALIDATION",
        fieldErrors: { "shippingAddress.shippingOptionId": "Elegí una zona de envío" },
      })
    ).toBe("shipping")
  })

  it("keeps the shopper on payment for an unexpected failure", () => {
    expect(stepForServerFailure({ code: "INTERNAL" })).toBe("payment")
  })

  it("keeps the shopper on payment for a validation failure without fields", () => {
    expect(stepForServerFailure({ code: "VALIDATION", fieldErrors: {} })).toBe("payment")
  })
})
