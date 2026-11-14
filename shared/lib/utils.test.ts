import { describe, expect, it } from "vitest"
import { cn, slugify } from "./utils"

describe("cn", () => {
  it("joins class names and skips falsy values", () => {
    expect(cn("a", false && "b", null, undefined, "c")).toBe("a c")
  })

  it("supports conditional object syntax", () => {
    expect(cn("base", { active: true, hidden: false })).toBe("base active")
  })

  it("lets the last conflicting Tailwind utility win", () => {
    expect(cn("px-2 py-1", "px-4")).toBe("py-1 px-4")
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500")
  })

  it("returns an empty string for no input", () => {
    expect(cn()).toBe("")
  })
})

describe("slugify", () => {
  it("lowercases, trims and replaces whitespace with dashes", () => {
    expect(slugify("  Cadena Cubana Gruesa ")).toBe("cadena-cubana-gruesa")
  })

  it("removes characters that are not word characters or dashes", () => {
    expect(slugify("Reloj #1 (Edición!)")).toBe("reloj-1-edicin")
  })

  it("collapses repeated dashes", () => {
    expect(slugify("a - - b")).toBe("a-b")
  })

  it("returns an empty string for empty input", () => {
    expect(slugify("")).toBe("")
  })
})
