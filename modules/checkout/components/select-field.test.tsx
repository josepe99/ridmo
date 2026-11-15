import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { useForm } from "react-hook-form"
import { describe, expect, it, vi } from "vitest"
import { SelectField } from "./select-field"

const OPTIONS = ["Paraguay", "Argentina", "Brasil"]

type Props = Partial<Parameters<typeof SelectField>[0]>

function Harness({ onValue, ...props }: Props & { onValue?: (value: string) => void }) {
  const { register, watch } = useForm<{ field: string }>({ defaultValues: { field: "Paraguay" } })
  onValue?.(watch("field"))
  return <SelectField id="field" label="País" options={OPTIONS} registration={register("field")} {...props} />
}

describe("SelectField", () => {
  it("is a labelled combobox with every option in the given order", () => {
    render(<Harness />)

    const select = screen.getByLabelText("País")
    expect(select.tagName).toBe("SELECT")
    expect(screen.getAllByRole("option").map((option) => option.textContent)).toEqual(OPTIONS)
  })

  it("starts on the form default value", () => {
    render(<Harness />)

    expect(screen.getByLabelText("País")).toHaveValue("Paraguay")
  })

  it("is reachable with Tab and registers the choice with react-hook-form", async () => {
    const onValue = vi.fn()
    const user = userEvent.setup()
    render(<Harness onValue={onValue} />)

    await user.tab()
    expect(screen.getByLabelText("País")).toHaveFocus()
    await user.selectOptions(screen.getByLabelText("País"), "Argentina")

    expect(screen.getByLabelText("País")).toHaveValue("Argentina")
    expect(onValue).toHaveBeenLastCalledWith("Argentina")
  })

  it("links an error to the control with aria-invalid and aria-describedby", () => {
    render(<Harness error="Elegí un país de la lista" />)

    const select = screen.getByLabelText("País")
    expect(select).toHaveAttribute("aria-invalid", "true")
    expect(select).toHaveAccessibleDescription("Elegí un país de la lista")
    expect(screen.getByRole("alert")).toHaveTextContent("Elegí un país de la lista")
  })

  it("has no aria-invalid without an error", () => {
    render(<Harness />)

    expect(screen.getByLabelText("País")).not.toHaveAttribute("aria-invalid")
  })

  it("renders options with a separate value and visible label", async () => {
    const user = userEvent.setup()
    render(
      <Harness
        options={[
          { value: "asuncion", label: "Asunción · Gs. 20.000" },
          { value: "lambare", label: "Lambaré · Gs. 15.000" },
        ]}
      />
    )

    expect(screen.getAllByRole("option").map((option) => option.textContent)).toEqual([
      "Asunción · Gs. 20.000",
      "Lambaré · Gs. 15.000",
    ])
    await user.selectOptions(screen.getByLabelText("País"), "Lambaré · Gs. 15.000")
    expect(screen.getByLabelText("País")).toHaveValue("lambare")
  })

  it("shows a placeholder with an empty value first when asked", () => {
    render(<Harness options={[{ value: "a", label: "A" }]} placeholder="Elegí una zona" />)

    const options = screen.getAllByRole("option")
    expect(options.map((option) => option.textContent)).toEqual(["Elegí una zona", "A"])
    expect(options[0]).toHaveAttribute("value", "")
  })

  it("passes the autocomplete token to the browser", () => {
    render(<Harness autoComplete="country-name" />)

    expect(screen.getByLabelText("País")).toHaveAttribute("autocomplete", "country-name")
  })
})
