import { auth } from "./auth"
import { redirect } from "next/navigation"

export async function getCurrentUser() {
  const session = await auth()
  return session?.user || null
}

export async function requireRole(allowedRoles: ('ADMIN' | 'ACCOUNT_MANAGER' | 'COPYWRITER' | 'DESIGNER' | 'REVIEWER' | 'CLIENT')[]) {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/login")
  }
  if (!allowedRoles.includes(user.role as any)) {
    redirect("/unauthorized")
  }
  return user
}

export async function hasRole(allowedRoles: ('ADMIN' | 'ACCOUNT_MANAGER' | 'COPYWRITER' | 'DESIGNER' | 'REVIEWER' | 'CLIENT')[]): Promise<boolean> {
  const user = await getCurrentUser()
  if (!user) return false
  return allowedRoles.includes(user.role as any)
}

export async function getClientNameFromSession() {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error("Unauthorized")
  }
  if (!user.clientName) {
    throw new Error("User does not have a linked client account")
  }
  return user.clientName
}
