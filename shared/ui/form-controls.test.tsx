import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { useState } from "react"
import { describe, expect, it, vi } from "vitest"
import { Input } from "./input"
import { Label } from "./label"
import { Switch } from "./switch"
import { Textarea } from "./textarea"

describe("Input", () => {
  it("accepts typing and reports changes", async () => {
    const onChange = vi.fn()
    render(<Input aria-label="Nombre" onChange={onChange} />)

    await userEvent.type(screen.getByLabelText("Nombre"), "Ana")

    expect(screen.getByLabelText("Nombre")).toHaveValue("Ana")
    expect(onChange).toHaveBeenCalledTimes(3)
  })

  it("forwards the type and placeholder", () => {
    render(<Input type="email" placeholder="tu@email.com" />)

    const input = screen.getByPlaceholderText("tu@email.com")
    expect(input).toHaveAttribute("type", "email")
    expect(input).toHaveAttribute("data-slot", "input")
  })

  it("cannot be edited when disabled", async () => {
    render(<Input aria-label="Nombre" disabled />)

    await userEvent.type(screen.getByLabelText("Nombre"), "Ana")

    expect(screen.getByLabelText("Nombre")).toHaveValue("")
  })

  it("merges custom classes", () => {
    render(<Input aria-label="x" className="max-w-xs" />)

    expect(screen.getByLabelText("x")).toHaveClass("max-w-xs")
  })
})

describe("Textarea", () => {
  it("accepts multi-line text", async () => {
    render(<Textarea aria-label="Notas" />)

    await userEvent.type(screen.getByLabelText("Notas"), "uno{enter}dos")

    expect(screen.getByLabelText("Notas")).toHaveValue("uno\ndos")
  })

  it("forwards props and merges classes", () => {
    render(<Textarea aria-label="Notas" rows={5} className="h-40" />)

    const textarea = screen.getByLabelText("Notas")
    expect(textarea).toHaveAttribute("rows", "5")
    expect(textarea).toHaveClass("h-40")
  })
})

describe("Label", () => {
  it("focuses its input when clicked", async () => {
    render(
      <>
        <Label htmlFor="nombre">Nombre</Label>
        <Input id="nombre" />
      </>
    )

    await userEvent.click(screen.getByText("Nombre"))

    expect(screen.getByLabelText("Nombre")).toHaveFocus()
  })
})

describe("Switch", () => {
  function Controlled() {
    const [checked, setChecked] = useState(false)
    return (
      <>
        <Switch aria-label="Activo" checked={checked} onCheckedChange={setChecked} />
        <output>{checked ? "on" : "off"}</output>
      </>
    )
  }

  it("toggles on click and reflects the state to assistive tech", async () => {
    render(<Controlled />)
    const toggle = screen.getByRole("switch", { name: "Activo" })
    expect(toggle).not.toBeChecked()

    await userEvent.click(toggle)

    expect(toggle).toBeChecked()
    expect(screen.getByText("on")).toBeInTheDocument()
  })

  it("toggles with the keyboard", async () => {
    render(<Controlled />)

    await userEvent.tab()
    await userEvent.keyboard(" ")

    expect(screen.getByRole("switch")).toBeChecked()
  })

  it("ignores clicks when disabled", async () => {
    const onCheckedChange = vi.fn()
    render(<Switch aria-label="Activo" disabled onCheckedChange={onCheckedChange} />)

    await userEvent.click(screen.getByRole("switch"))

    expect(onCheckedChange).not.toHaveBeenCalled()
  })
})
