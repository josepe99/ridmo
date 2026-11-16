import { describe, expect, it } from "vitest"
import { DEFAULT_MAP_CENTER, MAP_LOCATION_STREET, buildMapLocationUrl, hasMapLocation } from "./map-location"

describe("buildMapLocationUrl", () => {
  it("links to the OpenStreetMap marker and view of the point", () => {
    expect(buildMapLocationUrl(-25.2637, -57.5759)).toBe(
      "https://www.openstreetmap.org/?mlat=-25.2637&mlon=-57.5759#map=18/-25.2637/-57.5759"
    )
  })

  it("rounds to 6 decimals and never uses exponent notation", () => {
    expect(buildMapLocationUrl(-25.123456789, 0.0000001)).toBe(
      "https://www.openstreetmap.org/?mlat=-25.123457&mlon=0#map=18/-25.123457/0"
    )
  })

  it("never prints a negative zero", () => {
    expect(buildMapLocationUrl(-0, -0)).toBe("https://www.openstreetmap.org/?mlat=0&mlon=0#map=18/0/0")
  })
})

describe("hasMapLocation", () => {
  it("is true only when both coordinates are finite numbers", () => {
    expect(hasMapLocation({ latitude: -25.2, longitude: -57.5 })).toBe(true)
    expect(hasMapLocation({ latitude: 0, longitude: 0 })).toBe(true)
    expect(hasMapLocation({ latitude: null, longitude: null })).toBe(false)
    expect(hasMapLocation({ latitude: -25.2, longitude: null })).toBe(false)
    expect(hasMapLocation({ latitude: undefined, longitude: undefined })).toBe(false)
    expect(hasMapLocation({ latitude: Number.NaN, longitude: 1 })).toBe(false)
  })
})

describe("map location constants", () => {
  it("centers on Asunción and names the stored street for map orders", () => {
    expect(DEFAULT_MAP_CENTER).toEqual({ lat: -25.2637, lng: -57.5759 })
    expect(MAP_LOCATION_STREET).toBe("Ubicación marcada en el mapa")
  })
})
