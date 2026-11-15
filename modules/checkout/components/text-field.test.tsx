import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { useForm } from "react-hook-form"
import { describe, expect, it, vi } from "vitest"
import { TextField } from "./text-field"

type Props = Partial<Parameters<typeof TextField>[0]>

function Harness({ onValue, ...props }: Props & { onValue?: (value: string) => void }) {
  const { register, watch } = useForm<{ field: string }>({ defaultValues: { field: "" } })
  onValue?.(watch("field"))
  return <TextField id="field" label="Nombre" registration={register("field")} {...props} />
}

describe("TextField", () => {
  it("associates the label with the input", () => {
    render(<Harness />)

    expect(screen.getByLabelText("Nombre")).toBeInTheDocument()
  })

  it("registers the input with react-hook-form", async () => {
    const onValue = vi.fn()
    render(<Harness onValue={onValue} />)

    await userEvent.type(screen.getByLabelText("Nombre"), "Ana")

    expect(onValue).toHaveBeenLastCalledWith("Ana")
  })

  it("can be read only: the value is shown but cannot be typed over", async () => {
    const onValue = vi.fn()
    render(<Harness readOnly onValue={onValue} />)

    const input = screen.getByLabelText("Nombre")
    expect(input).toHaveAttribute("readonly")
    await userEvent.type(input, "Ana")

    expect(input).toHaveValue("")
  })

  it("is editable by default", () => {
    render(<Harness />)

    expect(screen.getByLabelText("Nombre")).not.toHaveAttribute("readonly")
  })

  it("marks the optional fields", () => {
    render(<Harness optional />)

    expect(screen.getByText("Opcional")).toBeInTheDocument()
  })

  it("does not mark required fields as optional", () => {
    render(<Harness />)

    expect(screen.queryByText("Opcional")).not.toBeInTheDocument()
  })

  it("is valid and silent when there is no error", () => {
    render(<Harness />)

    const input = screen.getByLabelText("Nombre")
    expect(input).not.toHaveAttribute("aria-invalid")
    expect(input).not.toHaveAttribute("aria-describedby")
    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
  })

  it("exposes the error to assistive tech", () => {
    render(<Harness error="Completá este campo" />)

    const input = screen.getByLabelText("Nombre")
    expect(input).toHaveAttribute("aria-invalid", "true")
    expect(screen.getByRole("alert")).toHaveTextContent("Completá este campo")
    expect(input).toHaveAccessibleDescription("Completá este campo")
  })

  it("renders a textarea when multiline", () => {
    render(<Harness multiline />)

    expect(screen.getByLabelText("Nombre").tagName).toBe("TEXTAREA")
  })

  it("passes type, inputMode, autoComplete and placeholder to the input", () => {
    render(<Harness type="tel" inputMode="tel" autoComplete="tel" placeholder="+595" />)

    const input = screen.getByLabelText("Nombre")
    expect(input).toHaveAttribute("type", "tel")
    expect(input).toHaveAttribute("inputmode", "tel")
    expect(input).toHaveAttribute("autocomplete", "tel")
    expect(input).toHaveAttribute("placeholder", "+595")
  })

  it("applies extra classes to the wrapper", () => {
    const { container } = render(<Harness className="sm:col-span-2" />)

    expect(container.firstChild).toHaveClass("sm:col-span-2")
  })
})
