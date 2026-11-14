import { z } from "zod"

export const ROLES = ["USER", "ADMIN"] as const
export type Role = (typeof ROLES)[number]

export const roleSchema = z.enum(ROLES)

export function isRole(value: unknown): value is Role {
  return value === "USER" || value === "ADMIN"
}

/** Anything that is not exactly a known role is the least privileged one. */
export function toRole(value: unknown): Role {
  return isRole(value) ? value : "USER"
}

export const ROLE_LABELS: Record<Role, string> = {
  USER: "Cliente",
  ADMIN: "Administrador",
}

/** Mongo ObjectId as a 24 char hex string. */
export const OBJECT_ID_PATTERN = /^[a-f0-9]{24}$/i
