import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { Button, buttonVariants } from "./button"

describe("Button", () => {
  it("renders a button that fires onClick", async () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Guardar</Button>)

    await userEvent.click(screen.getByRole("button", { name: "Guardar" }))

    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it("does not fire onClick when disabled", async () => {
    const onClick = vi.fn()
    render(
      <Button disabled onClick={onClick}>
        Guardar
      </Button>
    )

    await userEvent.click(screen.getByRole("button"))

    expect(onClick).not.toHaveBeenCalled()
  })

  it.each([
    ["default", "bg-primary"],
    ["destructive", "bg-destructive"],
    ["outline", "border"],
    ["secondary", "bg-secondary"],
    ["ghost", "hover:bg-accent"],
    ["link", "underline-offset-4"],
  ] as const)("applies the %s variant styles", (variant, expected) => {
    render(<Button variant={variant}>x</Button>)

    expect(screen.getByRole("button")).toHaveClass(expected)
  })

  it.each([
    ["default", "h-9"],
    ["sm", "h-8"],
    ["lg", "h-10"],
    ["icon", "size-9"],
  ] as const)("applies the %s size", (size, expected) => {
    render(<Button size={size}>x</Button>)

    expect(screen.getByRole("button")).toHaveClass(expected)
  })

  it("uses the default variant and size when none is given", () => {
    render(<Button>x</Button>)

    expect(screen.getByRole("button")).toHaveClass("bg-primary", "h-9")
  })

  it("lets custom classes override conflicting utilities", () => {
    render(<Button className="h-20 bg-red-600">x</Button>)

    const button = screen.getByRole("button")
    expect(button).toHaveClass("h-20", "bg-red-600")
    expect(button).not.toHaveClass("h-9")
    expect(button).not.toHaveClass("bg-primary")
  })

  it("renders the child element instead of a button with asChild", () => {
    render(
      <Button asChild>
        <a href="/cart">Ir al carrito</a>
      </Button>
    )

    const link = screen.getByRole("link", { name: "Ir al carrito" })
    expect(link).toHaveAttribute("href", "/cart")
    expect(link).toHaveAttribute("data-slot", "button")
    expect(screen.queryByRole("button")).not.toBeInTheDocument()
  })

  it("exposes buttonVariants for styling other elements", () => {
    expect(buttonVariants({ variant: "outline", size: "sm" })).toContain("h-8")
  })
})
