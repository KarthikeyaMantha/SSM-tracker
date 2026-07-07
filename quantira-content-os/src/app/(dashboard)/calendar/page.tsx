'use client'

import { useState, useEffect } from 'react'
import {
  Card,
  Button,
  Input,
  Select,
  Drawer,
  Space,
  Row,
  Col,
  Statistic,
  Form,
  message,
  Typography,
  Tag,
  Empty,
  Badge
} from 'antd'
import {
  CalendarDays,
  Clock,
  CheckCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Search,
  Trash2,
  Calendar,
  Linkedin,
  Instagram,
  Facebook,
  Twitter,
  Share2,
  X,
  Filter,
  LayoutGrid,
  Zap
} from 'lucide-react'
import dayjs from 'dayjs'

const { Title, Text } = Typography

interface Client { clientName: string }
interface Campaign { campaignId: string; campaignName: string; clientId: string }

interface ContentMaster {
  contentId: string
  campaignId?: string | null
  campaign?: Campaign | null
  clientId?: string | null
  client?: Client | null
  contentTitle: string
  topic?: string | null
  contentPillar?: string | null
  funnelStage?: string | null
  platform: string
  contentFormat?: string | null
  language: string
  priority: string
  owner?: string | null
  publishDate?: string | null
  publishTime?: string | null
  status: string
  healthStatus: string
  caption?: string | null
  hashtags?: string | null
  canvaLink?: string | null
  driveLink?: string | null
}

// ─── Platform helpers ────────────────────────────────────────────────────────

const PLATFORM_CONFIG: Record<string, {
  bg: string; border: string; text: string; dot: string; gradientFrom: string; gradientTo: string
}> = {
  linkedin:  { bg: '#eff6ff', border: '#bfdbfe', text: '#1d4ed8', dot: '#0a66c2', gradientFrom: '#dbeafe', gradientTo: '#eff6ff' },
  instagram: { bg: '#fdf4ff', border: '#e9d5ff', text: '#7e22ce', dot: '#e1306c', gradientFrom: '#fce7f3', gradientTo: '#f5f3ff' },
  facebook:  { bg: '#eff6ff', border: '#93c5fd', text: '#1e40af', dot: '#1877f2', gradientFrom: '#dbeafe', gradientTo: '#eff6ff' },
  twitter:   { bg: '#f0f9ff', border: '#bae6fd', text: '#0369a1', dot: '#1da1f2', gradientFrom: '#e0f2fe', gradientTo: '#f0f9ff' },
  x:         { bg: '#f9fafb', border: '#d1d5db', text: '#111827', dot: '#000000', gradientFrom: '#f3f4f6', gradientTo: '#f9fafb' },
}

function getPlatformCfg(platform: string) {
  return PLATFORM_CONFIG[platform.toLowerCase()] ?? {
    bg: '#f8fafc', border: '#e2e8f0', text: '#475569', dot: '#94a3b8', gradientFrom: '#f1f5f9', gradientTo: '#f8fafc'
  }
}

function PlatformIcon({ platform, size = 13 }: { platform: string; size?: number }) {
  const cls = `shrink-0`
  switch (platform.toLowerCase()) {
    case 'linkedin':  return <Linkedin  size={size} className={cls} style={{ color: '#0a66c2' }} />
    case 'instagram': return <Instagram size={size} className={cls} style={{ color: '#e1306c' }} />
    case 'facebook':  return <Facebook  size={size} className={cls} style={{ color: '#1877f2' }} />
    case 'twitter':   return <Twitter   size={size} className={cls} style={{ color: '#1da1f2' }} />
    case 'x':         return <X         size={size} className={cls} style={{ color: '#000' }} />
    default:          return <Share2    size={size} className={cls} style={{ color: '#94a3b8' }} />
  }
}

// ─── Health helpers ──────────────────────────────────────────────────────────

const HEALTH_CONFIG: Record<string, { color: string; label: string; tagColor: string }> = {
  'on track':      { color: '#22c55e', label: 'On Track',      tagColor: 'success' },
  'upcoming':      { color: '#f59e0b', label: 'Upcoming',      tagColor: 'warning' },
  'needs attention':{ color: '#ef4444', label: 'Needs Attn.',  tagColor: 'error'   },
  'delayed':       { color: '#ef4444', label: 'Delayed',       tagColor: 'error'   },
}
function getHealthCfg(h: string) {
  return HEALTH_CONFIG[h.toLowerCase()] ?? { color: '#94a3b8', label: h, tagColor: 'default' }
}

// ─── Status helper ───────────────────────────────────────────────────────────
const STATUS_TAG: Record<string, string> = {
  published: 'success', scheduled: 'blue', planned: 'cyan', draft: 'default'
}
function getStatusColor(s: string) { return STATUS_TAG[s.toLowerCase()] ?? 'default' }

// ─── Calendar grid ────────────────────────────────────────────────────────────
function buildMonthGrid(date: Date) {
  const yr = date.getFullYear(), mo = date.getMonth()
  const firstDow = new Date(yr, mo, 1).getDay()
  const daysInMonth = new Date(yr, mo + 1, 0).getDate()
  const prevDays = new Date(yr, mo, 0).getDate()
  const cells: { date: Date; current: boolean }[] = []
  for (let i = firstDow - 1; i >= 0; i--)
    cells.push({ date: new Date(yr, mo - 1, prevDays - i), current: false })
  for (let d = 1; d <= daysInMonth; d++)
    cells.push({ date: new Date(yr, mo, d), current: true })
  const remaining = 42 - cells.length
  for (let i = 1; i <= remaining; i++)
    cells.push({ date: new Date(yr, mo + 1, i), current: false })
  return cells
}

function isSameDay(a: Date, b: Date) {
  return a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear()
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function CalendarPage() {
  const [content, setContent] = useState<ContentMaster[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [searchTerm, setSearchTerm]       = useState('')
  const [filterPlatform, setFilterPlatform] = useState('')
  const [filterStatus, setFilterStatus]   = useState('')

  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedItem, setSelectedItem] = useState<ContentMaster | null>(null)
  const [editFormData, setEditFormData] = useState<Partial<ContentMaster>>({})

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [cRes, clRes, cpRes] = await Promise.all([
        fetch('/api/content-master'),
        fetch('/api/clients'),
        fetch('/api/campaigns'),
      ])
      const cData  = await cRes.json()
      const clData = await clRes.json()
      const cpData = await cpRes.json()
      if (Array.isArray(cData))  setContent(cData.filter(i => i.publishDate))
      if (Array.isArray(clData)) setClients(clData)
      if (Array.isArray(cpData)) setCampaigns(cpData)
    } catch { message.error('Failed to load calendar data') }
    finally  { setLoading(false) }
  }

  const handleOpenEdit = (item: ContentMaster) => {
    setSelectedDate(null)
    setSelectedItem(item)
    setEditFormData({ ...item })
  }

  const handleSave = async () => {
    if (!selectedItem) return
    setSaving(true)
    try {
      const res = await fetch(`/api/content-master/${selectedItem.contentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editFormData,
          publishDate: editFormData.publishDate
            ? new Date(editFormData.publishDate).toISOString()
            : null,
        }),
      })
      if (res.ok) { message.success('Saved!'); setSelectedItem(null); loadData() }
      else        { message.error('Failed to save') }
    } catch { message.error('Error saving') }
    finally { setSaving(false) }
  }

  const handleReschedule = async (contentId: string, newDate: Date) => {
    setSaving(true)
    try {
      const res = await fetch(`/api/content-master/${contentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          publishDate: newDate.toISOString(),
        }),
      })
      if (res.ok) {
        message.success(`Successfully rescheduled content to ${dayjs(newDate).format('MMM D, YYYY')}`)
        loadData()
      } else {
        message.error('Failed to reschedule content')
      }
    } catch {
      message.error('Error during rescheduling')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedItem) return
    if (!confirm(`Delete "${selectedItem.contentTitle}"?`)) return
    setSaving(true)
    try {
      const res = await fetch(`/api/content-master/${selectedItem.contentId}`, { method: 'DELETE' })
      if (res.ok) { message.success('Deleted'); setSelectedItem(null); loadData() }
      else        { message.error('Failed to delete') }
    } catch { message.error('Error deleting') }
    finally { setSaving(false) }
  }

  // ── Filtered list ──────────────────────────────────────────────────────────
  const filtered = content.filter(item => {
    const q = searchTerm.toLowerCase()
    const matchSearch = !q || item.contentTitle.toLowerCase().includes(q) ||
      (item.topic ?? '').toLowerCase().includes(q) ||
      (item.caption ?? '').toLowerCase().includes(q)
    const matchPlat   = !filterPlatform || item.platform === filterPlatform
    const matchStatus = !filterStatus   || item.status   === filterStatus
    return matchSearch && matchPlat && matchStatus
  })

  const getItemsForDay = (d: Date) => filtered.filter(i => i.publishDate && isSameDay(new Date(i.publishDate), d))

  // ── Stats ──────────────────────────────────────────────────────────────────
  const totalScheduled = filtered.length
  const totalPublished = filtered.filter(i => i.status === 'Published').length
  const totalUpcoming  = filtered.filter(i => i.status !== 'Published' && i.status !== 'Draft').length
  const needsAttn      = filtered.filter(i => ['needs attention','delayed'].includes(i.healthStatus.toLowerCase())).length

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-slate-500">
        <div className="relative w-14 h-14">
          <div className="absolute inset-0 rounded-full border-4 border-blue-100" />
          <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
        </div>
        <p className="font-semibold text-sm animate-pulse">Loading Content Calendar…</p>
      </div>
    )
  }

  const monthLabel = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const today      = new Date()
  const cells      = buildMonthGrid(currentDate)

  return (
    <div className="space-y-6 max-w-7xl mx-auto" style={{ fontFamily: "'Inter', -apple-system, sans-serif" }}>

      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-500/30">
              <CalendarDays size={22} />
            </div>
            <div>
              <Title level={2} className="!mb-0 !font-extrabold tracking-tight !text-slate-900">
                Content Calendar
              </Title>
              <p className="text-slate-500 text-sm">Plan and track publication schedules across all campaigns.</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats Row ───────────────────────────────────────────────────── */}
      <Row gutter={[16, 16]}>
        {[
          { icon: <LayoutGrid size={18} />, bg: 'bg-blue-50', col: 'text-blue-600', label: 'Total Scheduled', value: totalScheduled, vStyle: {} },
          { icon: <CheckCircle size={18} />, bg: 'bg-emerald-50', col: 'text-emerald-600', label: 'Published', value: totalPublished, vStyle: { color: '#16a34a' } },
          { icon: <Clock size={18} />, bg: 'bg-amber-50', col: 'text-amber-600', label: 'Upcoming', value: totalUpcoming, vStyle: { color: '#d97706' } },
          { icon: <AlertCircle size={18} />, bg: needsAttn > 0 ? 'bg-rose-50 animate-pulse' : 'bg-slate-50', col: needsAttn > 0 ? 'text-rose-600' : 'text-slate-400', label: 'Needs Attention', value: needsAttn, vStyle: needsAttn > 0 ? { color: '#e11d48' } : {} },
        ].map((s, i) => (
          <Col key={i} xs={12} sm={12} lg={6}>
            <Card
              bordered={false}
              className="rounded-2xl border border-slate-100/80 hover:shadow-md transition-all duration-300"
              bodyStyle={{ padding: 16 }}
              style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${s.bg} ${s.col}`}>{s.icon}</div>
                <Statistic title={s.label} value={s.value} valueStyle={{ fontWeight: 800, fontSize: 20, ...s.vStyle }} />
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* ── Filters ─────────────────────────────────────────────────────── */}
      <Card
        bordered={false}
        className="rounded-2xl border border-slate-100/80"
        bodyStyle={{ padding: 16 }}
        style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
      >
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <Input
            prefix={<Search size={15} className="text-slate-400 mr-1" />}
            placeholder="Search by title, topic, caption…"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            allowClear
            className="flex-1 rounded-xl"
            style={{ background: '#f8fafc' }}
          />
          <div className="flex items-center gap-2 flex-wrap">
            <Filter size={14} className="text-slate-400 hidden md:block" />
            <Select
              value={filterPlatform || undefined}
              onChange={v => setFilterPlatform(v ?? '')}
              placeholder="All Platforms"
              allowClear
              className="w-40 font-semibold"
              options={['LinkedIn','Instagram','Twitter','Facebook','YouTube'].map(p => ({ value: p, label: p }))}
            />
            <Select
              value={filterStatus || undefined}
              onChange={v => setFilterStatus(v ?? '')}
              placeholder="All Statuses"
              allowClear
              className="w-36 font-semibold"
              options={['Draft','Planned','Scheduled','Published'].map(s => ({ value: s, label: s }))}
            />
            {(filterPlatform || filterStatus || searchTerm) && (
              <Button
                danger ghost size="small"
                onClick={() => { setFilterPlatform(''); setFilterStatus(''); setSearchTerm('') }}
              >
                Clear
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* ── Calendar Grid ────────────────────────────────────────────────── */}
      <Card
        bordered={false}
        className="rounded-3xl border border-slate-100/80 overflow-hidden"
        bodyStyle={{ padding: 0 }}
        style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
      >
        {/* Calendar Header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)', color: '#fff' }}
        >
          <div className="flex items-center gap-3">
            <Calendar size={20} style={{ color: 'rgba(255,255,255,0.8)' }} />
            <span className="text-xl font-extrabold tracking-tight">{monthLabel}</span>
          </div>
          <Space>
            <Button
              icon={<ChevronLeft size={16} />}
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
              style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', borderRadius: 8 }}
            />
            <Button
              onClick={() => setCurrentDate(new Date())}
              icon={<Zap size={14} />}
              style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', fontWeight: 700, borderRadius: 8 }}
            >
              Today
            </Button>
            <Button
              icon={<ChevronRight size={16} />}
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
              style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', borderRadius: 8 }}
            />
          </Space>
        </div>

        {/* Day Labels */}
        <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200">
          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
            <div key={d} className="py-3 text-center text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
              {d}
            </div>
          ))}
        </div>

        {/* Day Cells */}
        <div className="grid grid-cols-7" style={{ background: '#f1f5f9' }}>
          {cells.map((cell, idx) => {
            const items   = getItemsForDay(cell.date)
            const isToday = isSameDay(cell.date, today)
            const isSelected = selectedDate && isSameDay(cell.date, selectedDate)
            const maxVisible = 3

            return (
              <div
                key={idx}
                onClick={() => setSelectedDate(cell.date)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={async (e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  const id = e.dataTransfer.getData('text/plain')
                  if (id) {
                    await handleReschedule(id, cell.date)
                  }
                }}
                className="relative cursor-pointer transition-all duration-200"
                style={{
                  background: isSelected ? '#eff6ff' : '#ffffff',
                  minHeight: 110,
                  borderRight: '1px solid #e2e8f0',
                  borderBottom: '1px solid #e2e8f0',
                  opacity: cell.current ? 1 : 0.45,
                  boxShadow: isSelected ? 'inset 0 0 0 2px #3b82f6' : undefined,
                }}
              >
                {/* Date Number */}
                <div className="flex items-center justify-between p-2">
                  <span
                    className="text-xs font-bold flex items-center justify-center transition-all"
                    style={{
                      width: 24, height: 24, borderRadius: '50%',
                      background: isToday ? '#2563eb' : 'transparent',
                      color: isToday ? '#fff' : isSelected ? '#2563eb' : '#374151',
                      fontWeight: isToday || isSelected ? 800 : 600,
                      boxShadow: isToday ? '0 2px 8px rgba(37,99,235,0.35)' : undefined,
                    }}
                  >
                    {cell.date.getDate()}
                  </span>
                  {items.length > 0 && (
                    <span
                      className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{ background: '#dbeafe', color: '#1d4ed8' }}
                    >
                      {items.length}
                    </span>
                  )}
                </div>

                {/* Content Badges — Desktop */}
                <div className="hidden md:flex flex-col gap-0.5 px-1.5 pb-2">
                  {items.slice(0, maxVisible).map(item => {
                    const cfg = getPlatformCfg(item.platform)
                    const health = getHealthCfg(item.healthStatus)
                    return (
                      <button
                        key={item.contentId}
                        onClick={e => { e.stopPropagation(); handleOpenEdit(item) }}
                        draggable="true"
                        onDragStart={(e) => {
                          e.stopPropagation()
                          e.dataTransfer.setData('text/plain', item.contentId)
                        }}
                        className="w-full text-left flex items-center gap-1 px-1.5 py-0.5 rounded-md transition-all duration-150 hover:scale-[1.03] hover:shadow-sm text-[10px] font-semibold truncate"
                        style={{
                          background: `linear-gradient(90deg, ${cfg.gradientFrom}, ${cfg.gradientTo})`,
                          border: `1px solid ${cfg.border}`,
                          color: cfg.text,
                        }}
                        title={item.contentTitle}
                      >
                        <PlatformIcon platform={item.platform} size={9} />
                        <span className="truncate flex-1">{item.contentTitle}</span>
                        <span className="shrink-0 w-1.5 h-1.5 rounded-full" style={{ background: health.color }} />
                      </button>
                    )
                  })}
                  {items.length > maxVisible && (
                    <span className="text-[9px] text-slate-500 font-bold px-1.5">
                      +{items.length - maxVisible} more
                    </span>
                  )}
                </div>

                {/* Dots — Mobile */}
                <div className="flex md:hidden flex-wrap gap-1 px-2 pb-2 justify-center">
                  {items.map(item => {
                    const cfg = getPlatformCfg(item.platform)
                    return (
                      <span
                        key={item.contentId}
                        className="w-2 h-2 rounded-full border"
                        style={{ background: cfg.dot, borderColor: cfg.border }}
                        title={item.contentTitle}
                      />
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* ── Date Detail Drawer ───────────────────────────────────────────── */}
      <Drawer
        title={
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color: '#3b82f6' }}>
              Daily Schedule
            </span>
            <Title level={4} className="!mb-0 !font-extrabold !tracking-tight">
              {selectedDate ? dayjs(selectedDate).format('dddd, MMMM D YYYY') : ''}
            </Title>
          </div>
        }
        placement="right"
        width={380}
        onClose={() => setSelectedDate(null)}
        open={!!selectedDate}
        destroyOnClose
        bodyStyle={{ background: '#f8fafc', padding: 16 }}
      >
        <div className="space-y-3">
          {selectedDate && getItemsForDay(selectedDate).length === 0 ? (
            <div className="py-16 text-center">
              <Empty
                description={
                  <span className="text-slate-400 font-medium">No content scheduled for this date.</span>
                }
              />
            </div>
          ) : (
            selectedDate && getItemsForDay(selectedDate).map(item => {
              const cfg    = getPlatformCfg(item.platform)
              const health = getHealthCfg(item.healthStatus)
              return (
                <div
                  key={item.contentId}
                  onClick={() => handleOpenEdit(item)}
                  className="group rounded-2xl p-4 cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
                  style={{
                    background: '#fff',
                    border: `1.5px solid ${cfg.border}`,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  }}
                >
                  {/* Top row: platform + health */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="p-1.5 rounded-lg"
                        style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
                      >
                        <PlatformIcon platform={item.platform} size={14} />
                      </div>
                      <span className="text-[11px] font-extrabold uppercase tracking-widest" style={{ color: cfg.text }}>
                        {item.platform}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ background: health.color }} />
                      <span className="text-[10px] font-bold uppercase text-slate-500">{health.label}</span>
                    </div>
                  </div>

                  {/* Title */}
                  <p className="font-bold text-slate-800 text-sm leading-snug line-clamp-2 mb-3 group-hover:text-blue-600 transition-colors">
                    {item.contentTitle}
                  </p>

                  {/* Footer */}
                  <div className="flex items-center justify-between border-t border-slate-100 pt-2.5">
                    <span className="flex items-center gap-1.5 text-[11px] text-slate-500 font-semibold">
                      <Clock size={11} /> {item.publishTime || 'TBD'}
                    </span>
                    <Tag
                      color={getStatusColor(item.status)}
                      style={{ fontSize: 9, fontWeight: 800, margin: 0, letterSpacing: '0.05em' }}
                    >
                      {item.status.toUpperCase()}
                    </Tag>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </Drawer>

      {/* ── Edit Drawer ──────────────────────────────────────────────────── */}
      <Drawer
        title={
          <div>
            <Tag color="blue" style={{ fontWeight: 700, letterSpacing: '0.04em', marginBottom: 6 }}>
              {selectedItem?.contentId}
            </Tag>
            <Title level={4} style={{ margin: 0 }}>Edit Content</Title>
          </div>
        }
        placement="right"
        width={520}
        onClose={() => setSelectedItem(null)}
        open={!!selectedItem}
        bodyStyle={{ paddingBottom: 80 }}
        extra={
          <Button danger ghost icon={<Trash2 size={14} />} loading={saving} onClick={handleDelete}>
            Delete
          </Button>
        }
        footer={
          <div className="flex justify-end gap-2 py-2">
            <Button onClick={() => setSelectedItem(null)} disabled={saving}>Cancel</Button>
            <Button type="primary" loading={saving} onClick={handleSave}>Save Changes</Button>
          </div>
        }
      >
        {selectedItem && (
          <Form layout="vertical" className="space-y-2">
            <Form.Item label={<Text strong style={{ fontSize: 12 }}>CONTENT TITLE</Text>} required>
              <Input
                value={editFormData.contentTitle || ''}
                onChange={e => setEditFormData({ ...editFormData, contentTitle: e.target.value })}
                size="large"
              />
            </Form.Item>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label={<Text strong style={{ fontSize: 12 }}>CLIENT</Text>}>
                  <Select
                    value={editFormData.clientId || ''}
                    onChange={v => setEditFormData({ ...editFormData, clientId: v, campaignId: '' })}
                    size="large"
                    options={[{ value: '', label: 'Unassigned' }, ...clients.map(c => ({ value: c.clientName, label: c.clientName }))]}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label={<Text strong style={{ fontSize: 12 }}>CAMPAIGN</Text>}>
                  <Select
                    value={editFormData.campaignId || ''}
                    onChange={v => setEditFormData({ ...editFormData, campaignId: v })}
                    disabled={!editFormData.clientId}
                    size="large"
                    options={[
                      { value: '', label: 'Select campaign…' },
                      ...campaigns.filter(c => c.clientId === editFormData.clientId).map(c => ({ value: c.campaignId, label: c.campaignName })),
                    ]}
                  />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label={<Text strong style={{ fontSize: 12 }}>STATUS</Text>}>
                  <Select
                    value={editFormData.status || ''}
                    onChange={v => setEditFormData({ ...editFormData, status: v })}
                    size="large"
                    options={['Draft','Planned','Scheduled','Published'].map(s => ({ value: s, label: s }))}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label={<Text strong style={{ fontSize: 12 }}>HEALTH</Text>}>
                  <Select
                    value={editFormData.healthStatus || ''}
                    onChange={v => setEditFormData({ ...editFormData, healthStatus: v })}
                    size="large"
                    options={['On Track','Upcoming','Needs Attention','Delayed'].map(s => ({ value: s, label: s }))}
                  />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={12}>
              <Col span={8}>
                <Form.Item label={<Text strong style={{ fontSize: 12 }}>PLATFORM</Text>}>
                  <Select
                    value={editFormData.platform || ''}
                    onChange={v => setEditFormData({ ...editFormData, platform: v })}
                    size="large"
                    options={['LinkedIn','Instagram','Twitter','Facebook','YouTube'].map(p => ({ value: p, label: p }))}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label={<Text strong style={{ fontSize: 12 }}>PUBLISH DATE</Text>}>
                  <input
                    type="date"
                    value={editFormData.publishDate ? editFormData.publishDate.split('T')[0] : ''}
                    onChange={e => setEditFormData({ ...editFormData, publishDate: e.target.value ? new Date(e.target.value).toISOString() : null })}
                    className="w-full rounded-md border border-slate-200 px-3 py-1.5 text-sm outline-none bg-white"
                    style={{ height: 40 }}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label={<Text strong style={{ fontSize: 12 }}>PUBLISH TIME</Text>}>
                  <input
                    type="time"
                    value={editFormData.publishTime || ''}
                    onChange={e => setEditFormData({ ...editFormData, publishTime: e.target.value })}
                    className="w-full rounded-md border border-slate-200 px-3 py-1.5 text-sm outline-none bg-white"
                    style={{ height: 40 }}
                  />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        )}
      </Drawer>
    </div>
  )
}
