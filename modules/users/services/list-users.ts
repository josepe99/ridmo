import "server-only"

import { prisma } from "@/shared/lib/prisma"
import { normalizeEmail } from "../domain/email"
import { toRole, type Role } from "../domain/roles"

export const USERS_PAGE_SIZE = 20
const QUERY_MAX_LENGTH = 100

export type UserListItem = {
  id: string
  name: string | null
  email: string
  role: Role
  disabled: boolean
  hasGoogle: boolean
  createdAt: string
}

export type UserList = {
  users: UserListItem[]
  total: number
  page: number
  pageSize: number
  pageCount: number
}

function toPage(value: unknown): number {
  return typeof value === "number" && Number.isInteger(value) && value >= 1 ? value : 1
}

/** Admin user list: email search (substring, case-insensitive) with fixed-size pages. */
export async function listUsers(options: { query?: string; page?: number }): Promise<UserList> {
  const page = toPage(options.page)
  const query = normalizeEmail(options.query ?? "").slice(0, QUERY_MAX_LENGTH)
  const where = query ? { email: { contains: query, mode: "insensitive" as const } } : {}

  const [rows, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * USERS_PAGE_SIZE,
      take: USERS_PAGE_SIZE,
      // Explicit allow-list: the password hash is never selected.
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        disabledAt: true,
        createdAt: true,
        _count: { select: { accounts: true } },
      },
    }),
    prisma.user.count({ where }),
  ])

  return {
    users: rows.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      role: toRole(row.role),
      disabled: row.disabledAt != null,
      hasGoogle: row._count.accounts > 0,
      createdAt: row.createdAt.toISOString(),
    })),
    total,
    page,
    pageSize: USERS_PAGE_SIZE,
    pageCount: Math.max(1, Math.ceil(total / USERS_PAGE_SIZE)),
  }
}
