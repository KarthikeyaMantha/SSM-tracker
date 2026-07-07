import { DefaultSession, DefaultUser } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: 'ADMIN' | 'ACCOUNT_MANAGER' | 'COPYWRITER' | 'DESIGNER' | 'REVIEWER' | 'CLIENT'
      clientName?: string | null
    } & DefaultSession["user"]
  }

  interface User extends DefaultUser {
    role: 'ADMIN' | 'ACCOUNT_MANAGER' | 'COPYWRITER' | 'DESIGNER' | 'REVIEWER' | 'CLIENT'
    clientName?: string | null
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string
    role?: 'ADMIN' | 'ACCOUNT_MANAGER' | 'COPYWRITER' | 'DESIGNER' | 'REVIEWER' | 'CLIENT'
    clientName?: string | null
  }
}
