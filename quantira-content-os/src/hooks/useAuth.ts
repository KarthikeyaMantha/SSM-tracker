'use client'

import { useSession } from 'next-auth/react'

export function useAuth() {
  const { data: session, status } = useSession()

  const user = session?.user || null
  const isAuthenticated = status === 'authenticated'
  const isLoading = status === 'loading'

  const hasRole = (allowedRoles: ('ADMIN' | 'ACCOUNT_MANAGER' | 'COPYWRITER' | 'DESIGNER' | 'REVIEWER')[]) => {
    if (!user) return false
    return allowedRoles.includes(user.role as any)
  }

  return {
    user,
    isAuthenticated,
    isLoading,
    hasRole,
    role: user?.role || null
  }
}
