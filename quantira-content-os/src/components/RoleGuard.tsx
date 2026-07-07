'use client'

import { useSession } from 'next-auth/react'
import React from 'react'

interface RoleGuardProps {
  allowedRoles: ('ADMIN' | 'ACCOUNT_MANAGER' | 'COPYWRITER' | 'DESIGNER' | 'REVIEWER')[]
  children: React.ReactNode
}

export default function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return null
  }

  const userRole = session?.user?.role

  if (!userRole || !allowedRoles.includes(userRole as any)) {
    return null
  }

  return <>{children}</>
}
