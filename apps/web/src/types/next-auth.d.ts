import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      isAdmin?: boolean
      isSuperAdmin?: boolean
    } & DefaultSession["user"]
  }

  interface User {
    isAdmin?: boolean
    isSuperAdmin?: boolean
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    email?: string
  }
}