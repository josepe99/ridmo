import type { DefaultSession } from "next-auth"

type AppRole = "USER" | "ADMIN"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: AppRole
    } & DefaultSession["user"]
  }

  interface User {
    role?: AppRole
    disabledAt?: Date | null
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string
    role?: AppRole
  }
}
