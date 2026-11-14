import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { resetNavigationMock, routerMock } from "@/tests/mocks/next-navigation"

vi.mock("next/navigation", async () => await import("@/tests/mocks/next-navigation"))
// The server action (and with it the admin gate) is replaced at the module boundary.
vi.mock("../actions/update-order-status.action", () => ({ updateOrderStatusAction: vi.fn() }))

import { updateOrderStatusAction } from "../actions/update-order-status.action"
import { OrderStatusActions } from "./order-status-actions"

beforeEach(() => {
  resetNavigationMock()
  vi.mocked(updateOrderStatusAction).mockReset()
})

describe("OrderStatusActions", () => {
  it.each([
    ["PENDING_PAYMENT", ["Confirmar pago", "Cancelar pedido"]],
    ["PAYMENT_CONFIRMED", ["Marcar como enviado", "Cancelar pedido"]],
    ["SHIPPED", ["Marcar como entregado"]],
  ] as const)("offers only the allowed transitions for %s", (status, labels) => {
    render(<OrderStatusActions orderId="o1" status={status} />)

    expect(screen.getAllByRole("button").map((button) => button.textContent)).toEqual(labels)
  })

  it.each(["DELIVERED", "CANCELLED"] as const)("offers no buttons for the terminal status %s", (status) => {
    render(<OrderStatusActions orderId="o1" status={status} />)

    expect(screen.queryByRole("button")).not.toBeInTheDocument()
    expect(screen.getByText("Este pedido ya no admite más cambios de estado.")).toBeInTheDocument()
  })

  it("changes the status and refreshes the page on success", async () => {
    vi.mocked(updateOrderStatusAction).mockResolvedValue({ ok: true, status: "PAYMENT_CONFIRMED" })
    render(<OrderStatusActions orderId="o1" status="PENDING_PAYMENT" />)

    await userEvent.click(screen.getByRole("button", { name: "Confirmar pago" }))

    await waitFor(() => expect(routerMock.refresh).toHaveBeenCalled())
    expect(updateOrderStatusAction).toHaveBeenCalledWith("o1", "PAYMENT_CONFIRMED")
  })

  it.each([
    ["NOT_FOUND", "El pedido ya no existe."],
    ["INVALID_TRANSITION", "Ese cambio de estado no está permitido."],
    ["CONFLICT", "El pedido cambió mientras lo editabas. Recargá la página e intentá de nuevo."],
    ["INVALID_INPUT", "Datos inválidos."],
  ] as const)("explains the %s failure", async (code, message) => {
    vi.mocked(updateOrderStatusAction).mockResolvedValue({ ok: false, code })
    render(<OrderStatusActions orderId="o1" status="PENDING_PAYMENT" />)

    await userEvent.click(screen.getByRole("button", { name: "Confirmar pago" }))

    expect(await screen.findByRole("alert")).toHaveTextContent(message)
    expect(routerMock.refresh).not.toHaveBeenCalled()
  })

  describe("cancelling", () => {
    it("asks for confirmation and does nothing when declined", async () => {
      const confirm = vi.spyOn(window, "confirm").mockReturnValue(false)
      render(<OrderStatusActions orderId="o1" status="PENDING_PAYMENT" />)

      await userEvent.click(screen.getByRole("button", { name: "Cancelar pedido" }))

      expect(confirm).toHaveBeenCalledWith("¿Cancelar este pedido? Las unidades volverán al inventario.")
      expect(updateOrderStatusAction).not.toHaveBeenCalled()
    })

    it("cancels the order once confirmed", async () => {
      vi.spyOn(window, "confirm").mockReturnValue(true)
      vi.mocked(updateOrderStatusAction).mockResolvedValue({ ok: true, status: "CANCELLED" })
      render(<OrderStatusActions orderId="o1" status="PENDING_PAYMENT" />)

      await userEvent.click(screen.getByRole("button", { name: "Cancelar pedido" }))

      await waitFor(() => expect(updateOrderStatusAction).toHaveBeenCalledWith("o1", "CANCELLED"))
    })

    it("does not ask for confirmation on non-destructive transitions", async () => {
      const confirm = vi.spyOn(window, "confirm").mockReturnValue(true)
      vi.mocked(updateOrderStatusAction).mockResolvedValue({ ok: true, status: "SHIPPED" })
      render(<OrderStatusActions orderId="o1" status="PAYMENT_CONFIRMED" />)

      await userEvent.click(screen.getByRole("button", { name: "Marcar como enviado" }))

      expect(confirm).not.toHaveBeenCalled()
    })
  })
})
