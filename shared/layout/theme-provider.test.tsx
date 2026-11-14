import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { ThemeProvider } from "./theme-provider"

describe("ThemeProvider", () => {
  it("renders its children", () => {
    render(
      <ThemeProvider attribute="class" defaultTheme="light">
        <p>contenido</p>
      </ThemeProvider>
    )

    expect(screen.getByText("contenido")).toBeInTheDocument()
  })
})
