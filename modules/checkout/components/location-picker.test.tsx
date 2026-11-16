import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { LocationPicker } from "./location-picker"

describe("LocationPicker (Leaflet in jsdom)", () => {
  it("renders a labelled map region with the OpenStreetMap attribution and no pin until one is marked", () => {
    const { container } = render(<LocationPicker value={null} onChange={vi.fn()} describedBy="location-help" />)

    const region = screen.getByRole("group", { name: "Mapa para marcar la ubicación de entrega" })
    expect(region).toHaveAttribute("aria-describedby", "location-help")
    expect(container.querySelector(".leaflet-container")).not.toBeNull()
    expect(screen.getByRole("link", { name: "OpenStreetMap" })).toHaveAttribute(
      "href",
      "https://www.openstreetmap.org/copyright"
    )
    expect(container.querySelector(".leaflet-marker-icon")).toBeNull()
  })

  it("draws the pin with the inline SVG icon, not Leaflet's default image", () => {
    const { container } = render(<LocationPicker value={{ lat: -25.28, lng: -57.63 }} onChange={vi.fn()} />)

    const marker = container.querySelector(".leaflet-marker-icon")
    expect(marker).not.toBeNull()
    expect(marker?.querySelector("svg")).not.toBeNull()
    expect(marker?.tagName).toBe("DIV")
    expect(container.querySelector("img.leaflet-marker-icon")).toBeNull()
  })

  it("loads tiles only from the OpenStreetMap tile server", () => {
    const { container } = render(<LocationPicker value={null} onChange={vi.fn()} />)

    const sources = Array.from(container.querySelectorAll("img.leaflet-tile")).map((img) => img.getAttribute("src"))
    for (const src of sources) expect(src).toMatch(/^https:\/\/tile\.openstreetmap\.org\/\d+\/\d+\/\d+\.png$/)
  })

  it("reports a click on the map as a rounded point", () => {
    const onChange = vi.fn()
    const { container } = render(<LocationPicker value={null} onChange={onChange} />)

    fireEvent.click(container.querySelector(".leaflet-container") as HTMLElement, { clientX: 0, clientY: 0 })

    expect(onChange).toHaveBeenCalledTimes(1)
    const point = onChange.mock.calls[0][0]
    expect(Number.isFinite(point.lat)).toBe(true)
    expect(Number.isFinite(point.lng)).toBe(true)
    expect(point.lat).toBe(Number(point.lat.toFixed(6)))
    expect(point.lng).toBe(Number(point.lng.toFixed(6)))
  })
})
