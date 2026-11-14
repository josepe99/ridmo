import "server-only"

import { Prisma } from "@prisma/client"
import { prisma } from "@/shared/lib/prisma"
import { OBJECT_ID_PATTERN, roleSchema, type Role } from "../domain/roles"

export type ChangeRoleResult =
  | { ok: true; changed: boolean }
  | { ok: false; code: "INVALID_INPUT" | "SELF_CHANGE" | "NOT_FOUND" | "FORBIDDEN" | "LAST_ADMIN" | "CONFLICT" }

type ChangeRoleInput = { actorId: string; targetId: string; role: unknown }

const MAX_ATTEMPTS = 3
/** Singleton document every role change writes first, to serialise concurrent changes. */
const ROLE_LOCK_ID = "role-change-lock"

class Refusal extends Error {
  constructor(readonly code: Extract<ChangeRoleResult, { ok: false }>["code"]) {
    super(code)
  }
}

function isWriteConflict(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034"
}

/**
 * Promotes or demotes a user. Authorization (the actor is an admin) is enforced by the
 * caller via `requireAdmin` AND re-verified inside the transaction.
 *
 * Rules: the role must be a known value; an admin cannot change their own role; the target
 * must exist; the last remaining (enabled) ADMIN cannot be demoted.
 *
 * Atomicity: the last-admin check and the update run in one transaction that first touches a
 * shared lock document. MongoDB snapshot isolation alone would let two admins demote each
 * other concurrently (write skew: each sees 2 admins and writes a different document). With
 * the shared write, the second transaction hits a write conflict (P2034) and is retried
 * against the committed state. Every change is recorded in `RoleChange` (who, when, from, to).
 */
export async function changeUserRole(input: ChangeRoleInput): Promise<ChangeRoleResult> {
  const role = roleSchema.safeParse(input.role)
  if (!role.success || !OBJECT_ID_PATTERN.test(input.targetId) || !OBJECT_ID_PATTERN.test(input.actorId)) {
    return { ok: false, code: "INVALID_INPUT" }
  }
  if (input.actorId === input.targetId) return { ok: false, code: "SELF_CHANGE" }

  const newRole: Role = role.data

  for (let attempt = 1; ; attempt++) {
    try {
      const changed = await prisma.$transaction(async (tx) => {
        await tx.counter.upsert({
          where: { id: ROLE_LOCK_ID },
          update: { seq: { increment: 1 } },
          create: { id: ROLE_LOCK_ID, seq: 1 },
        })

        const actor = await tx.user.findUnique({
          where: { id: input.actorId },
          select: { id: true, role: true, disabledAt: true },
        })
        if (!actor || actor.role !== "ADMIN" || actor.disabledAt) throw new Refusal("FORBIDDEN")

        const target = await tx.user.findUnique({
          where: { id: input.targetId },
          select: { id: true, role: true },
        })
        if (!target) throw new Refusal("NOT_FOUND")
        if (target.role === newRole) return false

        if (target.role === "ADMIN" && newRole !== "ADMIN") {
          // MongoDB: a field that was never written is "not set", which `null` does not match, so both forms are listed.
          const admins = await tx.user.count({ where: { role: "ADMIN", OR: [{ disabledAt: null }, { disabledAt: { isSet: false } }] } })
          if (admins <= 1) throw new Refusal("LAST_ADMIN")
        }

        await tx.user.update({ where: { id: target.id }, data: { role: newRole } })
        await tx.roleChange.create({
          data: { actorId: input.actorId, targetId: target.id, fromRole: target.role, toRole: newRole },
        })
        return { from: target.role, to: newRole }
      })

      if (changed === false) return { ok: true, changed: false }

      console.info(
        `[users] role change actor=${input.actorId} target=${input.targetId} from=${changed.from} to=${changed.to}`
      )
      return { ok: true, changed: true }
    } catch (error) {
      if (error instanceof Refusal) return { ok: false, code: error.code }
      if (isWriteConflict(error)) {
        if (attempt >= MAX_ATTEMPTS) return { ok: false, code: "CONFLICT" }
        continue
      }
      throw error
    }
  }
}
