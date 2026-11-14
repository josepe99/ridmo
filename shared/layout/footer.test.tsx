import { render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import Footer from "./footer"

afterEach(() => vi.useRealTimers())

describe("Footer", () => {
  it("renders a contentinfo landmark with the copyright for the current year", () => {
    vi.useFakeTimers({ toFake: ["Date"] })
    vi.setSystemTime(new Date("2031-06-01T12:00:00Z"))

    render(<Footer />)

    expect(screen.getByRole("contentinfo")).toHaveTextContent("© 2031 RIDMO. Todos los derechos reservados.")
  })
})
