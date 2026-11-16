import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { MapLocationLink } from "./map-location-link"

describe("MapLocationLink", () => {
  it("opens the OpenStreetMap marker of the point in a new tab", () => {
    render(<MapLocationLink latitude={-25.2637} longitude={-57.5759} />)

    const link = screen.getByRole("link", { name: "Ver ubicación en el mapa" })
    expect(link).toHaveAttribute(
      "href",
      "https://www.openstreetmap.org/?mlat=-25.2637&mlon=-57.5759#map=18/-25.2637/-57.5759"
    )
    expect(link).toHaveAttribute("target", "_blank")
    expect(link.getAttribute("rel")).toContain("noopener")
    expect(link.getAttribute("rel")).toContain("noreferrer")
  })

  it.each([
    [null, null],
    [undefined, undefined],
    [-25.2, null],
    [null, -57.5],
    [Number.NaN, -57.5],
  ])("renders nothing without a complete point (%j, %j)", (latitude, longitude) => {
    const { container } = render(<MapLocationLink latitude={latitude} longitude={longitude} />)

    expect(container).toBeEmptyDOMElement()
  })

  it("accepts a custom class", () => {
    render(<MapLocationLink latitude={0} longitude={0} className="extra" />)

    expect(screen.getByRole("link")).toHaveClass("extra")
  })
})
