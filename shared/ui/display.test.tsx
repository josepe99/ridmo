import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

vi.mock("next/link", async () => await import("@/tests/mocks/next-link"))

import { Badge, badgeVariants } from "./badge"
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "./breadcrumb"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./card"

describe("Badge", () => {
  it("renders its text with the default variant", () => {
    render(<Badge>Nuevo</Badge>)

    expect(screen.getByText("Nuevo")).toHaveClass("bg-primary")
    expect(screen.getByText("Nuevo")).toHaveAttribute("data-slot", "badge")
  })

  it.each([
    ["secondary", "bg-secondary"],
    ["destructive", "bg-destructive"],
    ["outline", "text-foreground"],
  ] as const)("applies the %s variant", (variant, expected) => {
    render(<Badge variant={variant}>x</Badge>)

    expect(screen.getByText("x")).toHaveClass(expected)
  })

  it("can render as a link with asChild", () => {
    render(
      <Badge asChild>
        <a href="/novedades">Novedades</a>
      </Badge>
    )

    expect(screen.getByRole("link", { name: "Novedades" })).toHaveAttribute("data-slot", "badge")
  })

  it("exposes badgeVariants", () => {
    expect(badgeVariants({ variant: "secondary" })).toContain("bg-secondary")
  })
})

describe("Card", () => {
  it("composes header, title, description, content and footer", () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Titulo</CardTitle>
          <CardDescription>Descripcion</CardDescription>
        </CardHeader>
        <CardContent>Contenido</CardContent>
        <CardFooter>Pie</CardFooter>
      </Card>
    )

    for (const text of ["Titulo", "Descripcion", "Contenido", "Pie"]) {
      expect(screen.getByText(text)).toBeInTheDocument()
    }
    expect(screen.getByText("Titulo")).toHaveAttribute("data-slot", "card-title")
  })

  it("merges custom classes", () => {
    render(<Card className="max-w-sm">x</Card>)

    expect(screen.getByText("x")).toHaveClass("max-w-sm")
  })
})

describe("Breadcrumb", () => {
  it("renders a labelled navigation with links and the current page", () => {
    render(
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Inicio</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Cadenas</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    )

    expect(screen.getByRole("navigation", { name: "breadcrumb" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Inicio" })).toHaveAttribute("href", "/")
    expect(screen.getByText("Cadenas")).toHaveAttribute("aria-current", "page")
  })

  it("renders the child element with asChild", () => {
    render(
      <BreadcrumbLink asChild>
        <button type="button">Atras</button>
      </BreadcrumbLink>
    )

    expect(screen.getByRole("button", { name: "Atras" })).toHaveAttribute("data-slot", "breadcrumb-link")
  })

  it("hides decorative separators and ellipsis from assistive tech", () => {
    const { container } = render(
      <ol>
        <BreadcrumbSeparator />
        <BreadcrumbEllipsis />
      </ol>
    )

    for (const element of container.querySelectorAll("[data-slot=breadcrumb-separator], [data-slot=breadcrumb-ellipsis]")) {
      expect(element).toHaveAttribute("aria-hidden", "true")
    }
  })
})
