import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { useState } from "react"
import { describe, expect, it, vi } from "vitest"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select"

function ExampleDialog({ showCloseButton }: { showCloseButton?: boolean }) {
  return (
    <Dialog>
      <DialogTrigger>Abrir</DialogTrigger>
      <DialogContent showCloseButton={showCloseButton}>
        <DialogHeader>
          <DialogTitle>Editar coleccion</DialogTitle>
          <DialogDescription>Cambia los datos</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <button type="button">Guardar</button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

describe("Dialog", () => {
  it("is closed until the trigger is activated", () => {
    render(<ExampleDialog />)

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })

  it("opens with an accessible name and description", async () => {
    render(<ExampleDialog />)

    await userEvent.click(screen.getByRole("button", { name: "Abrir" }))

    const dialog = await screen.findByRole("dialog", { name: "Editar coleccion" })
    expect(dialog).toHaveAccessibleDescription("Cambia los datos")
    expect(screen.getByRole("button", { name: "Guardar" })).toBeInTheDocument()
  })

  it("closes with the close button", async () => {
    render(<ExampleDialog />)
    await userEvent.click(screen.getByRole("button", { name: "Abrir" }))

    await userEvent.click(await screen.findByRole("button", { name: "Close" }))

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
  })

  it("closes with the Escape key", async () => {
    render(<ExampleDialog />)
    await userEvent.click(screen.getByRole("button", { name: "Abrir" }))
    await screen.findByRole("dialog")

    await userEvent.keyboard("{Escape}")

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
  })

  it("can hide the built-in close button", async () => {
    render(<ExampleDialog showCloseButton={false} />)

    await userEvent.click(screen.getByRole("button", { name: "Abrir" }))
    await screen.findByRole("dialog")

    expect(screen.queryByRole("button", { name: "Close" })).not.toBeInTheDocument()
  })
})

describe("Select", () => {
  function ExampleSelect({ onValueChange }: { onValueChange?: (value: string) => void }) {
    const [value, setValue] = useState("")
    return (
      <Select
        value={value}
        onValueChange={(next) => {
          setValue(next)
          onValueChange?.(next)
        }}
      >
        <SelectTrigger aria-label="Coleccion">
          <SelectValue placeholder="Elegi una coleccion" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="cadenas">Cadenas</SelectItem>
          <SelectItem value="relojes">Relojes</SelectItem>
        </SelectContent>
      </Select>
    )
  }

  it("shows the placeholder before a value is chosen", () => {
    render(<ExampleSelect />)

    expect(screen.getByRole("combobox", { name: "Coleccion" })).toHaveTextContent("Elegi una coleccion")
  })

  it("lists the options when opened and reports the selection", async () => {
    const onValueChange = vi.fn()
    render(<ExampleSelect onValueChange={onValueChange} />)

    await userEvent.click(screen.getByRole("combobox"))
    expect(await screen.findAllByRole("option")).toHaveLength(2)
    await userEvent.click(screen.getByRole("option", { name: "Relojes" }))

    expect(onValueChange).toHaveBeenCalledWith("relojes")
    await waitFor(() => expect(screen.getByRole("combobox")).toHaveTextContent("Relojes"))
  })

  it("does not open when disabled", async () => {
    render(
      <Select disabled>
        <SelectTrigger aria-label="Coleccion">
          <SelectValue placeholder="Elegi" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="a">A</SelectItem>
        </SelectContent>
      </Select>
    )

    await userEvent.click(screen.getByRole("combobox"))

    expect(screen.queryByRole("option")).not.toBeInTheDocument()
  })
})
