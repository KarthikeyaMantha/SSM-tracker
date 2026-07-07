'use client'

import { useState, useEffect } from 'react'
import {
  Card,
  Row,
  Col,
  Statistic,
  Input,
  Progress,
  Tag,
  Typography,
  Space,
  Button,
  message
} from 'antd'
import { Star, BadgeCheck, Search, TrendingUp, Award, BarChart3, Globe } from 'lucide-react'

const { Title, Text } = Typography

interface ScorecardItem {
  id: string
  contentId: string
  content: {
    contentTitle: string
    platform: string
    clientId: string | null
  }
  reachScore: number
  engagementScore: number
  leadScore: number
  conversionScore: number
  overallScore: number
}

export default function ScorecardPage() {
  const [data, setData] = useState<ScorecardItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      const res = await fetch('/api/scorecard')
      const json = await res.json()
      if (Array.isArray(json)) setData(json)
    } catch (error) {
      console.error('Failed to load scorecard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const exportToCSV = () => {
    try {
      const headers = ['Content ID', 'Title', 'Platform', 'Client', 'Reach Score', 'Engagement Score', 'Lead Score', 'Conversion Score', 'Overall Score']
      const rows = filtered.map(item => [
        item.contentId,
        `"${item.content.contentTitle.replace(/"/g, '""')}"`,
        item.content.platform,
        item.content.clientId || '-',
        item.reachScore,
        item.engagementScore,
        item.leadScore,
        item.conversionScore,
        item.overallScore
      ])

      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.setAttribute('href', url)
      link.setAttribute('download', `Quantira_Scorecard_Report_${new Date().toISOString().split('T')[0]}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      message.success('CSV Report exported successfully!')
    } catch (error) {
      console.error(error)
      message.error('Failed to export CSV report.')
    }
  }

  const filtered = data.filter(item =>
    item.content.contentTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.content.platform.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getGradeLabel = (score: number) => {
    if (score >= 9) return { label: 'Excellent', color: 'success' }
    if (score >= 7) return { label: 'Good', color: 'processing' }
    if (score >= 5) return { label: 'Average', color: 'warning' }
    return { label: 'Needs Improvement', color: 'error' }
  }

  const getProgressColor = (score: number) => {
    if (score >= 9) return '#10B981'
    if (score >= 7) return '#3B82F6'
    if (score >= 5) return '#F59E0B'
    return '#EF4444'
  }

  const avgScore = data.length > 0
    ? (data.reduce((sum, d) => sum + d.overallScore, 0) / data.length).toFixed(1)
    : '0.0'
  const topPerformer = data.length > 0
    ? data.reduce((best, d) => d.overallScore > best.overallScore ? d : best, data[0])
    : null

  // Calculate platform averages for leaderboard
  const platformStats: Record<string, { total: number; count: number }> = {}
  data.forEach(item => {
    const p = item.content.platform
    if (!platformStats[p]) platformStats[p] = { total: 0, count: 0 }
    platformStats[p].total += item.overallScore
    platformStats[p].count += 1
  })
  const platformLeaderboard = Object.keys(platformStats).map(p => ({
    platform: p,
    avg: Number((platformStats[p].total / platformStats[p].count).toFixed(1))
  })).sort((a, b) => b.avg - a.avg)

  const getPlatformTagColor = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'linkedin': return 'blue'
      case 'instagram': return 'magenta'
      case 'youtube': return 'red'
      case 'twitter': return 'cyan'
      default: return 'default'
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-slate-500">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="font-medium text-sm animate-pulse font-['Plus_Jakarta_Sans']">Loading scorecards...</p>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <Title level={2} className="!mb-0 flex items-center gap-3 !font-extrabold tracking-tight">
            <Award className="h-8 w-8 text-blue-600" /> Content Scorecard
          </Title>
          <p className="text-slate-500 text-sm mt-1">
            Review mathematical performance evaluations across multiple interaction parameters.
          </p>
        </div>
        <Button
          type="primary"
          onClick={exportToCSV}
          className="bg-blue-600 hover:bg-blue-700 text-xs font-bold rounded-xl h-10 px-4 flex items-center justify-center border-none shadow-sm shadow-blue-600/10"
        >
          Export CSV Report
        </Button>
      </div>

      {/* Summary Strip */}
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={12} lg={8}>
          <Card bordered={false} className="shadow-sm border border-slate-100" bodyStyle={{ padding: '16px' }}>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <BarChart3 size={20} />
              </div>
              <Statistic title="Content Tracked" value={data.length} valueStyle={{ fontWeight: 'bold' }} />
            </div>
          </Card>
        </Col>

        <Col xs={12} sm={12} lg={8}>
          <Card bordered={false} className="shadow-sm border border-slate-100" bodyStyle={{ padding: '16px' }}>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                <Star size={20} />
              </div>
              <Statistic title="Avg. Overall Score" value={Number(avgScore)} suffix="/ 10" valueStyle={{ fontWeight: 'bold', color: '#d97706' }} />
            </div>
          </Card>
        </Col>

        {topPerformer && (
          <Col xs={24} lg={8}>
            <Card bordered={false} className="shadow-sm border border-slate-100" bodyStyle={{ padding: '16px' }}>
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                  <TrendingUp size={20} />
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-medium text-slate-400">Top Performer</p>
                  <p className="text-sm font-extrabold text-slate-900 truncate" title={topPerformer.content.contentTitle}>
                    {topPerformer.content.contentTitle}
                  </p>
                </div>
              </div>
            </Card>
          </Col>
        )}
      </Row>

      {/* Leaderboard Row */}
      {platformLeaderboard.length > 0 && (
        <Card
          bordered={false}
          title={
            <span className="font-bold text-sm text-slate-800 tracking-tight flex items-center gap-2">
              <Globe className="w-4 h-4 text-indigo-500" /> Platform Leaderboard (Averages)
            </span>
          }
          className="shadow-sm border border-slate-100 rounded-2xl"
          bodyStyle={{ padding: '20px 24px' }}
        >
          <Row gutter={[24, 16]}>
            {platformLeaderboard.map((item, index) => (
              <Col xs={24} sm={12} md={6} key={item.platform}>
                <div className="space-y-1.5 p-3.5 bg-slate-50 border border-slate-200/40 rounded-xl hover:bg-slate-100/40 hover:shadow-sm transition-all">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                    <span className="flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded bg-indigo-50 text-indigo-600 flex items-center justify-center text-[10px] font-extrabold">#{index + 1}</span>
                      {item.platform}
                    </span>
                    <span className="text-indigo-600 font-extrabold">{item.avg} / 10</span>
                  </div>
                  <Progress
                    percent={item.avg * 10}
                    strokeColor={item.avg >= 8 ? '#10B981' : item.avg >= 6 ? '#3B82F6' : '#EF4444'}
                    showInfo={false}
                    strokeWidth={6}
                    className="m-0"
                  />
                </div>
              </Col>
            ))}
          </Row>
        </Card>
      )}

      {/* Search */}
      <Card bordered={false} className="shadow-sm border border-slate-100" bodyStyle={{ padding: '16px' }}>
        <Input
          prefix={<Search size={16} className="text-slate-400 mr-1" />}
          placeholder="Search by content title or platform..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          allowClear
          size="large"
        />
      </Card>

      {/* Scorecard Grid */}
      <Row gutter={[20, 20]}>
        {filtered.map(item => {
          const grade = getGradeLabel(item.overallScore)

          return (
            <Col xs={24} md={12} xl={8} key={item.contentId}>
              <Card
                bordered={false}
                className="shadow-sm border border-slate-100 hover:shadow-md transition-all h-full flex flex-col justify-between group"
                bodyStyle={{ padding: '24px', display: 'flex', flexDirection: 'column', height: '100%' }}
              >
                <div className="flex-1">
                  {/* Header */}
                  <div className="flex justify-between items-start">
                    <span className="text-[9px] text-slate-400 font-mono font-bold">ID: {item.contentId}</span>
                    <div className="flex items-center text-amber-500">
                      <Star className="w-4 h-4 fill-amber-500 mr-1" />
                      <span className="text-sm font-extrabold text-slate-800">{item.overallScore} / 10</span>
                    </div>
                  </div>

                  <h3 className="text-base font-extrabold text-slate-800 font-['Plus_Jakarta_Sans'] mt-3 line-clamp-1 group-hover:text-blue-700 transition-colors">
                    {item.content.contentTitle}
                  </h3>

                  <div className="flex items-center gap-2 mt-2">
                    <Tag color={getPlatformTagColor(item.content.platform)} style={{ fontSize: '9px', fontWeight: 'bold' }}>
                      {item.content.platform.toUpperCase()}
                    </Tag>
                    {item.content.clientId && (
                      <span className="text-[9px] font-bold text-slate-400">{item.content.clientId}</span>
                    )}
                  </div>

                  {/* Score Bars */}
                  <div className="mt-5 space-y-3">
                    {[
                      { label: 'Reach Score', value: item.reachScore },
                      { label: 'Engagement Score', value: item.engagementScore },
                      { label: 'Lead Score', value: item.leadScore },
                      { label: 'Conversion Score', value: item.conversionScore }
                    ].map(metric => (
                      <div key={metric.label} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold text-slate-600">
                          <span>{metric.label}</span>
                          <span>{metric.value} / 10</span>
                        </div>
                        <Progress
                          percent={metric.value * 10}
                          strokeColor={getProgressColor(metric.value)}
                          showInfo={false}
                          size="small"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer Grade */}
                <div className="border-t border-slate-100 mt-5 pt-4 flex items-center justify-between text-xs shrink-0">
                  <span className="text-slate-400">Scorecard Grade</span>
                  <Tag color={grade.color} icon={<BadgeCheck size={12} className="mr-0.5 inline-block align-middle" />} style={{ fontWeight: 'bold' }}>
                    {grade.label.toUpperCase()}
                  </Tag>
                </div>
              </Card>
            </Col>
          )
        })}

        {filtered.length === 0 && (
          <Col span={24}>
            <div className="py-12 text-center text-slate-400 text-sm font-medium">
              No scorecard data found.
            </div>
          </Col>
        )}
      </Row>
    </div>
  )
}
