import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import Price from "./price"

describe("Price", () => {
  it("formats the value as guaranies with dot separators", () => {
    render(<Price value={6_800_000} />)

    expect(screen.getByText("Gs. 6.800.000")).toBeInTheDocument()
  })

  it("rounds to whole guaranies", () => {
    render(<Price value={1234.6} />)

    expect(screen.getByText("Gs. 1.235")).toBeInTheDocument()
  })

  it("uses the shared guarani formatter without any display rounding", () => {
    render(<Price value={3_900_001} />)

    expect(screen.getByText("Gs. 3.900.001")).toBeInTheDocument()
  })

  it("never renders a negative price", () => {
    render(<Price value={-500} />)

    expect(screen.getByText("Gs. 0")).toBeInTheDocument()
  })

  it("renders zero", () => {
    render(<Price value={0} />)

    expect(screen.getByText("Gs. 0")).toBeInTheDocument()
  })

  it.each([Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])(
    "renders nothing for the non-finite value %s",
    (value) => {
      const { container } = render(<Price value={value} />)

      expect(container).toBeEmptyDOMElement()
    }
  )

  it("always applies the display font and merges extra classes", () => {
    render(<Price value={100} className="text-xs mt-1" />)

    expect(screen.getByText("Gs. 100")).toHaveClass("font-display", "text-xs", "mt-1")
  })
})
