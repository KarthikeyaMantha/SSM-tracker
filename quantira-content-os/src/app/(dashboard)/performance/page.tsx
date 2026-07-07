'use client'

import { useState, useEffect } from 'react'
import {
  Card,
  Button,
  Input,
  Select,
  Row,
  Col,
  Progress,
  Statistic,
  message,
  Typography,
  Tag,
  Space,
  Divider,
  Empty
} from 'antd'
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Eye,
  Heart,
  MessageSquare,
  Share2,
  Bookmark,
  MousePointerClick,
  Users,
  DollarSign,
  Sparkles,
  Search,
  Save,
  Linkedin,
  Instagram,
  Facebook,
  Twitter,
  X,
  Filter,
  Star,
  Activity
} from 'lucide-react'

const { Title, Text } = Typography

interface PerformanceItem {
  id: string
  contentId: string
  content: {
    contentTitle: string
    platform: string
    clientId: string | null
    funnelStage: string | null
  }
  reach: number
  impressions: number
  likes: number
  comments: number
  shares: number
  saves: number
  profileVisits: number
  linkClicks: number
  leadsGenerated: number
  revenueGenerated: number
  engagementRate: number
  contentScore: number
}

// ── Platform helpers ─────────────────────────────────────────────────────────
function PlatformIcon({ platform, size = 14 }: { platform: string; size?: number }) {
  switch (platform.toLowerCase()) {
    case 'linkedin':  return <Linkedin  size={size} style={{ color: '#0a66c2' }} />
    case 'instagram': return <Instagram size={size} style={{ color: '#e1306c' }} />
    case 'facebook':  return <Facebook  size={size} style={{ color: '#1877f2' }} />
    case 'twitter':   return <Twitter   size={size} style={{ color: '#1da1f2' }} />
    case 'x':         return <X         size={size} style={{ color: '#000' }} />
    default:          return <Share2    size={size} style={{ color: '#94a3b8' }} />
  }
}

const PLATFORM_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  linkedin:  { bg: '#eff6ff', border: '#bfdbfe', text: '#1d4ed8' },
  instagram: { bg: '#fdf4ff', border: '#e9d5ff', text: '#7e22ce' },
  facebook:  { bg: '#eff6ff', border: '#93c5fd', text: '#1e40af' },
  twitter:   { bg: '#f0f9ff', border: '#bae6fd', text: '#0369a1' },
  x:         { bg: '#f9fafb', border: '#d1d5db', text: '#111827' },
}
function getPlatformStyle(p: string) {
  return PLATFORM_COLORS[p.toLowerCase()] ?? { bg: '#f8fafc', border: '#e2e8f0', text: '#475569' }
}

// ── Score helpers ────────────────────────────────────────────────────────────
function getScoreConfig(score: number) {
  if (score >= 8)  return { label: 'EXCELLENT', color: '#16a34a', bg: '#dcfce7', border: '#86efac', progress: '#22c55e' }
  if (score >= 6)  return { label: 'GOOD',      color: '#ca8a04', bg: '#fef9c3', border: '#fde047', progress: '#eab308' }
  return              { label: 'NEEDS IMP.',color: '#dc2626', bg: '#fee2e2', border: '#fca5a5', progress: '#ef4444' }
}

// ── Metric input cell ────────────────────────────────────────────────────────
function MetricCell({
  icon, label, value, onChange, color = '#64748b'
}: {
  icon: React.ReactNode
  label: string
  value: number
  onChange: (v: number) => void
  color?: string
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5 mb-0.5">
        <span style={{ color }}>{icon}</span>
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</span>
      </div>
      <input
        type="number"
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full rounded-xl border bg-slate-50 hover:bg-white focus:bg-white px-3 py-2 text-sm font-bold text-slate-800 outline-none transition-all text-center"
        style={{ border: '1.5px solid #e2e8f0' }}
        onFocus={e => { e.target.style.border = '1.5px solid #3b82f6'; e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)' }}
        onBlur={e  => { e.target.style.border = '1.5px solid #e2e8f0'; e.target.style.boxShadow = 'none' }}
        placeholder="0"
      />
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function PerformancePage() {
  const [data, setData]           = useState<PerformanceItem[]>([])
  const [loading, setLoading]     = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterPlatform, setFilterPlatform] = useState('')
  const [filterClient, setFilterClient]     = useState('')
  const [savingStatus, setSavingStatus] = useState<Record<string, 'idle' | 'saving' | 'saved' | 'error'>>({})

  useEffect(() => { loadPerformance() }, [])

  const loadPerformance = async () => {
    try {
      const res  = await fetch('/api/performance')
      const json = await res.json()
      if (Array.isArray(json)) setData(json)
    } catch { message.error('Failed to load performance data') }
    finally  { setLoading(false) }
  }

  const handleChange = (id: string, field: keyof PerformanceItem, value: number) => {
    setData(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item))
  }

  const handleUpdate = async (item: PerformanceItem) => {
    setSavingStatus(prev => ({ ...prev, [item.id]: 'saving' }))
    try {
      const res = await fetch('/api/performance', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id:               item.id,
          reach:            Number(item.reach)            || 0,
          impressions:      Number(item.impressions)      || 0,
          likes:            Number(item.likes)            || 0,
          comments:         Number(item.comments)         || 0,
          shares:           Number(item.shares)           || 0,
          saves:            Number(item.saves)            || 0,
          profileVisits:    Number(item.profileVisits)    || 0,
          linkClicks:       Number(item.linkClicks)       || 0,
          leadsGenerated:   Number(item.leadsGenerated)   || 0,
          revenueGenerated: Number(item.revenueGenerated) || 0,
          engagementRate:   Number(item.engagementRate)   || 0,
          contentScore:     Number(item.contentScore)     || 0,
        }),
      })
      if (res.ok) {
        setSavingStatus(prev => ({ ...prev, [item.id]: 'saved' }))
        message.success('Performance updated!')
        setTimeout(() => setSavingStatus(prev => ({ ...prev, [item.id]: 'idle' })), 2500)
        const freshRes  = await fetch('/api/performance')
        const freshJson = await freshRes.json()
        if (Array.isArray(freshJson)) setData(freshJson)
      } else {
        setSavingStatus(prev => ({ ...prev, [item.id]: 'error' }))
        message.error('Failed to update')
      }
    } catch {
      setSavingStatus(prev => ({ ...prev, [item.id]: 'error' }))
      message.error('Error updating performance')
    }
  }

  const exportToCSV = () => {
    try {
      const headers = ['Content ID', 'Title', 'Platform', 'Client', 'Impressions', 'Reach', 'Likes', 'Comments', 'Shares', 'Saves', 'Clicks', 'Leads', 'Revenue', 'Eng Rate %', 'Score']
      const rows = filtered.map(item => [
        item.contentId,
        `"${item.content.contentTitle.replace(/"/g, '""')}"`,
        item.content.platform,
        item.content.clientId || '-',
        item.impressions,
        item.reach,
        item.likes,
        item.comments,
        item.shares,
        item.saves,
        item.linkClicks,
        item.leadsGenerated,
        item.revenueGenerated,
        item.engagementRate,
        item.contentScore
      ])

      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.setAttribute('href', url)
      link.setAttribute('download', `Quantira_Performance_Report_${new Date().toISOString().split('T')[0]}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      message.success('CSV Report exported successfully!')
    } catch (error) {
      console.error(error)
      message.error('Failed to export CSV report.')
    }
  }

  // ── Aggregates ─────────────────────────────────────────────────────────────
  const totalImp     = data.reduce((s, d) => s + (Number(d.impressions) || 0), 0)
  const totalReach   = data.reduce((s, d) => s + (Number(d.reach) || 0), 0)
  const totalClicks  = data.reduce((s, d) => s + (Number(d.linkClicks) || 0), 0)
  const totalRevenue = data.reduce((s, d) => s + (Number(d.revenueGenerated) || 0), 0)
  const totalLeads   = data.reduce((s, d) => s + (Number(d.leadsGenerated) || 0), 0)
  const avgEng       = data.length > 0
    ? (data.reduce((s, d) => s + (Number(d.engagementRate) || 0), 0) / data.length).toFixed(2)
    : '0.00'

  // ── All unique clients ─────────────────────────────────────────────────────
  const allClients = Array.from(new Set(data.map(d => d.content.clientId).filter(Boolean))) as string[]
  const allPlatforms = Array.from(new Set(data.map(d => d.content.platform)))

  // ── Filtered list ──────────────────────────────────────────────────────────
  const filtered = data.filter(item => {
    const q = searchTerm.toLowerCase()
    const matchSearch = !q ||
      item.content.contentTitle.toLowerCase().includes(q) ||
      item.content.platform.toLowerCase().includes(q) ||
      (item.content.clientId || '').toLowerCase().includes(q)
    const matchPlatform = !filterPlatform || item.content.platform === filterPlatform
    const matchClient   = !filterClient   || item.content.clientId  === filterClient
    return matchSearch && matchPlatform && matchClient
  })

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="relative w-14 h-14">
          <div className="absolute inset-0 rounded-full border-4 border-blue-100" />
          <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
        </div>
        <p className="font-semibold text-sm text-slate-500 animate-pulse">Loading performance analytics…</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto" style={{ fontFamily: "'Inter', -apple-system, sans-serif" }}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl text-white shadow-lg" style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', boxShadow: '0 4px 14px rgba(79,70,229,0.35)' }}>
            <BarChart3 size={22} />
          </div>
          <div>
            <Title level={2} className="!mb-0 !font-extrabold tracking-tight !text-slate-900">
              Performance Analytics
            </Title>
            <p className="text-slate-500 text-sm">Monitor interactions, conversions, and ROI across all content.</p>
          </div>
        </div>
        <Button
          type="primary"
          onClick={exportToCSV}
          className="bg-indigo-600 hover:bg-indigo-700 text-xs font-bold rounded-xl h-10 px-4 flex items-center justify-center border-none shadow-sm shadow-indigo-600/10"
        >
          Export CSV Report
        </Button>
      </div>

      {/* ── Overview Stats ───────────────────────────────────────────────── */}
      <Row gutter={[16, 16]}>
        {[
          { icon: <Eye size={18} />,          bg: '#eff6ff', col: '#2563eb', label: 'Impressions',   value: totalImp,     suffix: undefined,  prefix: undefined    },
          { icon: <Users size={18} />,         bg: '#f5f3ff', col: '#7c3aed', label: 'Total Reach',  value: totalReach,   suffix: undefined,  prefix: undefined    },
          { icon: <MousePointerClick size={18}/>,bg:'#f0fdf4',col: '#16a34a', label: 'Link Clicks',  value: totalClicks,  suffix: undefined,  prefix: undefined    },
          { icon: <Activity size={18} />,      bg: '#fffbeb', col: '#d97706', label: 'Avg. Eng. %',  value: Number(avgEng),suffix: '%',       prefix: undefined    },
          { icon: <Sparkles size={18} />,      bg: '#ecfeff', col: '#0891b2', label: 'Total Leads',  value: totalLeads,   suffix: undefined,  prefix: undefined    },
          { icon: <DollarSign size={18} />,    bg: '#f0fdf4', col: '#15803d', label: 'Revenue',      value: totalRevenue, suffix: undefined,  prefix: '$'          },
        ].map((s, i) => (
          <Col key={i} xs={12} sm={8} xl={4}>
            <Card
              bordered={false}
              bodyStyle={{ padding: 16 }}
              className="rounded-2xl hover:shadow-md transition-all duration-300"
              style={{ border: '1px solid #f1f5f9', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl" style={{ background: s.bg, color: s.col }}>{s.icon}</div>
                <Statistic
                  title={s.label}
                  value={s.value}
                  prefix={s.prefix}
                  suffix={s.suffix}
                  precision={s.suffix === '%' ? 2 : 0}
                  valueStyle={{ fontWeight: 800, fontSize: 18, color: s.col }}
                />
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* ── Search & Filters ─────────────────────────────────────────────── */}
      <Card
        bordered={false}
        bodyStyle={{ padding: 16 }}
        className="rounded-2xl"
        style={{ border: '1px solid #f1f5f9', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
      >
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <Input
            prefix={<Search size={15} className="text-slate-400 mr-1" />}
            placeholder="Search by title, platform, or client…"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            allowClear
            size="large"
            className="flex-1 rounded-xl"
            style={{ background: '#f8fafc' }}
          />
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-slate-400 hidden md:block" />
            <Select
              value={filterPlatform || undefined}
              onChange={v => setFilterPlatform(v ?? '')}
              placeholder="All Platforms"
              allowClear
              className="w-40"
              size="large"
              options={allPlatforms.map(p => ({ value: p, label: p }))}
            />
            <Select
              value={filterClient || undefined}
              onChange={v => setFilterClient(v ?? '')}
              placeholder="All Clients"
              allowClear
              className="w-40"
              size="large"
              options={allClients.map(c => ({ value: c, label: c }))}
            />
            {(searchTerm || filterPlatform || filterClient) && (
              <Button danger ghost onClick={() => { setSearchTerm(''); setFilterPlatform(''); setFilterClient('') }}>
                Clear
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* ── Cards Grid ───────────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <Card bordered={false} bodyStyle={{ padding: 48 }} className="rounded-2xl text-center" style={{ border: '1px solid #f1f5f9' }}>
          <Empty description={<span className="text-slate-400 font-medium">No performance data found.</span>} />
        </Card>
      ) : (
        <Row gutter={[20, 20]}>
          {filtered.map(item => {
            const score     = Number(item.contentScore) || 0
            const scoreCfg  = getScoreConfig(score)
            const platStyle = getPlatformStyle(item.content.platform)
            const status    = savingStatus[item.id] ?? 'idle'
            const engRate   = Math.min(Number(item.engagementRate) || 0, 100)
            const scoreDisp = Math.min(score * 10, 100)

            return (
              <Col key={item.id} xs={24} lg={12} xxl={8}>
                <Card
                  bordered={false}
                  className="rounded-3xl transition-all duration-300 hover:-translate-y-1 h-full"
                  style={{
                    border: '1px solid #f1f5f9',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                  }}
                  bodyStyle={{ padding: 0 }}
                  onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.14)')}
                  onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)')}
                >
                  {/* ── TOP: Identity ─────────────────────────────────────── */}
                  <div
                    className="px-5 py-4 rounded-t-3xl"
                    style={{ background: `linear-gradient(135deg, ${platStyle.bg}, #fff)`, borderBottom: `1px solid ${platStyle.border}` }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="p-2 rounded-xl shrink-0"
                          style={{ background: platStyle.bg, border: `1.5px solid ${platStyle.border}` }}
                        >
                          <PlatformIcon platform={item.content.platform} size={18} />
                        </div>
                        <div className="min-w-0">
                          <h3
                            className="font-extrabold text-slate-900 text-sm leading-snug line-clamp-2"
                            title={item.content.contentTitle}
                          >
                            {item.content.contentTitle}
                          </h3>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span
                              className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full"
                              style={{ background: platStyle.bg, color: platStyle.text, border: `1px solid ${platStyle.border}` }}
                            >
                              {item.content.platform}
                            </span>
                            {item.content.clientId && (
                              <span className="text-[10px] font-semibold text-slate-500">
                                {item.content.clientId}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      {/* Score badge */}
                      <div
                        className="shrink-0 text-center px-3 py-1.5 rounded-xl"
                        style={{ background: scoreCfg.bg, border: `1.5px solid ${scoreCfg.border}` }}
                      >
                        <div className="text-xl font-black" style={{ color: scoreCfg.color, lineHeight: 1 }}>
                          {score.toFixed(1)}
                        </div>
                        <div className="text-[9px] font-extrabold uppercase tracking-wider mt-0.5" style={{ color: scoreCfg.color }}>
                          {scoreCfg.label}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ── MIDDLE: Reach & Impressions ───────────────────────── */}
                  <div className="px-5 py-4 border-b border-slate-100">
                    <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-3">Key Metrics</p>
                    <Row gutter={16}>
                      <Col span={12}>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5 text-slate-500">
                            <Eye size={13} />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Reach</span>
                          </div>
                          <div className="text-2xl font-black text-slate-900 leading-none">
                            {(Number(item.reach) || 0).toLocaleString()}
                          </div>
                          <input
                            type="number"
                            value={item.reach}
                            onChange={e => handleChange(item.id, 'reach', Number(e.target.value))}
                            placeholder="Reach"
                            className="mt-1 rounded-lg border px-2 py-1 text-xs font-bold text-slate-700 bg-slate-50 hover:bg-white focus:bg-white outline-none w-full text-center transition-all"
                            style={{ border: '1.5px solid #e2e8f0' }}
                          />
                        </div>
                      </Col>
                      <Col span={12}>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5 text-slate-500">
                            <TrendingUp size={13} />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Impressions</span>
                          </div>
                          <div className="text-2xl font-black text-slate-900 leading-none">
                            {(Number(item.impressions) || 0).toLocaleString()}
                          </div>
                          <input
                            type="number"
                            value={item.impressions}
                            onChange={e => handleChange(item.id, 'impressions', Number(e.target.value))}
                            placeholder="Imp."
                            className="mt-1 rounded-lg border px-2 py-1 text-xs font-bold text-slate-700 bg-slate-50 hover:bg-white focus:bg-white outline-none w-full text-center transition-all"
                            style={{ border: '1.5px solid #e2e8f0' }}
                          />
                        </div>
                      </Col>
                    </Row>
                  </div>

                  {/* ── BOTTOM: Engagement Grid ────────────────────────────── */}
                  <div className="px-5 py-4 border-b border-slate-100">
                    <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-3">Engagement</p>
                    <div className="grid grid-cols-4 gap-2">
                      <MetricCell icon={<Heart size={12} />}        label="Likes"    value={item.likes}    onChange={v => handleChange(item.id, 'likes', v)}    color="#e1306c" />
                      <MetricCell icon={<MessageSquare size={12} />} label="Comments" value={item.comments} onChange={v => handleChange(item.id, 'comments', v)} color="#7c3aed" />
                      <MetricCell icon={<Share2 size={12} />}        label="Shares"   value={item.shares}   onChange={v => handleChange(item.id, 'shares', v)}   color="#0891b2" />
                      <MetricCell icon={<Bookmark size={12} />}      label="Saves"    value={item.saves}    onChange={v => handleChange(item.id, 'saves', v)}    color="#d97706" />
                    </div>
                  </div>

                  {/* ── RIGHT STATS: Leads, Revenue, Eng Rate, Score ──────── */}
                  <div className="px-5 py-4 border-b border-slate-100">
                    <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-3">Conversions & Score</p>
                    <Row gutter={[12, 12]}>
                      <Col span={12}>
                        <div className="rounded-xl p-3 flex flex-col gap-1.5" style={{ background: '#f0fdf4', border: '1px solid #86efac' }}>
                          <div className="flex items-center gap-1.5">
                            <Sparkles size={12} style={{ color: '#16a34a' }} />
                            <span className="text-[10px] font-bold uppercase text-slate-500">Leads</span>
                          </div>
                          <input
                            type="number"
                            value={item.leadsGenerated}
                            onChange={e => handleChange(item.id, 'leadsGenerated', Number(e.target.value))}
                            className="rounded-lg border px-2 py-1 text-sm font-black text-slate-800 bg-white outline-none w-full text-center"
                            style={{ border: '1.5px solid #86efac' }}
                          />
                        </div>
                      </Col>
                      <Col span={12}>
                        <div className="rounded-xl p-3 flex flex-col gap-1.5" style={{ background: '#f0fdf4', border: '1px solid #6ee7b7' }}>
                          <div className="flex items-center gap-1.5">
                            <DollarSign size={12} style={{ color: '#059669' }} />
                            <span className="text-[10px] font-bold uppercase text-slate-500">Revenue</span>
                          </div>
                          <input
                            type="number"
                            value={item.revenueGenerated}
                            onChange={e => handleChange(item.id, 'revenueGenerated', Number(e.target.value))}
                            className="rounded-lg border px-2 py-1 text-sm font-black text-slate-800 bg-white outline-none w-full text-center"
                            style={{ border: '1.5px solid #6ee7b7' }}
                          />
                        </div>
                      </Col>
                      <Col span={12}>
                        <div className="rounded-xl p-3" style={{ background: '#fffbeb', border: '1px solid #fde047' }}>
                          <div className="flex items-center gap-1.5 mb-2">
                            <Activity size={12} style={{ color: '#ca8a04' }} />
                            <span className="text-[10px] font-bold uppercase text-slate-500">Eng. Rate</span>
                          </div>
                          <input
                            type="number"
                            step="0.01"
                            value={item.engagementRate}
                            onChange={e => handleChange(item.id, 'engagementRate', Number(e.target.value))}
                            className="rounded-lg border px-2 py-1 text-xs font-bold text-slate-700 bg-white outline-none w-full text-center mb-1.5"
                            style={{ border: '1.5px solid #fde047' }}
                          />
                          <Progress
                            percent={engRate}
                            showInfo={false}
                            size="small"
                            strokeColor="#eab308"
                            trailColor="#fef9c3"
                          />
                        </div>
                      </Col>
                      <Col span={12}>
                        <div
                          className="rounded-xl p-3"
                          style={{ background: scoreCfg.bg, border: `1px solid ${scoreCfg.border}` }}
                        >
                          <div className="flex items-center gap-1.5 mb-2">
                            <Star size={12} style={{ color: scoreCfg.color }} />
                            <span className="text-[10px] font-bold uppercase text-slate-500">Content Score</span>
                          </div>
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="10"
                            value={item.contentScore}
                            onChange={e => handleChange(item.id, 'contentScore', Number(e.target.value))}
                            className="rounded-lg border px-2 py-1 text-xs font-bold text-slate-700 bg-white outline-none w-full text-center mb-1.5"
                            style={{ border: `1.5px solid ${scoreCfg.border}` }}
                          />
                          <Progress
                            percent={scoreDisp}
                            showInfo={false}
                            size="small"
                            strokeColor={scoreCfg.progress}
                            trailColor={scoreCfg.bg}
                          />
                        </div>
                      </Col>
                    </Row>
                  </div>

                  {/* ── Other metrics: profile visits, link clicks ─────────── */}
                  <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center gap-2">
                        <Users size={12} className="text-slate-400" />
                        <span className="text-[10px] text-slate-500 font-semibold uppercase">Profile Visits</span>
                        <input
                          type="number"
                          value={item.profileVisits}
                          onChange={e => handleChange(item.id, 'profileVisits', Number(e.target.value))}
                          className="ml-auto rounded-lg border px-2 py-0.5 text-xs font-bold text-slate-700 bg-white outline-none text-center w-20"
                          style={{ border: '1.5px solid #e2e8f0' }}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <MousePointerClick size={12} className="text-slate-400" />
                        <span className="text-[10px] text-slate-500 font-semibold uppercase">Link Clicks</span>
                        <input
                          type="number"
                          value={item.linkClicks}
                          onChange={e => handleChange(item.id, 'linkClicks', Number(e.target.value))}
                          className="ml-auto rounded-lg border px-2 py-0.5 text-xs font-bold text-slate-700 bg-white outline-none text-center w-20"
                          style={{ border: '1.5px solid #e2e8f0' }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* ── Save Button ───────────────────────────────────────── */}
                  <div className="px-5 py-4 flex justify-end">
                    <button
                      onClick={() => handleUpdate(item)}
                      disabled={status === 'saving'}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm"
                      style={{
                        background:   status === 'saving' ? '#f1f5f9'
                                    : status === 'saved'  ? '#dcfce7'
                                    : status === 'error'  ? '#fee2e2'
                                    : 'linear-gradient(135deg, #2563eb, #4f46e5)',
                        color:        status === 'saving' ? '#94a3b8'
                                    : status === 'saved'  ? '#16a34a'
                                    : status === 'error'  ? '#dc2626'
                                    : '#fff',
                        border:       status === 'saved'  ? '1.5px solid #86efac'
                                    : status === 'error'  ? '1.5px solid #fca5a5'
                                    : 'none',
                        boxShadow:    status === 'idle'   ? '0 4px 14px rgba(37,99,235,0.35)' : 'none',
                        cursor:       status === 'saving' ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {status === 'saving' ? (
                        <><div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" /> Saving…</>
                      ) : status === 'saved' ? (
                        <><span>✓</span> Saved</>
                      ) : status === 'error' ? (
                        <span>Retry</span>
                      ) : (
                        <><Save size={15} /> Save Metrics</>
                      )}
                    </button>
                  </div>
                </Card>
              </Col>
            )
          })}
        </Row>
      )}
    </div>
  )
}
