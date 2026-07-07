'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

interface ProfileData {
  fullName: string
  email: string
  phone: string
  role: string
}

interface ProfileContextType {
  profile: ProfileData
  updateProfile: (data: Partial<ProfileData>) => void
}

const defaultProfile: ProfileData = {
  fullName: 'QA Manager',
  email: 'manager@quantira.com',
  phone: '+91 98765 43210',
  role: 'Administrator',
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined)

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<ProfileData>(defaultProfile)
  const { data: session } = useSession()

  // Sync profile state with NextAuth user session when logged in
  useEffect(() => {
    if (session?.user) {
      setProfile({
        fullName: session.user.name || 'System Admin',
        email: session.user.email || 'admin@quantira.com',
        phone: '+91 98765 43210',
        role: session.user.role || 'ADMIN'
      })
    }
  }, [session])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('quantira_user_profile')
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          // If logged in, prefer session values but merge other fields
          if (session?.user) {
            setProfile({
              fullName: session.user.name || parsed.fullName,
              email: session.user.email || parsed.email,
              phone: parsed.phone || '+91 98765 43210',
              role: session.user.role || parsed.role
            })
          } else {
            setProfile(parsed)
          }
        } catch (e) {
          console.error(e)
        }
      }
    }
  }, [session])

  const updateProfile = (data: Partial<ProfileData>) => {
    setProfile((prev) => {
      const updated = { ...prev, ...data }
      if (typeof window !== 'undefined') {
        localStorage.setItem('quantira_user_profile', JSON.stringify(updated))
      }
      return updated
    })
  }

  return (
    <ProfileContext.Provider value={{ profile, updateProfile }}>
      {children}
    </ProfileContext.Provider>
  )
}

export function useProfile() {
  const context = useContext(ProfileContext)
  if (!context) {
    throw new Error('useProfile must be used within a ProfileProvider')
  }
  return context
}
