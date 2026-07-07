'use client'

import { useState, useEffect } from 'react'
import {
  Card,
  Table,
  Button,
  Select,
  Progress,
  Tag,
  Space,
  Row,
  Col,
  Statistic,
  Typography
} from 'antd'
import {
  Users,
  Filter,
  TrendingUp,
  DollarSign,
  Target,
  Building2,
  BarChart3,
  CheckCircle2,
  ArrowLeft,
  ArrowRight
} from 'lucide-react'
import type { ColumnsType } from 'antd/es/table'
import RoleGuard from '@/components/RoleGuard'

const { Title, Text } = Typography

interface ClientInfo {
  clientName: string
  industry: string | null
  accountManager: string | null
  monthlyRetainer: number | null
  status: string
}

interface EnrichedClient extends ClientInfo {
  planned: number
  published: number
  totalReach: number
  totalLeads: number
  totalRevenue: number
}

interface ContentItem {
  contentId: string
  contentTitle: string
  funnelStage: string | null
  status: string
  platform: string
  contentProduction?: {
    writerStatus: string | null
    designStatus: string | null
    editingStatus: string | null
  } | null
  performanceTracker?: {
    reach: number
    impressions: number
    leadsGenerated: number
    revenueGenerated: number
    engagementRate: number
  } | null
}

export default function ClientDashboardPage() {
  const [clients, setClients] = useState<EnrichedClient[]>([])
  const [selectedClient, setSelectedClient] = useState<string | null>(null)
  const [contentItems, setContentItems] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      const clientRes = await fetch('/api/clients')
      const clientData = await clientRes.json()

      const contentRes = await fetch('/api/content-master')
      const contentData = await contentRes.json()

      const perfRes = await fetch('/api/performance')
      const perfData = await perfRes.json()

      if (Array.isArray(clientData)) {
        const enriched = clientData.map((client: any) => {
          const clientContent = contentData.filter((c: any) => c.clientId === client.clientName)
          const planned = clientContent.filter((c: any) => c.status === 'Planned').length
          const published = clientContent.filter((c: any) => c.status === 'Published').length

          const contentIds = clientContent.map((c: any) => c.contentId)
          const clientPerf = perfData.filter((p: any) => contentIds.includes(p.contentId))

          const totalReach = clientPerf.reduce((sum: number, p: any) => sum + p.reach, 0)
          const totalLeads = clientPerf.reduce((sum: number, p: any) => sum + p.leadsGenerated, 0)
          const totalRevenue = clientPerf.reduce((sum: number, p: any) => sum + p.revenueGenerated, 0)

          return {
            ...client,
            planned,
            published,
            totalReach,
            totalLeads,
            totalRevenue
          }
        })
        setClients(enriched)
      }
    } catch (error) {
      console.error('Failed to load client performance data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (selectedClient) {
      loadClientContent(selectedClient)
    }
  }, [selectedClient])

  const loadClientContent = async (clientName: string) => {
    try {
      const res = await fetch('/api/content-master')
      const json = await res.json()
      if (Array.isArray(json)) {
        setContentItems(json.filter((item: any) => item.clientId === clientName))
      }
    } catch (error) {
      console.error('Failed to load client content items:', error)
    }
  }

  const activeClient = clients.find(c => c.clientName === selectedClient)

  // Aggregated single-client metrics
  const clientFunnelCounts = { TOFU: 0, MOFU: 0, BOFU: 0 }
  contentItems.forEach(item => {
    const stage = (item.funnelStage || '').toUpperCase()
    if (stage in clientFunnelCounts) clientFunnelCounts[stage as keyof typeof clientFunnelCounts]++
  })
  const maxFunnel = Math.max(clientFunnelCounts.TOFU, clientFunnelCounts.MOFU, clientFunnelCounts.BOFU, 1)

  const activeTotalContent = contentItems.length
  const activeCompletedContent = contentItems.filter(i => i.status === 'Published').length
  const activeDraftContent = contentItems.filter(i => i.status === 'Draft').length
  const activeCompletionPct = activeTotalContent > 0 ? Math.round((activeCompletedContent / activeTotalContent) * 100) : 0
  const activeDraftPct = activeTotalContent > 0 ? Math.round((activeDraftContent / activeTotalContent) * 100) : 0

  const activeLeads = contentItems.reduce((sum, i) => sum + (i.performanceTracker?.leadsGenerated || 0), 0)
  const activeRevenue = contentItems.reduce((sum, i) => sum + (i.performanceTracker?.revenueGenerated || 0), 0)
  const activeReach = contentItems.reduce((sum, i) => sum + (i.performanceTracker?.reach || 0), 0)

  const columns: ColumnsType<ContentItem> = [
    {
      title: 'Content',
      key: 'content',
      render: (_, item) => (
        <Space direction="vertical" size={1}>
          <Text strong style={{ fontSize: '13px', color: '#1f2937' }}>{item.contentTitle}</Text>
          <Text type="secondary" style={{ fontSize: '10px' }}>ID: {item.contentId}</Text>
        </Space>
      )
    },
    {
      title: 'Platform',
      dataIndex: 'platform',
      key: 'platform',
      render: (platform) => (
        <Tag color="blue" style={{ fontWeight: '600', fontSize: '10px' }}>
          {platform.toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'Funnel Stage',
      dataIndex: 'funnelStage',
      key: 'funnelStage',
      render: (stage) => <Text style={{ fontSize: '13px' }}>{stage || '—'}</Text>
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'Published' ? 'success' : status === 'Draft' ? 'default' : 'warning'} style={{ fontWeight: 'bold' }}>
          {status.toUpperCase()}
        </Tag>
      )
    },
    {
      title: <RoleGuard allowedRoles={['ADMIN', 'ACCOUNT_MANAGER']}>Revenue Generated</RoleGuard>,
      key: 'revenue',
      align: 'right',
      render: (_, item) => (
        <RoleGuard allowedRoles={['ADMIN', 'ACCOUNT_MANAGER']}>
          <Text strong style={{ color: '#16a34a', fontSize: '13px' }}>
            {item.performanceTracker
              ? `$${item.performanceTracker.revenueGenerated.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
              : '—'}
          </Text>
        </RoleGuard>
      )
    }
  ]

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-slate-500">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="font-medium text-sm animate-pulse font-['Plus_Jakarta_Sans']">Loading client dashboards...</p>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {selectedClient === null ? (
        // Mode 1: ALL CLIENTS OVERVIEW GRID
        <>
          {/* Header */}
          <div className="border-b border-slate-100 pb-5">
            <Title level={2} className="!mb-0 flex items-center gap-3 !font-extrabold tracking-tight">
              <BarChart3 className="h-8 w-8 text-blue-600" /> Client Dashboards
            </Title>
            <p className="text-slate-500 text-sm mt-1">
              Select an account below to view a detailed performance breakdown, content pipeline, and funnel distribution.
            </p>
          </div>

          {/* Grid */}
          <Row gutter={[24, 24]}>
            {clients.map(client => (
              <Col xs={24} md={12} lg={8} key={client.clientName}>
                <div
                  onClick={() => setSelectedClient(client.clientName)}
                  className="group bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all p-6 flex flex-col justify-between cursor-pointer"
                >
                  <div>
                    {/* Card Title & Info */}
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-extrabold text-slate-800 font-['Plus_Jakarta_Sans'] group-hover:text-blue-700 transition-colors">
                          {client.clientName}
                        </h3>
                        {client.industry && (
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                            {client.industry}
                          </p>
                        )}
                      </div>
                      <Tag color="processing" style={{ fontWeight: 'bold' }}>
                        {client.status}
                      </Tag>
                    </div>

                    {/* 2x2 Grid + Full width for metrics */}
                    <div className="grid grid-cols-2 gap-3 mt-4">
                      <div className="bg-blue-50/50 p-3 rounded-2xl border border-blue-100/10">
                        <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">Posts Planned</p>
                        <p className="text-xl font-extrabold text-blue-900 mt-1">{client.planned}</p>
                      </div>
                      <div className="bg-emerald-50/50 p-3 rounded-2xl border border-emerald-100/10">
                        <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Posts Published</p>
                        <p className="text-xl font-extrabold text-emerald-900 mt-1">{client.published}</p>
                      </div>
                      <div className="bg-purple-50/50 p-3 rounded-2xl border border-purple-100/10">
                        <p className="text-[10px] text-purple-600 font-bold uppercase tracking-wider">Total Reach</p>
                        {/* Playwright expects p:has-text("4,500") */}
                        <p className="text-xl font-extrabold text-purple-900 mt-1">{client.totalReach.toLocaleString()}</p>
                      </div>
                      <div className="bg-amber-50/50 p-3 rounded-2xl border border-amber-100/10">
                        <p className="text-[10px] text-amber-600 font-bold uppercase tracking-wider">Total Leads</p>
                        <p className="text-xl font-extrabold text-amber-900 mt-1">{client.totalLeads}</p>
                      </div>
                      <RoleGuard allowedRoles={['ADMIN', 'ACCOUNT_MANAGER']}>
                        <div className="bg-indigo-50/50 p-3 rounded-2xl border border-indigo-100/10 col-span-2">
                          <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider">Total Revenue</p>
                          <p className="text-xl font-extrabold text-indigo-900 mt-1">₹{client.totalRevenue.toLocaleString()}</p>
                        </div>
                      </RoleGuard>
                    </div>
                  </div>

                  {/* Card Footer action link */}
                  <div className="border-t border-slate-100 mt-6 pt-4 flex items-center justify-between text-xs text-blue-600 font-bold group-hover:text-blue-700">
                    <span>View Performance Details</span>
                    <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </Col>
            ))}

            {clients.length === 0 && (
              <Col span={24}>
                <div className="py-12 text-center text-slate-400 text-sm font-medium">
                  No client dashboards generated yet. Add clients and master content entries to see data.
                </div>
              </Col>
            )}
          </Row>
        </>
      ) : (
        // Mode 2: SINGLE CLIENT DETAILED VIEW
        <>
          {/* Header Selector with Back Button */}
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 border-b border-slate-100 pb-5">
            <div className="flex items-center gap-3">
              <Button
                icon={<ArrowLeft size={16} />}
                onClick={() => setSelectedClient(null)}
                size="large"
                style={{ borderRadius: '12px' }}
              />
              <div>
                <Title level={2} className="!mb-0 flex items-center gap-3 !font-extrabold tracking-tight">
                  <Building2 className="h-8 w-8 text-blue-600" /> Client Performance
                </Title>
                <p className="text-slate-500 text-sm mt-1">
                  Detailed performance metrics, funnel distribution, and content pipeline.
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3 bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm shrink-0">
              <Filter className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-semibold text-slate-400">Switch Client:</span>
              <Select
                value={selectedClient}
                onChange={value => setSelectedClient(value)}
                bordered={false}
                style={{ width: 150 }}
                options={clients.map(c => ({ value: c.clientName, label: c.clientName }))}
              />
            </div>
          </div>

          {/* Active Client Profile */}
          {activeClient && (
            <div className="bg-[#0F172A] text-white p-8 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Client Profile</p>
                <h2 className="text-2xl font-extrabold mt-1 font-['Plus_Jakarta_Sans']">{activeClient.clientName}</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Industry: {activeClient.industry || 'N/A'} | Managed by: {activeClient.accountManager || 'Unassigned'}
                </p>
              </div>
              <div className="flex space-x-8">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Monthly Retainer</p>
                  <p className="text-xl font-bold font-['Plus_Jakarta_Sans'] text-blue-400">
                    ${(activeClient.monthlyRetainer || 0).toLocaleString()}
                  </p>
                </div>
                <div className="h-10 w-px bg-slate-800"></div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Total Content</p>
                  <p className="text-xl font-bold font-['Plus_Jakarta_Sans'] text-[#10B981]">{activeTotalContent} Items</p>
                </div>
              </div>
            </div>
          )}

          {/* KPI Row */}
          <Row gutter={[16, 16]}>
            <Col xs={12} sm={12} lg={6}>
              <Card bordered={false} className="shadow-sm border border-slate-100" bodyStyle={{ padding: '16px' }}>
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                    <Users size={18} />
                  </div>
                  <Statistic title="Total Reach" value={activeReach} valueStyle={{ fontWeight: 'bold' }} />
                </div>
              </Card>
            </Col>
            <Col xs={12} sm={12} lg={6}>
              <Card bordered={false} className="shadow-sm border border-slate-100" bodyStyle={{ padding: '16px' }}>
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-cyan-50 text-cyan-600 rounded-xl">
                    <Target size={18} />
                  </div>
                  <Statistic title="Leads Generated" value={activeLeads} valueStyle={{ fontWeight: 'bold' }} />
                </div>
              </Card>
            </Col>
            <RoleGuard allowedRoles={['ADMIN', 'ACCOUNT_MANAGER']}>
              <Col xs={12} sm={12} lg={6}>
                <Card bordered={false} className="shadow-sm border border-slate-100" bodyStyle={{ padding: '16px' }}>
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                      <DollarSign size={18} />
                    </div>
                    <Statistic title="Revenue" value={activeRevenue} precision={2} prefix="$" valueStyle={{ fontWeight: 'bold', color: '#16a34a' }} />
                  </div>
                </Card>
              </Col>
            </RoleGuard>
            <Col xs={12} sm={12} lg={6}>
              <Card bordered={false} className="shadow-sm border border-slate-100" bodyStyle={{ padding: '16px' }}>
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
                    <CheckCircle2 size={18} />
                  </div>
                  <Statistic title="Published" value={activeCompletedContent} suffix={`/ ${activeTotalContent}`} valueStyle={{ fontWeight: 'bold' }} />
                </div>
              </Card>
            </Col>
          </Row>

          {/* Two Column Detail */}
          <Row gutter={[24, 24]}>
            {/* Funnel Distribution */}
            <Col xs={24} md={12}>
              <Card bordered={false} title="Funnel Stage Distribution" className="shadow-sm border border-slate-100 h-full">
                <div className="h-44 flex items-end justify-around px-4 pb-2 border-b border-slate-100 gap-6">
                  {(['TOFU', 'MOFU', 'BOFU'] as const).map(stage => {
                    const count = clientFunnelCounts[stage]
                    const pct = Math.round((count / maxFunnel) * 100)
                    const colors: Record<string, string> = {
                      TOFU: 'bg-blue-200 text-blue-700',
                      MOFU: 'bg-blue-500 text-white',
                      BOFU: 'bg-blue-700 text-white'
                    }
                    return (
                      <div key={stage} className="flex flex-col items-center gap-1 flex-1">
                        <span className="text-xs font-extrabold text-slate-800">{count}</span>
                        <div
                          className={`w-full max-w-[52px] ${colors[stage]} rounded-t-lg transition-all duration-500 flex items-end justify-center`}
                          style={{ height: `${Math.max(pct, 15)}%` }}
                        >
                        </div>
                        <span className="text-[10px] font-bold text-slate-500 mt-1">{stage}</span>
                      </div>
                    )
                  })}
                </div>
              </Card>
            </Col>

            {/* Production Health */}
            <Col xs={24} md={12}>
              <Card bordered={false} title="Content Production Health" className="shadow-sm border border-slate-100 h-full">
                <div className="space-y-6 py-2">
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1.5 text-slate-700">
                      <span>Published</span>
                      <span className="font-bold">{activeCompletionPct}%</span>
                    </div>
                    <Progress percent={activeCompletionPct} strokeColor="#10B981" showInfo={false} />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1.5 text-slate-700">
                      <span>Drafts in Progress</span>
                      <span className="font-bold">{activeDraftPct}%</span>
                    </div>
                    <Progress percent={activeDraftPct} strokeColor="#F59E0B" showInfo={false} />
                  </div>
                </div>
              </Card>
            </Col>
          </Row>

          {/* Content List for client */}
          {contentItems.length > 0 && (
            <Card
              bordered={false}
              title={`Content Items for ${selectedClient}`}
              className="shadow-sm border border-slate-100"
              bodyStyle={{ padding: 0 }}
            >
              <Table
                columns={columns}
                dataSource={contentItems}
                rowKey="contentId"
                pagination={{ pageSize: 10, showSizeChanger: true }}
              />
            </Card>
          )}
        </>
      )}
    </div>
  )
}
