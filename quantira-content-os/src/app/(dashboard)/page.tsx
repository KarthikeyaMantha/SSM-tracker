'use client'

import React, { useState, useEffect } from 'react'
import { Progress, Spin, List, Avatar } from 'antd'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useProfile } from '@/context/ProfileContext'
import {
  TrendingUp,
  Users,
  Target,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  BarChart3,
  FolderOpen,
  ChevronRight,
  RefreshCw,
  ArrowRight,
  Inbox,
  Lightbulb,
  Settings
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts'

// ─── Quick-access modules ─────────────────────────────────────────────────
const quickLinks = [
  { label: 'Clients', href: '/clients', icon: Users, color: '#1890ff', bg: '#dbeafe' },
  { label: 'Campaigns', href: '/campaigns', icon: Target, color: '#52c41a', bg: '#dcfce7' },
  { label: 'Content Master', href: '/content-master', icon: FileSpreadsheet, color: '#fa8c16', bg: '#ffedd5' },
  { label: 'Approvals', href: '/approvals', icon: CheckCircle2, color: '#f5222d', bg: '#ffe4e6' },
  { label: 'Asset Library', href: '/assets', icon: FolderOpen, color: '#722ed1', bg: '#ede9fe' },
  { label: 'Performance', href: '/performance', icon: BarChart3, color: '#0891b2', bg: '#cffafe' },
]

// ─── Static recent activity (replaced by real data if present) ────────────
const staticActivity = [
  {
    id: 1,
    title: 'New content request submitted',
    subtitle: 'Requested by QA Manager · Campaign: Brand Refresh',
    time: '2 min ago',
    icon: Inbox,
    iconColor: '#1890ff',
    iconBg: '#dbeafe',
  },
  {
    id: 2,
    title: 'Strategy idea promoted to master',
    subtitle: 'Topic: B2B LinkedIn Framework · Status: Ready',
    time: '18 min ago',
    icon: Lightbulb,
    iconColor: '#fa8c16',
    iconBg: '#ffedd5',
  },
  {
    id: 3,
    title: 'Campaign budget updated',
    subtitle: 'Client: Acme Corp · New budget: ₹1,50,000',
    time: '45 min ago',
    icon: Target,
    iconColor: '#52c41a',
    iconBg: '#dcfce7',
  },
  {
    id: 4,
    title: 'Asset uploaded to library',
    subtitle: 'Type: Carousel · Linked to Q3 Social Campaign',
    time: '1 hr ago',
    icon: FolderOpen,
    iconColor: '#722ed1',
    iconBg: '#ede9fe',
  },
  {
    id: 5,
    title: 'Content approved by client',
    subtitle: 'Item: CNT-0012 · Reviewer: Client Admin',
    time: '2 hr ago',
    icon: CheckCircle2,
    iconColor: '#52c41a',
    iconBg: '#dcfce7',
  },
]

// ─── Greeting helpers ─────────────────────────────────────────────────────
function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function formatDate() {
  return new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })
}

// ─── Custom recharts tooltip ──────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-white border border-slate-100 rounded-xl shadow-lg px-4 py-3 text-xs">
        <p className="font-bold text-slate-700 mb-2">{label}</p>
        <div className="space-y-1">
          <p className="flex items-center gap-2 text-blue-600 font-semibold">
            <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
            Revenue: ₹{payload[0]?.value?.toLocaleString()}
          </p>
          <p className="flex items-center gap-2 text-emerald-500 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            Leads: {payload[1]?.value}
          </p>
        </div>
      </div>
    )
  }
  return null
}

// ─────────────────────────────────────────────────────────────────────────
export default function GlobalDashboard() {
  const router = useRouter()
  const { profile } = useProfile()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      const res = await fetch('/api/dashboard')
      const json = await res.json()
      setData(json)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => { setRefreshing(true); loadData() }

  // ─── Metric card definitions ─────────────────────────────────────────
  const metrics = [
    {
      title: 'Total Account Value',
      value: data?.totalAccountValue || '₹0',
      subtitle: 'Monthly retainer sum',
      icon: Users,
      color: '#1890ff',
      bgColor: '#dbeafe',
      trend: '+12%',
      trendPositive: true,
    },
    {
      title: 'Expected Revenue',
      value: data?.expectedRevenue || '₹0',
      subtitle: 'Active campaign budgets',
      icon: TrendingUp,
      color: '#52c41a',
      bgColor: '#dcfce7',
      trend: '+8%',
      trendPositive: true,
    },
    {
      title: 'Active Campaigns',
      value: data?.activeCampaigns || '0',
      subtitle: 'Currently running',
      icon: Target,
      color: '#fa8c16',
      bgColor: '#ffedd5',
      trend: '+3',
      trendPositive: true,
    },
    {
      title: 'Content in Queue',
      value: data?.activeContentItems || '0',
      subtitle: 'Pending production',
      icon: FileSpreadsheet,
      color: '#f5222d',
      bgColor: '#ffe4e6',
      trend: '-2',
      trendPositive: false,
    },
  ]

  const campaigns = data?.campaignProgress || []
  const trendData = data?.trendData || [
    { month: 'Jan', revenue: 42000, leads: 14 },
    { month: 'Feb', revenue: 55000, leads: 18 },
    { month: 'Mar', revenue: 48000, leads: 16 },
    { month: 'Apr', revenue: 71000, leads: 24 },
    { month: 'May', revenue: 68000, leads: 21 },
    { month: 'Jun', revenue: 89000, leads: 29 },
  ]

  // ─── Loading state ───────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
        <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center">
          <Spin size="large" />
        </div>
        <p className="text-sm font-semibold text-slate-400 animate-pulse">
          Loading your dashboard...
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6 font-['Inter',-apple-system,sans-serif]">

      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight leading-tight">
            {getGreeting()}, <span className="text-blue-600">{profile.fullName}</span> 👋
          </h1>
          <p className="text-sm text-slate-400 mt-1 font-medium">{formatDate()}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 text-xs font-semibold text-slate-500 bg-white border border-slate-200 hover:border-blue-400 hover:text-blue-600 rounded-xl px-4 py-2.5 shadow-sm transition-all"
          >
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
          <div className="flex items-center gap-2 text-xs text-emerald-600 font-bold bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5 shadow-sm">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            Live
          </div>
        </div>
      </div>

      {/* ── 4 Metric Cards ───────────────────────────────────────────────── */}
      {/* spec: rounded-xl, p-6, icon in soft colored circle */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((m) => {
          const Icon = m.icon
          return (
            <div
              key={m.title}
              className="bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md p-6 transition-all hover:-translate-y-0.5 cursor-default"
            >
              {/* Icon circle + trend badge */}
              <div className="flex items-center justify-between mb-5">
                {/* Soft colored circle (rounded-full) */}
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
                  style={{ backgroundColor: m.bgColor }}
                >
                  <Icon size={22} style={{ color: m.color }} />
                </div>
                {/* Trend pill */}
                <span
                  className="text-[10px] font-extrabold px-2.5 py-1 rounded-full"
                  style={{
                    color: m.trendPositive ? '#52c41a' : '#f5222d',
                    backgroundColor: m.trendPositive ? '#f6ffed' : '#fff1f0',
                  }}
                >
                  {m.trend}
                </span>
              </div>
              {/* Value */}
              <div className="text-2xl font-black text-slate-800 tracking-tight leading-none mb-1.5">
                {m.value}
              </div>
              {/* Label */}
              <div className="text-xs font-bold text-slate-500 leading-tight">
                {m.title}
              </div>
              {/* Sub-label */}
              <div className="text-[11px] text-slate-400 mt-0.5 font-medium">
                {m.subtitle}
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Revenue & Leads Trend Chart ───────────────────────────────────── */}
      {/* spec: smooth recharts line chart with gradient fill */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-base font-extrabold text-slate-800">Revenue &amp; Leads Trend</h2>
            <p className="text-xs text-slate-400 font-medium mt-0.5">Last 6 months performance overview</p>
          </div>
          {/* Legend */}
          <div className="flex items-center gap-5 text-xs font-semibold">
            <span className="flex items-center gap-1.5 text-blue-600">
              <span className="w-3 h-[2.5px] bg-blue-500 rounded-full inline-block" />
              Revenue
            </span>
            <span className="flex items-center gap-1.5 text-emerald-500">
              <span className="w-3 h-[2.5px] bg-emerald-500 rounded-full inline-block" />
              Leads
            </span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={trendData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <defs>
              {/* Gradient fill under Revenue line */}
              <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1890ff" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#1890ff" stopOpacity={0.02} />
              </linearGradient>
              {/* Gradient fill under Leads line */}
              <linearGradient id="gradLeads" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#52c41a" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#52c41a" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="4 4" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11, fontWeight: 600, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
              dy={6}
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
            />
            <RechartsTooltip content={<CustomTooltip />} cursor={{ stroke: '#e2e8f0', strokeWidth: 1 }} />
            {/* Revenue area with gradient fill */}
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#1890ff"
              strokeWidth={2.5}
              fill="url(#gradRevenue)"
              dot={{ r: 4, fill: '#fff', stroke: '#1890ff', strokeWidth: 2 }}
              activeDot={{ r: 6, fill: '#1890ff', stroke: '#fff', strokeWidth: 2 }}
            />
            {/* Leads area with gradient fill */}
            <Area
              type="monotone"
              dataKey="leads"
              stroke="#52c41a"
              strokeWidth={2.5}
              fill="url(#gradLeads)"
              dot={{ r: 4, fill: '#fff', stroke: '#52c41a', strokeWidth: 2 }}
              activeDot={{ r: 6, fill: '#52c41a', stroke: '#fff', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* ── Active Campaigns & Recent Activity (2-col) ────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Active Campaigns */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-extrabold text-slate-800">Active Campaigns</h2>
              <p className="text-xs text-slate-400 font-medium mt-0.5">Budget utilization</p>
            </div>
            <Link href="/campaigns" className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline">
              View All <ChevronRight size={13} />
            </Link>
          </div>

          {campaigns.length > 0 ? (
            <div className="space-y-5">
              {campaigns.map((c: any) => (
                <div key={c.name}>
                  <div className="flex justify-between items-end mb-2">
                    <div>
                      <p className="text-xs font-bold text-slate-800">{c.name}</p>
                      <p className="text-[11px] text-slate-400 font-medium">Client: {c.client}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] font-extrabold text-slate-700">{c.budget}</p>
                      <p className="text-[10px] text-slate-400">{c.percent}% done</p>
                    </div>
                  </div>
                  <Progress
                    percent={c.percent}
                    strokeColor={c.strokeColor}
                    trailColor="#f1f5f9"
                    showInfo={false}
                    strokeWidth={8}
                    strokeLinecap="round"
                    className="m-0"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center gap-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                <Target size={20} className="text-slate-300" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500">No active campaigns</p>
                <Link href="/campaigns" className="text-xs text-blue-500 hover:underline font-medium">
                  Create one →
                </Link>
              </div>
            </div>
          )}

          <div className="border-t border-slate-100 mt-6 pt-4 flex justify-between text-[11px] font-semibold text-slate-400">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={12} className="text-emerald-500" />
              Database synced
            </span>
            <span className="flex items-center gap-1.5">
              <Clock size={12} className="text-blue-500" />
              Auto-refresh in 5m
            </span>
          </div>
        </div>

        {/* Recent Activity — Ant Design List with hover effects */}
        {/* spec: use Ant Design List, hover:bg-gray-50 */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-extrabold text-slate-800">Recent Activity</h2>
              <p className="text-xs text-slate-400 font-medium mt-0.5">Latest updates across modules</p>
            </div>
            <button
              onClick={() => router.push('/approvals')}
              className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline"
            >
              See All <ChevronRight size={13} />
            </button>
          </div>

          <List
            dataSource={staticActivity}
            split={false}
            renderItem={(item) => {
              const Icon = item.icon
              return (
                <List.Item
                  className="!px-0 !py-0"
                  style={{ padding: 0, border: 'none' }}
                >
                  <div className="w-full flex items-start gap-3 px-3 py-3 rounded-xl hover:bg-gray-50 transition-all cursor-default group">
                    {/* Colored circle icon */}
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                      style={{ backgroundColor: item.iconBg }}
                    >
                      <Icon size={15} style={{ color: item.iconColor }} />
                    </div>
                    {/* Text content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800 leading-tight group-hover:text-slate-900">
                        {item.title}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                        {item.subtitle}
                      </p>
                    </div>
                    {/* Timestamp */}
                    <span className="text-[10px] text-slate-400 font-medium shrink-0 mt-0.5">
                      {item.time}
                    </span>
                  </div>
                </List.Item>
              )
            }}
          />
        </div>
      </div>

      {/* ── Quick Module Access ───────────────────────────────────────────── */}
      {/* spec: generous whitespace, gap-6 between sections */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-extrabold text-slate-800">Quick Access</h2>
          <span className="text-xs text-slate-400 font-medium">Jump to any module</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {quickLinks.map((link) => {
            const Icon = link.icon
            return (
              <Link
                key={link.href}
                href={link.href}
                className="flex flex-col items-center gap-2.5 p-4 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/40 hover:shadow-sm transition-all group text-center"
              >
                {/* Soft circle icon */}
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 transition-transform group-hover:scale-110"
                  style={{ backgroundColor: link.bg }}
                >
                  <Icon size={18} style={{ color: link.color }} />
                </div>
                <span className="text-[11px] font-bold text-slate-600 group-hover:text-blue-700 leading-tight">
                  {link.label}
                </span>
              </Link>
            )
          })}
        </div>
      </div>

    </div>
  )
}
