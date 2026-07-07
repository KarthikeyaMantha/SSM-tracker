'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import {
  LayoutDashboard,
  Building2,
  Target,
  FileText,
  Settings,
  CheckCircle2,
  Calendar,
  TrendingUp,
  Award,
  Lightbulb,
  Inbox,
  FolderOpen,
  BarChart3,
  Sparkles,
  LogOut
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Clients', href: '/clients', icon: Building2 },
  { name: 'Campaigns', href: '/campaigns', icon: Target },
  { name: 'Content Master', href: '/content-master', icon: FileText },
  { name: 'Content Production', href: '/production', icon: Settings },
  { name: 'Approvals', href: '/approvals', icon: CheckCircle2 },
  { name: 'Content Calendar', href: '/calendar', icon: Calendar },
  { name: 'Performance Tracker', href: '/performance', icon: TrendingUp },
  { name: 'Content Scorecard', href: '/scorecard', icon: Award },
  { name: 'Content Strategy', href: '/strategy', icon: Lightbulb },
  { name: 'Content Requests', href: '/requests', icon: Inbox },
  { name: 'Asset Library', href: '/assets', icon: FolderOpen },
  { name: 'Client Dashboard', href: '/client-dashboard', icon: BarChart3 },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()

  // Don't show sidebar on login, unauthorized, or client portal pages
  if (pathname === '/login' || pathname === '/unauthorized' || pathname.startsWith('/client-portal')) {
    return null
  }

  const user = session?.user
  const userName = user?.name || 'Guest User'
  const userRole = user?.role || 'REVIEWER'

  const initials = userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase() || 'QA'

  // Role check helper
  const checkRouteAccess = (href: string, role: string) => {
    const adminOrManagerOnly = ["/clients", "/campaigns", "/client-dashboard"]
    const reviewRoles = ["/approvals", "/performance", "/scorecard"]
    const productionRoles = ["/production"]

    if (adminOrManagerOnly.includes(href)) {
      return role === "ADMIN" || role === "ACCOUNT_MANAGER"
    }
    if (reviewRoles.includes(href)) {
      return role === "ADMIN" || role === "ACCOUNT_MANAGER" || role === "REVIEWER"
    }
    if (productionRoles.includes(href)) {
      return ["ADMIN", "ACCOUNT_MANAGER", "COPYWRITER", "DESIGNER", "REVIEWER"].includes(role)
    }
    return true
  }

  const filteredNavigation = navigation.filter(item => checkRouteAccess(item.href, userRole))

  return (
    <div className="flex h-screen w-64 flex-col bg-white border-r border-slate-200 shrink-0 font-['Inter',-apple-system,sans-serif] shadow-sm">
      {/* Brand Logo */}
      <div className="flex h-16 items-center px-5 border-b border-slate-100 gap-3 shrink-0">
        <div className="p-2 bg-blue-600 rounded-xl text-white shadow-sm shadow-blue-200">
          <Sparkles className="w-4.5 h-4.5" />
        </div>
        <div>
          <span className="text-base font-black text-slate-800 tracking-tight leading-none">Quantira</span>
          <span className="block text-[10px] font-bold text-slate-400 tracking-widest uppercase leading-none mt-0.5">Content OS</span>
        </div>
      </div>

      {/* User Info Block at the Top */}
      <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/40 shrink-0 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white text-xs shrink-0 shadow-sm shadow-blue-100">
          {initials}
        </div>
        <div className="overflow-hidden">
          <p className="text-xs font-bold text-slate-800 truncate leading-tight">{userName}</p>
          <span className="inline-block bg-blue-50 text-blue-700 font-bold text-[9px] px-2 py-0.5 rounded-full mt-1 border border-blue-100 uppercase tracking-wide">
            {userRole.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-0.5 custom-scrollbar">
        <p className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 px-3 pb-2 pt-1">
          Main Menu
        </p>
        {filteredNavigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`group flex items-center px-3 py-2.5 text-xs font-semibold rounded-xl transition-all relative ${
                isActive
                  ? 'bg-blue-50 text-blue-700 shadow-none'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              {/* Active left border indicator */}
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

      {/* Sign Out Card */}
      <div className="p-4 border-t border-slate-100 shrink-0">
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex w-full items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors border-none cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  )
}
