import { act, renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { CartItem } from "../types"
import { useCart } from "./use-cart"

const item = (overrides: Partial<CartItem> = {}): CartItem => ({
  id: "i1",
  name: "Cadena",
  price: 1000,
  image: "a.jpg",
  slug: "cadena",
  quantity: 1,
  addedAt: "2026-01-01T00:00:00.000Z",
  ...overrides,
})

const seed = (items: CartItem[]) => localStorage.setItem("cart", JSON.stringify(items))
const stored = () => JSON.parse(localStorage.getItem("cart") ?? "null")

async function renderLoadedCart() {
  const view = renderHook(() => useCart())
  await waitFor(() => expect(view.result.current.isLoading).toBe(false))
  return view
}

beforeEach(() => {
  localStorage.clear()
  vi.spyOn(console, "error").mockImplementation(() => {})
})

describe("useCart loading", () => {
  it("starts in the loading state with an empty cart", () => {
    const { result } = renderHook(() => useCart())

    expect(result.current.items).toEqual([])
  })

  it("loads the persisted cart and computes totals", async () => {
    seed([item({ quantity: 2 }), item({ id: "i2", price: 500, quantity: 3 })])

    const { result } = await renderLoadedCart()

    expect(result.current.items).toHaveLength(2)
    expect(result.current.totalQuantity).toBe(5)
    expect(result.current.totalPrice).toBe(2 * 1000 + 3 * 500)
  })

  it("is empty with zero totals when nothing is stored", async () => {
    const { result } = await renderLoadedCart()

    expect(result.current.items).toEqual([])
    expect(result.current.totalPrice).toBe(0)
    expect(result.current.totalQuantity).toBe(0)
  })

  it.each([
    ["invalid JSON", "{not json"],
    ["a JSON object", JSON.stringify({ id: "i1" })],
    ["a JSON string", JSON.stringify("hola")],
  ])("recovers from corrupted storage: %s", async (_label, raw) => {
    localStorage.setItem("cart", raw)

    const { result } = await renderLoadedCart()

    expect(result.current.items).toEqual([])
  })
})

describe("useCart mutations", () => {
  it("increments a quantity and persists it", async () => {
    seed([item()])
    const { result } = await renderLoadedCart()

    act(() => result.current.updateQuantity("i1", 3))

    expect(result.current.items[0].quantity).toBe(3)
    expect(stored()[0].quantity).toBe(3)
  })

  it("decrements a quantity", async () => {
    seed([item({ quantity: 3 })])
    const { result } = await renderLoadedCart()

    act(() => result.current.updateQuantity("i1", 2))

    expect(result.current.items[0].quantity).toBe(2)
  })

  it.each([0, -1])("removes the line when the quantity drops to %i", async (quantity) => {
    seed([item(), item({ id: "i2" })])
    const { result } = await renderLoadedCart()

    act(() => result.current.updateQuantity("i1", quantity))

    expect(result.current.items.map((line) => line.id)).toEqual(["i2"])
  })

  it("removeItem drops only the matching line", async () => {
    seed([item(), item({ id: "i2" })])
    const { result } = await renderLoadedCart()

    act(() => result.current.removeItem("i2"))

    expect(result.current.items.map((line) => line.id)).toEqual(["i1"])
    expect(stored()).toHaveLength(1)
  })

  it("leaves the cart untouched when updating an unknown id", async () => {
    seed([item()])
    const { result } = await renderLoadedCart()

    act(() => result.current.updateQuantity("nope", 5))

    expect(result.current.items).toEqual([item()])
  })

  it("clear empties the cart and removes the storage key", async () => {
    seed([item()])
    const { result } = await renderLoadedCart()

    act(() => result.current.clear())

    expect(result.current.items).toEqual([])
    expect(localStorage.getItem("cart")).toBeNull()
  })

  it("removing the last line also removes the storage key", async () => {
    seed([item()])
    const { result } = await renderLoadedCart()

    act(() => result.current.removeItem("i1"))

    expect(localStorage.getItem("cart")).toBeNull()
  })

  it("announces every change so the nav badge can refresh", async () => {
    seed([item()])
    const { result } = await renderLoadedCart()
    const listener = vi.fn()
    window.addEventListener("cartUpdated", listener)

    act(() => result.current.updateQuantity("i1", 2))
    act(() => result.current.clear())
    window.removeEventListener("cartUpdated", listener)

    expect(listener).toHaveBeenCalledTimes(2)
  })

  it("persists across hook instances (reload)", async () => {
    seed([item()])
    const first = await renderLoadedCart()
    act(() => first.result.current.updateQuantity("i1", 4))
    first.unmount()

    const second = await renderLoadedCart()

    expect(second.result.current.items[0].quantity).toBe(4)
  })

  // The per-product cap (20) is enforced by the checkout UI (disabled "+" button) and the
  // server (zod + pricing), not by the hook itself: documented here so nobody assumes otherwise.
  it("does not cap quantities itself", async () => {
    seed([item({ quantity: 20 })])
    const { result } = await renderLoadedCart()

    act(() => result.current.updateQuantity("i1", 21))

    expect(result.current.items[0].quantity).toBe(21)
  })
})
