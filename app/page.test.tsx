import { render, screen } from "@testing-library/react"
import type { ReactElement } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("next/image", async () => await import("@/tests/mocks/next-image"))
vi.mock("next/link", async () => await import("@/tests/mocks/next-link"))
vi.mock("@/modules/catalog/server", () => ({ getActiveCollectionsWithProducts: vi.fn() }))

import { getActiveCollectionsWithProducts } from "@/modules/catalog/server"
import HomePage, { metadata, revalidate } from "./page"

const product = (n: number) => ({
  id: `p${n}`,
  name: `Producto ${n}`,
  slug: `producto-${n}`,
  price: 1000,
  image: null,
})

const collection = (n: number, productCount: number) => ({
  id: `c${n}`,
  name: `Coleccion ${n}`,
  slug: `coleccion-${n}`,
  description: `Descripcion ${n}`,
  imageUrl: null,
  products: Array.from({ length: productCount }, (_, i) => product(n * 10 + i)),
})

/**
 * The page wraps an async server component in <Suspense>. React Testing Library cannot await
 * async components, so the inner component is resolved by hand and its output is rendered.
 */
async function renderHomeContent() {
  const suspense = HomePage() as ReactElement<{ children: ReactElement<unknown, () => Promise<ReactElement>> }>
  const content = await suspense.props.children.type()
  return render(content)
}

beforeEach(() => {
  vi.mocked(getActiveCollectionsWithProducts).mockReset()
})

describe("home page", () => {
  it("revalidates every minute and is indexable with a canonical Open Graph card", () => {
    expect(revalidate).toBe(60)
    expect(metadata.robots).toMatchObject({ index: true, follow: true })
    expect(metadata.openGraph).toMatchObject({ siteName: "RIDMO", locale: "es_PY" })
  })

  it("shows the hero for the first collection and a grid per collection that has products", async () => {
    vi.mocked(getActiveCollectionsWithProducts).mockResolvedValue([collection(1, 2), collection(2, 0), collection(3, 1)])

    await renderHomeContent()

    expect(screen.getByText("COLECCION 1")).toBeInTheDocument()
    expect(screen.getByRole("heading", { level: 2, name: "Coleccion 1" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { level: 2, name: "Coleccion 3" })).toBeInTheDocument()
    expect(screen.queryByRole("heading", { level: 2, name: "Coleccion 2" })).not.toBeInTheDocument()
    expect(screen.getAllByText(/^Producto \d+$/)).toHaveLength(3)
  })

  it("shows a skeleton while the collections load", () => {
    const { container } = render(<HomePage />)

    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0)
  })

  it("renders nothing but no error when there are no collections", async () => {
    vi.mocked(getActiveCollectionsWithProducts).mockResolvedValue([])

    const { container } = await renderHomeContent()

    expect(container.querySelector("section")).toBeNull()
  })
})
