import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("../services/current-user", () => ({ requireAdmin: vi.fn() }))
vi.mock("../services/set-user-role", () => ({ changeUserRole: vi.fn() }))

import { revalidatePath } from "next/cache"
import { AuthorizationError } from "../errors"
import { requireAdmin } from "../services/current-user"
import { changeUserRole } from "../services/set-user-role"
import { setUserRoleAction } from "./set-user-role.action"

const TARGET = "64b7f0a0a0a0a0a0a0a0a0a2"

beforeEach(() => {
  vi.mocked(requireAdmin).mockReset().mockResolvedValue("admin-1")
  vi.mocked(changeUserRole).mockReset().mockResolvedValue({ ok: true, changed: true })
  vi.mocked(revalidatePath).mockClear()
})

describe("setUserRoleAction", () => {
  it("denies a non-admin before the service runs (throws the authorization error)", async () => {
    vi.mocked(requireAdmin).mockRejectedValue(new AuthorizationError("FORBIDDEN"))
    await expect(setUserRoleAction(TARGET, "ADMIN")).rejects.toMatchObject({ code: "FORBIDDEN" })
    expect(changeUserRole).not.toHaveBeenCalled()
  })

  it("denies anonymous callers", async () => {
    vi.mocked(requireAdmin).mockRejectedValue(new AuthorizationError("UNAUTHENTICATED"))
    await expect(setUserRoleAction(TARGET, "ADMIN")).rejects.toMatchObject({ code: "UNAUTHENTICATED" })
    expect(changeUserRole).not.toHaveBeenCalled()
  })

  it("takes the actor from the session, never from the arguments", async () => {
    await setUserRoleAction(TARGET, "ADMIN")
    expect(changeUserRole).toHaveBeenCalledWith({ actorId: "admin-1", targetId: TARGET, role: "ADMIN" })
  })

  it("passes unvalidated input through so the service can reject it", async () => {
    vi.mocked(changeUserRole).mockResolvedValue({ ok: false, code: "INVALID_INPUT" })
    await expect(setUserRoleAction(TARGET, "ROOT")).resolves.toMatchObject({ ok: false, code: "INVALID_INPUT" })
  })

  it("revalidates the users page after a change but not after a refusal", async () => {
    await setUserRoleAction(TARGET, "ADMIN")
    expect(revalidatePath).toHaveBeenCalledWith("/admin/users")

    vi.mocked(revalidatePath).mockClear()
    vi.mocked(changeUserRole).mockResolvedValue({ ok: false, code: "LAST_ADMIN" })
    await setUserRoleAction(TARGET, "USER")
    expect(revalidatePath).not.toHaveBeenCalled()
  })

  it("returns a Spanish message for each refusal and never internal details", async () => {
    for (const code of ["SELF_CHANGE", "NOT_FOUND", "LAST_ADMIN", "FORBIDDEN", "INVALID_INPUT", "CONFLICT"] as const) {
      vi.mocked(changeUserRole).mockResolvedValue({ ok: false, code })
      const result = await setUserRoleAction(TARGET, "USER")
      expect(result).toMatchObject({ ok: false, code })
      expect((result as { message: string }).message).toMatch(/[a-záéíóú]{4,}/i)
    }
  })
})
