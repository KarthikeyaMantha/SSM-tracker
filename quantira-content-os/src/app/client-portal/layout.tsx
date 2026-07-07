'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { LayoutDashboard, Calendar, Inbox, LogOut, Sparkles } from 'lucide-react'

export default function ClientPortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f0f2f5]">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  const clientName = session?.user?.clientName || 'Client Account'
  const clientEmail = session?.user?.email || ''

  const navigation = [
    { name: 'Dashboard', href: '/client-portal/dashboard', icon: LayoutDashboard },
    { name: 'Content Calendar', href: '/client-portal/calendar', icon: Calendar },
    { name: 'Submit Request', href: '/client-portal/requests', icon: Inbox },
  ]

  return (
    <div className="flex h-screen bg-[#f0f2f5] overflow-hidden font-['Inter',-apple-system,sans-serif]">
      {/* Client Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 shadow-sm">
        {/* Brand */}
        <div className="flex h-16 items-center px-6 border-b border-slate-100 gap-3 shrink-0">
          <div className="p-2 bg-blue-600 rounded-xl text-white shadow-sm">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span className="text-sm font-black text-slate-800 tracking-tight leading-none block">Quantira</span>
            <span className="block text-[8px] font-bold text-slate-400 tracking-widest uppercase leading-none mt-0.5">Client Portal</span>
          </div>
        </div>

        {/* Client Metadata block */}
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Signed in as</p>
          <p className="text-sm font-extrabold text-slate-800 truncate mt-0.5">{clientName}</p>
          <p className="text-[10px] text-slate-400 truncate mt-0.5">{clientEmail}</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-0.5">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center px-4 py-2.5 text-xs font-semibold rounded-xl transition-all relative ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-blue-600 rounded-r-full" />
                )}
                <item.icon
                  className={`mr-3 h-4 w-4 shrink-0 transition-colors ${
                    isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'
                  }`}
                />
                {item.name}
              </Link>
            )
          })}
        </nav>

        {/* Log Out */}
        <div className="p-4 border-t border-slate-100 shrink-0">
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="flex w-full items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors border-none cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-6 sm:p-8">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
