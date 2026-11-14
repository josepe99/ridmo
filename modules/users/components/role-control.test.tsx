import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("../actions/set-user-role.action", () => ({ setUserRoleAction: vi.fn() }))

import { setUserRoleAction } from "../actions/set-user-role.action"
import { RoleControl } from "./role-control"

const USER_ID = "64b7f0a0a0a0a0a0a0a0a0a2"

beforeEach(() => {
  vi.mocked(setUserRoleAction).mockReset()
  vi.stubGlobal("confirm", vi.fn(() => true))
})

describe("RoleControl", () => {
  it("offers promotion for a customer and sends the target role", async () => {
    vi.mocked(setUserRoleAction).mockResolvedValue({ ok: true, changed: true })
    render(<RoleControl userId={USER_ID} role="USER" isSelf={false} />)

    await userEvent.setup().click(screen.getByRole("button", { name: "Hacer administrador" }))
    await waitFor(() => expect(setUserRoleAction).toHaveBeenCalledWith(USER_ID, "ADMIN"))
  })

  it("offers demotion for an admin", async () => {
    vi.mocked(setUserRoleAction).mockResolvedValue({ ok: true, changed: true })
    render(<RoleControl userId={USER_ID} role="ADMIN" isSelf={false} />)

    await userEvent.setup().click(screen.getByRole("button", { name: "Quitar administrador" }))
    await waitFor(() => expect(setUserRoleAction).toHaveBeenCalledWith(USER_ID, "USER"))
  })

  it("does nothing when the confirmation is declined", async () => {
    vi.stubGlobal("confirm", vi.fn(() => false))
    render(<RoleControl userId={USER_ID} role="USER" isSelf={false} />)
    await userEvent.setup().click(screen.getByRole("button", { name: "Hacer administrador" }))
    expect(setUserRoleAction).not.toHaveBeenCalled()
  })

  it("disables the control on the signed-in admin's own row", () => {
    render(<RoleControl userId={USER_ID} role="ADMIN" isSelf />)
    expect(screen.getByRole("button", { name: "Quitar administrador" })).toBeDisabled()
  })

  it("shows the refusal message (e.g. last admin) in an alert", async () => {
    vi.mocked(setUserRoleAction).mockResolvedValue({
      ok: false,
      code: "LAST_ADMIN",
      message: "No se puede quitar el rol al último administrador.",
    })
    render(<RoleControl userId={USER_ID} role="ADMIN" isSelf={false} />)
    await userEvent.setup().click(screen.getByRole("button", { name: "Quitar administrador" }))
    expect(await screen.findByRole("alert")).toHaveTextContent("último administrador")
  })

  it("shows a generic message when the action throws (e.g. lost admin rights)", async () => {
    vi.mocked(setUserRoleAction).mockRejectedValue(new Error("FORBIDDEN"))
    render(<RoleControl userId={USER_ID} role="USER" isSelf={false} />)
    await userEvent.setup().click(screen.getByRole("button", { name: "Hacer administrador" }))
    expect(await screen.findByRole("alert")).toHaveTextContent(/No se pudo cambiar el rol/)
  })
})
