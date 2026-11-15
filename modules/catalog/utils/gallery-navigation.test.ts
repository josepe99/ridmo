import { describe, expect, it } from "vitest"
import { stepIndex } from "./gallery-navigation"

describe("stepIndex", () => {
  it("moves forward and backward inside the list", () => {
    expect(stepIndex(0, 1, 3)).toBe(1)
    expect(stepIndex(2, -1, 3)).toBe(1)
  })

  it("wraps around at both ends", () => {
    expect(stepIndex(2, 1, 3)).toBe(0)
    expect(stepIndex(0, -1, 3)).toBe(2)
  })

  it("wraps steps larger than the list", () => {
    expect(stepIndex(0, -4, 3)).toBe(2)
    expect(stepIndex(1, 7, 3)).toBe(2)
  })

  it("stays on the only image", () => {
    expect(stepIndex(0, 1, 1)).toBe(0)
    expect(stepIndex(0, -1, 1)).toBe(0)
  })

  it("returns 0 for an empty list", () => {
    expect(stepIndex(0, 1, 0)).toBe(0)
    expect(stepIndex(0, -1, 0)).toBe(0)
  })
})
