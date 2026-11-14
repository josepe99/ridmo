import { describe, expect, it } from "vitest"
import {
  ORDER_STATUSES,
  allowedTransitions,
  canTransition,
  isOrderStatus,
} from "./status"

describe("order status transitions", () => {
  it("follows the happy path PENDING_PAYMENT -> PAYMENT_CONFIRMED -> SHIPPED -> DELIVERED", () => {
    expect(canTransition("PENDING_PAYMENT", "PAYMENT_CONFIRMED")).toBe(true)
    expect(canTransition("PAYMENT_CONFIRMED", "SHIPPED")).toBe(true)
    expect(canTransition("SHIPPED", "DELIVERED")).toBe(true)
  })

  it("allows cancelling only before the order ships", () => {
    expect(canTransition("PENDING_PAYMENT", "CANCELLED")).toBe(true)
    expect(canTransition("PAYMENT_CONFIRMED", "CANCELLED")).toBe(true)
    expect(canTransition("SHIPPED", "CANCELLED")).toBe(false)
    expect(canTransition("DELIVERED", "CANCELLED")).toBe(false)
  })

  it("treats DELIVERED and CANCELLED as terminal", () => {
    expect(allowedTransitions("DELIVERED")).toEqual([])
    expect(allowedTransitions("CANCELLED")).toEqual([])
  })

  it("does not skip steps or go backwards", () => {
    expect(canTransition("PENDING_PAYMENT", "SHIPPED")).toBe(false)
    expect(canTransition("PENDING_PAYMENT", "DELIVERED")).toBe(false)
    expect(canTransition("SHIPPED", "PAYMENT_CONFIRMED")).toBe(false)
    expect(canTransition("PENDING_PAYMENT", "PENDING_PAYMENT")).toBe(false)
  })

  it("validates raw status strings", () => {
    for (const status of ORDER_STATUSES) expect(isOrderStatus(status)).toBe(true)
    expect(isOrderStatus("REFUNDED")).toBe(false)
    expect(isOrderStatus(undefined)).toBe(false)
  })
})
