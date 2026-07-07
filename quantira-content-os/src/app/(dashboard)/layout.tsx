'use client'

import React, { useState, useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Breadcrumb,
  Input,
  Dropdown,
  Avatar,
  Badge,
  Progress,
  Checkbox,
  Tag,
  Spin,
  Popover
} from 'antd'
import type { MenuProps } from 'antd'
import { useProfile } from '@/context/ProfileContext'
import { useSession, signOut } from 'next-auth/react'
import {
  Search,
  User,
  LogOut,
  Settings,
  Bell,
  ChevronRight,
  ChevronLeft,
  FileSpreadsheet,
  CheckCircle2,
  Zap,
  Activity,
  Clock,
  RefreshCw,
  Menu,
  X,
  PanelRightClose,
  PanelRightOpen
} from 'lucide-react'
import {
  LayoutDashboard,
  Building2,
  Target,
  FileText,
  Settings as SettingsIcon,
  CheckCircle2 as CheckIcon,
  Calendar,
  TrendingUp,
  Award,
  Lightbulb,
  Inbox,
  FolderOpen,
  BarChart3,
  Sparkles
} from 'lucide-react'

// ─── Navigation items ─────────────────────────────────────────────────────
const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Clients', href: '/clients', icon: Building2 },
  { name: 'Campaigns', href: '/campaigns', icon: Target },
  { name: 'Content Master', href: '/content-master', icon: FileText },
  { name: 'Content Production', href: '/production', icon: SettingsIcon },
  { name: 'Approvals', href: '/approvals', icon: CheckIcon },
  { name: 'Content Calendar', href: '/calendar', icon: Calendar },
  { name: 'Performance Tracker', href: '/performance', icon: TrendingUp },
  { name: 'Content Scorecard', href: '/scorecard', icon: Award },
  { name: 'Content Strategy', href: '/strategy', icon: Lightbulb },
  { name: 'Content Requests', href: '/requests', icon: Inbox },
  { name: 'Asset Library', href: '/assets', icon: FolderOpen },
  { name: 'Client Dashboard', href: '/client-dashboard', icon: BarChart3 },
]

const routeNameMap: Record<string, string> = {
  '/': 'Dashboard',
  '/clients': 'Clients',
  '/campaigns': 'Campaigns',
  '/content-master': 'Content Master',
  '/production': 'Content Production',
  '/approvals': 'Approvals',
  '/calendar': 'Content Calendar',
  '/performance': 'Performance Tracker',
  '/scorecard': 'Content Scorecard',
  '/strategy': 'Content Strategy',
  '/requests': 'Content Requests',
  '/assets': 'Asset Library',
  '/client-dashboard': 'Client Dashboard',
  '/settings': 'System Settings',
  '/profile': 'Account & Profile',
}

// ─── To-do items ──────────────────────────────────────────────────────────
const defaultTodos = [
  { id: 1, text: 'Review pending approval requests', done: false, priority: 'high' },
  { id: 2, text: 'Update Q3 campaign budgets', done: false, priority: 'medium' },
  { id: 3, text: 'Check content production queue', done: true, priority: 'low' },
  { id: 4, text: 'Sync asset library with Canva', done: false, priority: 'medium' },
  { id: 5, text: 'Prepare monthly performance report', done: false, priority: 'high' },
]

const priorityMap: Record<string, { color: string; label: string }> = {
  high: { color: 'red', label: 'High' },
  medium: { color: 'orange', label: 'Med' },
  low: { color: 'green', label: 'Low' },
}

// ─── Inline Mobile Sidebar component ─────────────────────────────────────
function MobileSidebar({
  open,
  onClose,
  pathname,
}: {
  open: boolean
  onClose: () => void
  pathname: string
}) {
  const { data: session } = useSession()
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
    <>
      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-50 xl:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}
      {/* Drawer panel */}
      <div
        className={`fixed top-0 left-0 h-full w-64 bg-white shadow-2xl z-50 xl:hidden flex flex-col transform transition-transform duration-300 ease-in-out ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand */}
        <div className="flex h-16 items-center px-5 border-b border-slate-100 gap-3 justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-xl text-white shadow-sm">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="text-base font-black text-slate-800 tracking-tight leading-none">Quantira</span>
              <span className="block text-[10px] font-bold text-slate-400 tracking-widest uppercase leading-none mt-0.5">Content OS</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-all"
          >
            <X size={16} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-0.5">
          <p className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 px-3 pb-2 pt-1">
            Main Menu
          </p>
          {filteredNavigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
                className={`group flex items-center px-3 py-2.5 text-xs font-semibold rounded-xl transition-all relative ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-blue-600 rounded-r-full" />
                )}
                <item.icon className={`mr-3 h-4 w-4 shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                {item.name}
              </Link>
            )
          })}
        </nav>

        {/* User / Logout */}
        <div className="p-4 border-t border-slate-100 flex flex-col gap-3 bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white text-[11px] shrink-0 shadow-sm">
              {initials}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-slate-800 truncate leading-tight">{userName}</p>
              <p className="text-[10px] text-slate-400 truncate uppercase tracking-wider font-semibold">{userRole.replace('_', ' ')}</p>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="flex w-full items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors border-none cursor-pointer"
          >
            <LogOut size={12} />
            Sign Out
          </button>
        </div>
      </div>
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const pageTitle = routeNameMap[pathname] || 'Dashboard'
  const { data: session } = useSession()
  const user = session?.user
  const userName = user?.name || 'Guest User'
  const userRole = user?.role || 'REVIEWER'

  const initials = userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase() || 'QA'

  // Search state
  const [searchVal, setSearchVal] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Mobile sidebar state
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  // Collapsible Right Workspace Panel state
  const [workspaceExpanded, setWorkspaceExpanded] = useState(true)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('quantira_workspace_expanded')
      if (saved !== null) {
        setWorkspaceExpanded(saved === 'true')
      }
    }
  }, [])

  const toggleWorkspace = () => {
    const nextState = !workspaceExpanded
    setWorkspaceExpanded(nextState)
    if (typeof window !== 'undefined') {
      localStorage.setItem('quantira_workspace_expanded', String(nextState))
    }
  }

  // Right panel state
  const [approvals, setApprovals] = useState<any[]>([])
  const [approvalsLoading, setApprovalsLoading] = useState(true)
  const [todos, setTodos] = useState(defaultTodos)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => { loadApprovals() }, [])


  // Close mobile sidebar on route change
  useEffect(() => { setMobileSidebarOpen(false) }, [pathname])

  const loadApprovals = async () => {
    try {
      const res = await fetch('/api/dashboard')
      const json = await res.json()
      if (json?.recentApprovals) setApprovals(json.recentApprovals)
    } catch (e) {
      console.error(e)
    } finally {
      setApprovalsLoading(false)
      setRefreshing(false)
    }
  }

  const toggleTodo = (id: number) => {
    setTodos(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t))
  }

  // Search debounce
  useEffect(() => {
    if (!searchVal.trim()) { setSearchResults([]); return }
    const t = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(searchVal)}`)
        .then(r => r.json())
        .then(j => { if (Array.isArray(j)) setSearchResults(j) })
        .catch(console.error)
    }, 250)
    return () => clearTimeout(t)
  }, [searchVal])

  // Click outside to close search dropdown
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const breadcrumbItems = [
    { title: <Link href="/">Home</Link> },
    { title: pageTitle }
  ]

  const profileMenuItems: MenuProps['items'] = [
    { key: 'profile', icon: <User className="w-4 h-4 text-slate-500" />, label: <span>My Profile</span> },
    { key: 'settings', icon: <Settings className="w-4 h-4 text-slate-500" />, label: <span>Settings</span> },
    { type: 'divider' },
    { key: 'logout', icon: <LogOut className="w-4 h-4 text-rose-500" />, label: <span className="text-rose-500">Sign Out</span> },
  ]

  const handleProfileMenuClick: MenuProps['onClick'] = ({ key }) => {
    if (key === 'profile') {
      router.push('/profile')
    } else if (key === 'settings') {
      router.push('/settings')
    } else if (key === 'logout') {
      signOut({ callbackUrl: '/login' })
    }
  }


  const approvedCount = approvals.filter((a: any) => a.status === 'Approved').length
  const pendingCount = approvals.filter((a: any) => a.status === 'Pending').length
  const totalApprovals = approvals.length || 1
  const doneCount = todos.filter(t => t.done).length

  return (
    <div className="flex flex-col h-screen bg-[#f0f2f5] font-['Inter',-apple-system,sans-serif] overflow-hidden">

      {/* ─── Mobile Sidebar Drawer ────────────────────────────────────────── */}
      <MobileSidebar
        open={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
        pathname={pathname}
      />

      {/* ─── Sticky Header ───────────────────────────────────────────────── */}
      <header className="sticky top-0 bg-white border-b border-slate-200/80 z-40 h-16 px-4 sm:px-6 flex items-center justify-between shadow-sm shrink-0 gap-4">

        {/* Left: Hamburger (mobile) + Breadcrumb (desktop) */}
        <div className="flex items-center gap-3 min-w-0">
          {/* Hamburger — visible only on mobile/tablet */}
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="xl:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-all shrink-0"
            aria-label="Open navigation menu"
          >
            <Menu size={18} />
          </button>
          {/* Breadcrumb — hidden on mobile */}
          <div className="hidden sm:block min-w-0">
            <Breadcrumb items={breadcrumbItems} className="text-xs font-semibold text-slate-400" />
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
          {/* Mobile: just show page title */}
          <span className="sm:hidden text-sm font-bold text-slate-800 truncate">{pageTitle}</span>
        </div>

        {/* Right: Search + Notifications + Avatar */}
        <div className="flex items-center gap-3 shrink-0 relative" ref={dropdownRef}>

          {/* Search — hidden on smallest screens, shown from sm */}
          <div className="hidden sm:block w-48 md:w-64 relative">
            <Input
              placeholder="Search workspaces..."
              value={searchVal}
              onChange={e => { setSearchVal(e.target.value); setShowDropdown(true) }}
              onFocus={() => setShowDropdown(true)}
              prefix={<Search className="w-3.5 h-3.5 text-slate-400 mr-1" />}
              className="rounded-full bg-slate-50 border-slate-200 text-xs"
            />
            {showDropdown && searchResults.length > 0 && (
              <div className="absolute top-full mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-100 z-50 divide-y divide-slate-100 max-h-72 overflow-y-auto right-0">
                {searchResults.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => { router.push(item.url); setShowDropdown(false); setSearchVal('') }}
                    className="p-3 hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-800 line-clamp-1">{item.title}</span>
                      <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 shrink-0 ml-2">{item.type}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 truncate block mt-0.5">{item.subtitle}</span>
                  </div>
                ))}
              </div>
            )}
            {showDropdown && searchVal.trim() && searchResults.length === 0 && (
              <div className="absolute top-full mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-100 z-50 p-4 text-center text-xs text-slate-400 right-0">
                No matching workspaces found.
              </div>
            )}
          </div>

          {/* Collapsible Workspace Toggle (Desktop only) */}
          <button
            onClick={toggleWorkspace}
            className="hidden xl:flex p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-all shrink-0"
            title={workspaceExpanded ? "Collapse Workspace Panel" : "Expand Workspace Panel"}
          >
            {workspaceExpanded ? <PanelRightClose size={16} /> : <PanelRightOpen size={16} />}
          </button>

          {/* Notification bell */}
          <Popover
            content={
              <div className="w-80 font-['Inter',-apple-system,sans-serif]">
                <div className="px-1 py-2 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">Recent Notifications</span>
                  <Badge count={approvals.filter(a => a.status === 'Pending').length} size="small" style={{ backgroundColor: '#2563eb' }} />
                </div>
                <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                  {approvalsLoading ? (
                    <div className="py-6 text-center text-xs text-slate-400">Loading notifications...</div>
                  ) : approvals.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-400">No new notifications.</div>
                  ) : (
                    approvals.map((item, idx) => (
                      <div key={idx} className="py-2.5 px-1 hover:bg-slate-50 transition-colors cursor-pointer">
                        <div className="flex justify-between items-start gap-2">
                          <span className="text-xs font-bold text-slate-800 line-clamp-1">{item.contentTitle}</span>
                          <Tag color={item.status === 'Approved' ? 'success' : item.status === 'Revision' ? 'error' : 'warning'} className="text-[9px] font-extrabold uppercase py-0.5 px-1.5 rounded border-none m-0 shrink-0">
                            {item.status}
                          </Tag>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1">
                          Campaign: <span className="font-semibold text-slate-700">{item.campaign}</span> • Submitted by {item.submittedBy}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            }
            trigger="click"
            placement="bottomRight"
          >
            <button className="relative p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-all cursor-pointer">
              <Bell className="w-4 h-4" />
              {approvals.filter(a => a.status === 'Pending').length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full border-2 border-white" />
              )}
            </button>
          </Popover>


          {/* User profile dropdown */}
          <Dropdown menu={{ items: profileMenuItems, onClick: handleProfileMenuClick }} placement="bottomRight" trigger={['click']}>
            <div className="flex items-center gap-2 cursor-pointer p-1.5 hover:bg-slate-50 rounded-xl transition-all">
              <Avatar className="bg-blue-600 font-bold border-2 border-blue-100 shadow-sm" size={32}>
                {initials}
              </Avatar>
              <div className="hidden lg:block text-left shrink-0">
                <p className="text-xs font-bold text-slate-800 leading-tight">{userName}</p>
                <p className="text-[10px] text-slate-400 leading-none">{userRole.replace('_', ' ')}</p>
              </div>
            </div>
          </Dropdown>
        </div>
      </header>

      {/* ─── Main body: scrollable center + fixed right panel ────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Center: scrollable content ──────────────────────────────── */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 min-w-0">
          {children}
        </main>

        {/* ── Right: 300px widget panel — hidden below xl ────────────── */}
        {/* spec: "On smaller screens, hide the right widget panel" */}
        {workspaceExpanded ? (
          <aside className="hidden xl:flex flex-col w-[300px] shrink-0 overflow-y-auto border-l border-slate-200 bg-white">
            {/* Panel header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
              <span className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider">Workspace</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => { setRefreshing(true); loadApprovals() }}
                  className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-all"
                  title="Refresh panel"
                >
                  <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
                </button>
                <button
                  onClick={toggleWorkspace}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-all"
                  title="Collapse Workspace"
                >
                  <PanelRightClose size={12} />
                </button>
              </div>
            </div>


          <div className="flex-1 px-4 py-5 space-y-6 overflow-y-auto">

            {/* ── Approval Pipeline ─────────────────────────────────── */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-xs font-extrabold text-slate-800">Approval Pipeline</h3>
                  <p className="text-[10px] text-slate-400 font-medium">Content review status</p>
                </div>
                <Link href="/approvals" className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-0.5">
                  View <ChevronRight size={11} />
                </Link>
              </div>

              {/* Status pills */}
              <div className="flex gap-2 mb-3 flex-wrap">
                <span className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-2.5 py-1 text-[10px] font-bold">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                  {approvedCount} Approved
                </span>
                <span className="flex items-center gap-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full px-2.5 py-1 text-[10px] font-bold">
                  <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                  {pendingCount} Pending
                </span>
              </div>

              <Progress
                percent={Math.round((approvedCount / totalApprovals) * 100) || 0}
                strokeColor="#52c41a"
                trailColor="#f1f5f9"
                showInfo={false}
                strokeWidth={7}
                strokeLinecap="round"
              />
              <div className="flex justify-between text-[9px] font-semibold text-slate-400 mt-1.5 mb-4">
                <span>0%</span>
                <span className="text-slate-600 font-bold">{Math.round((approvedCount / totalApprovals) * 100) || 0}% complete</span>
                <span>100%</span>
              </div>

              {/* Approval list with hover:bg-gray-50 */}
              {approvalsLoading ? (
                <div className="flex justify-center py-4"><Spin size="small" /></div>
              ) : approvals.length > 0 ? (
                <div className="space-y-2">
                  {approvals.map((app: any, i: number) => (
                    <div
                      key={i}
                      className="flex items-start gap-2.5 p-3 rounded-xl hover:bg-gray-50 border border-transparent hover:border-slate-100 cursor-pointer transition-all"
                      onClick={() => router.push('/approvals')}
                    >
                      <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center shrink-0 mt-0.5">
                        <FileSpreadsheet size={12} className="text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-bold text-slate-800 line-clamp-1 leading-tight">{app.contentTitle}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{app.campaign}</p>
                      </div>
                      <Badge status={app.badgeStatus} />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-[11px] text-slate-400 py-3 font-medium">No recent approvals.</p>
              )}
            </section>

            <div className="border-t border-slate-100" />

            {/* ── To-Do List ────────────────────────────────────────── */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-xs font-extrabold text-slate-800">Your To-Do List</h3>
                  <p className="text-[10px] text-slate-400 font-medium">{doneCount} of {todos.length} done</p>
                </div>
                <span className="text-[10px] font-bold text-slate-400 bg-slate-100 rounded-full px-2 py-0.5">
                  {todos.length - doneCount} left
                </span>
              </div>

              <Progress
                percent={Math.round((doneCount / todos.length) * 100)}
                strokeColor="#1890ff"
                trailColor="#f1f5f9"
                showInfo={false}
                strokeWidth={5}
                strokeLinecap="round"
                className="mb-3"
              />

              <div className="space-y-1">
                {todos.map((todo) => (
                  <div
                    key={todo.id}
                    className="flex items-start gap-2.5 px-2 py-2.5 rounded-xl hover:bg-gray-50 cursor-pointer transition-all group"
                    onClick={() => toggleTodo(todo.id)}
                  >
                    <Checkbox
                      checked={todo.done}
                      onChange={() => toggleTodo(todo.id)}
                      className="mt-0.5 shrink-0"
                    />
                    <div className="flex-1 min-w-0 flex items-start justify-between gap-2">
                      <span className={`text-[11px] font-medium leading-snug transition-all ${
                        todo.done ? 'line-through text-slate-300' : 'text-slate-700 group-hover:text-slate-900'
                      }`}>
                        {todo.text}
                      </span>
                      <Tag
                        color={priorityMap[todo.priority].color}
                        style={{ margin: 0, lineHeight: '14px', padding: '0 4px', fontSize: '9px', fontWeight: 800 }}
                      >
                        {priorityMap[todo.priority].label}
                      </Tag>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <div className="border-t border-slate-100" />

            {/* ── System Status ─────────────────────────────────────── */}
            <section className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-4 text-white">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center">
                  <Zap size={14} />
                </div>
                <div>
                  <h3 className="text-xs font-extrabold">System Status</h3>
                  <p className="text-[9px] text-blue-200">All services operational</p>
                </div>
              </div>
              <div className="space-y-2">
                {['Database', 'API Services', 'Asset CDN'].map((s) => (
                  <div key={s} className="flex items-center justify-between">
                    <span className="text-[11px] text-blue-100 font-medium">{s}</span>
                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-300">
                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                      Online
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-white/20 flex items-center gap-1.5 text-[9px] text-blue-200 font-medium">
                <Activity size={10} />
                Last checked just now
              </div>
            </section>

          </div>
          </aside>
        ) : (
          /* Collapsed Workspace Trigger Edge Bar */
          <div
            onClick={toggleWorkspace}
            className="hidden xl:flex flex-col items-center justify-center w-6 hover:w-8 bg-white border-l border-slate-200 cursor-pointer hover:bg-slate-50 transition-all duration-200 shrink-0 text-slate-400 hover:text-blue-600 group"
            title="Expand Workspace Panel"
          >
            <PanelRightOpen size={14} className="group-hover:scale-110 transition-transform" />
          </div>
        )}
      </div>
    </div>
  )
}
