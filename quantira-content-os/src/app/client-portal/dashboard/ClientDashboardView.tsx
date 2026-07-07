'use client'

import React from 'react'
import { Card, Table, Statistic, Row, Col, Tag } from 'antd'
import { CalendarDays, CheckCircle2, Users, Target, DollarSign, Sparkles } from 'lucide-react'

interface ClientDashboardViewProps {
  clientName: string
  metrics: {
    planned: number
    published: number
    totalReach: number
    totalLeads: number
    totalRevenue: number
  }
  recentContent: {
    id: number
    contentId: string
    contentTitle: string
    platform: string
    status: string
    publishDate: string | null
  }[]
}

export default function ClientDashboardView({ clientName, metrics, recentContent }: ClientDashboardViewProps) {
  
  const columns = [
    {
      title: 'Content Title',
      dataIndex: 'contentTitle',
      key: 'contentTitle',
      render: (text: string, record: any) => (
        <div>
          <span className="font-bold text-slate-800 text-xs block">{text}</span>
          <span className="text-[10px] text-slate-400 font-mono">ID: {record.contentId}</span>
        </div>
      )
    },
    {
      title: 'Platform',
      dataIndex: 'platform',
      key: 'platform',
      render: (platform: string) => (
        <Tag color="blue" className="text-[10px] font-bold uppercase tracking-wider rounded border-none py-0.5 px-2">
          {platform}
        </Tag>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        let color = 'default'
        if (status === 'Published') color = 'success'
        else if (status === 'Planned') color = 'processing'
        else if (status === 'Draft' || status === 'Upcoming') color = 'warning'
        return (
          <Tag color={color} className="text-[10px] font-bold uppercase tracking-wider rounded border-none py-0.5 px-2">
            {status}
          </Tag>
        )
      }
    },
    {
      title: 'Publish Date',
      dataIndex: 'publishDate',
      key: 'publishDate',
      render: (dateStr: string | null) => (
        <span className="text-xs text-slate-500 font-medium">
          {dateStr ? new Date(dateStr).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
        </span>
      )
    }
  ]

  return (
    <div className="space-y-6">
      {/* Greeting Header */}
      <div className="border-b border-slate-100 pb-5">
        <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
          Welcome back, <span className="text-blue-600">{clientName}</span> <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
        </h1>
        <p className="text-slate-500 text-xs mt-1">Here is a quick overview of your campaign performance and content calendar status.</p>
      </div>

      {/* Metrics Row */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={8}>
          <Card bordered={false} className="shadow-sm border border-slate-100 rounded-2xl" styles={{ body: { padding: '20px' } }}>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl shrink-0">
                <CalendarDays size={20} />
              </div>
              <Statistic title={<span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Posts Planned</span>} value={metrics.planned} valueStyle={{ fontWeight: 'black', color: '#1e293b' }} />
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={8}>
          <Card bordered={false} className="shadow-sm border border-slate-100 rounded-2xl" styles={{ body: { padding: '20px' } }}>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl shrink-0">
                <CheckCircle2 size={20} />
              </div>
              <Statistic title={<span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Posts Published</span>} value={metrics.published} valueStyle={{ fontWeight: 'black', color: '#1e293b' }} />
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={8}>
          <Card bordered={false} className="shadow-sm border border-slate-100 rounded-2xl" styles={{ body: { padding: '20px' } }}>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl shrink-0">
                <Users size={20} />
              </div>
              <Statistic title={<span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Reach</span>} value={metrics.totalReach} valueStyle={{ fontWeight: 'black', color: '#1e293b' }} />
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={12}>
          <Card bordered={false} className="shadow-sm border border-slate-100 rounded-2xl" styles={{ body: { padding: '20px' } }}>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-cyan-50 text-cyan-600 rounded-2xl shrink-0">
                <Target size={20} />
              </div>
              <Statistic title={<span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Leads</span>} value={metrics.totalLeads} valueStyle={{ fontWeight: 'black', color: '#1e293b' }} />
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={12}>
          <Card bordered={false} className="shadow-sm border border-slate-100 rounded-2xl" styles={{ body: { padding: '20px' } }}>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl shrink-0">
                <DollarSign size={20} />
              </div>
              <Statistic title={<span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Revenue</span>} value={metrics.totalRevenue} precision={2} prefix="₹" valueStyle={{ fontWeight: 'black', color: '#10b981' }} />
            </div>
          </Card>
        </Col>
      </Row>

      {/* Content Table Card */}
      <Card bordered={false} className="shadow-sm border border-slate-100 rounded-2xl" title={<span className="text-sm font-bold text-slate-700">Recent Content Pipeline</span>}>
        <Table 
          columns={columns} 
          dataSource={recentContent} 
          rowKey="id" 
          pagination={{ pageSize: 5 }} 
          className="custom-table text-xs"
        />
      </Card>
    </div>
  )
}
