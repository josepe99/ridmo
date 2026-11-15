import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { INTERNATIONAL_SHIPPING_ADMIN_NOTICE, INTERNATIONAL_SHIPPING_NOTICE } from "../domain/shipping-countries"
import { InternationalShippingNotice } from "./international-shipping-notice"

describe("InternationalShippingNotice", () => {
  it.each(["Paraguay", " paraguay ", "", null, undefined])("renders nothing for the domestic destination %j", (country) => {
    const { container } = render(<InternationalShippingNotice country={country} />)

    expect(container).toBeEmptyDOMElement()
  })

  it("shows the customer wording for another country", () => {
    render(<InternationalShippingNotice country="Argentina" />)

    expect(screen.getByRole("note")).toHaveTextContent(INTERNATIONAL_SHIPPING_NOTICE)
  })

  it("shows the admin wording when asked", () => {
    render(<InternationalShippingNotice country="Argentina" audience="admin" />)

    expect(screen.getByRole("note")).toHaveTextContent(INTERNATIONAL_SHIPPING_ADMIN_NOTICE)
  })

  it("can name the destination", () => {
    render(<InternationalShippingNotice country="Brasil" showCountry />)

    expect(screen.getByText("Envío a Brasil")).toBeInTheDocument()
  })

  it("does not name the destination by default", () => {
    render(<InternationalShippingNotice country="Brasil" />)

    expect(screen.queryByText(/Brasil/)).not.toBeInTheDocument()
  })
})
