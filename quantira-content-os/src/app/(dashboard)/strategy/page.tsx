'use client'

import { useState, useEffect } from 'react'
import {
  Card,
  Button,
  Input,
  Select,
  Modal,
  Tag,
  Space,
  Row,
  Col,
  Statistic,
  message,
  Typography,
  Form,
  Table
} from 'antd'
import {
  Lightbulb,
  Plus,
  Zap,
  Search,
  Sparkles,
  Award,
  Layers,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Edit2,
  Trash2
} from 'lucide-react'

const { Title, Text, Paragraph } = Typography
const { TextArea } = Input

interface StrategyItem {
  id: string
  topic: string
  industry: string | null
  persona: string | null
  funnelStage: string | null
  searchIntent: string | null
  contentPillar: string | null
  keyword: string | null
  competitorRef: string | null
  priority: string
  ideaStatus: string
  createdAt: string
}

export default function StrategyPage() {
  const [ideas, setIdeas] = useState<StrategyItem[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [promotingId, setPromotingId] = useState<string | null>(null)
  
  // Promote states
  const [isPromoteModalOpen, setIsPromoteModalOpen] = useState(false)
  const [activePromotingIdea, setActivePromotingIdea] = useState<StrategyItem | null>(null)
  const [promoteForm] = Form.useForm()

  // Edit states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingIdea, setEditingIdea] = useState<StrategyItem | null>(null)
  const [editFormData, setEditFormData] = useState({
    id: '',
    topic: '',
    industry: '',
    persona: '',
    funnelStage: 'TOFU',
    searchIntent: '',
    contentPillar: '',
    keyword: '',
    competitorRef: '',
    priority: 'Normal',
    ideaStatus: 'Brainstorm'
  })

  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    topic: '',
    industry: '',
    persona: '',
    funnelStage: 'TOFU',
    searchIntent: '',
    contentPillar: '',
    keyword: '',
    competitorRef: '',
    priority: 'Normal',
    ideaStatus: 'Brainstorm'
  })

  useEffect(() => {
    loadIdeas()
    loadClients()
  }, [])

  const loadClients = async () => {
    try {
      const res = await fetch('/api/clients')
      const json = await res.json()
      if (Array.isArray(json)) setClients(json)
    } catch (error) {
      console.error('Failed to load clients:', error)
    }
  }

  const loadIdeas = async () => {
    try {
      const res = await fetch('/api/strategy')
      const json = await res.json()
      if (Array.isArray(json)) setIdeas(json)
    } catch (error) {
      console.error('Failed to load strategy ideas:', error)
      message.error('Failed to load strategy ideas')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    try {
      const res = await fetch('/api/strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      if (res.ok) {
        message.success('Strategy idea added successfully')
        setIsModalOpen(false)
        setFormData({
          topic: '',
          industry: '',
          persona: '',
          funnelStage: 'TOFU',
          searchIntent: '',
          contentPillar: '',
          keyword: '',
          competitorRef: '',
          priority: 'Normal',
          ideaStatus: 'Brainstorm'
        })
        loadIdeas()
      } else {
        message.error('Failed to save content idea')
      }
    } catch (error) {
      console.error('Failed to create content idea:', error)
      message.error('Error creating content idea')
    }
  }

  const handlePromote = (idea: StrategyItem) => {
    setActivePromotingIdea(idea)
    setIsPromoteModalOpen(true)
  }

  const handlePromoteSubmit = async (values: any) => {
    if (!activePromotingIdea) return
    setPromotingId(activePromotingIdea.id)
    try {
      // Create a client proposal inside intake requests
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestedBy: 'System (Ideation)',
          client: values.clientName,
          platform: 'LinkedIn',
          contentType: 'Draft Post',
          priority: activePromotingIdea.priority || 'Normal',
          objective: `Idea: ${activePromotingIdea.topic}`,
          brief: `Funnel Stage: ${activePromotingIdea.funnelStage || 'TOFU'}\nKeyword: ${activePromotingIdea.keyword || ''}\nContent Pillar: ${activePromotingIdea.contentPillar || ''}`,
          status: 'Proposal'
        })
      })

      if (res.ok) {
        // Update strategy idea status to Researching
        await fetch('/api/strategy', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...activePromotingIdea,
            ideaStatus: 'Researching'
          })
        })
        message.success('Idea successfully promoted to Client Proposal Request!')
        setIsPromoteModalOpen(false)
        setActivePromotingIdea(null)
        promoteForm.resetFields()
        loadIdeas()
      } else {
        message.error('Failed to submit proposal request.')
      }
    } catch (error) {
      console.error('Failed to promote content idea:', error)
      message.error('Error promoting content idea')
    } finally {
      setPromotingId(null)
    }
  }

  const handleEditClick = (idea: StrategyItem) => {
    setEditingIdea(idea)
    setEditFormData({
      id: idea.id,
      topic: idea.topic || '',
      industry: idea.industry || '',
      persona: idea.persona || '',
      funnelStage: idea.funnelStage || 'TOFU',
      searchIntent: idea.searchIntent || '',
      contentPillar: idea.contentPillar || '',
      keyword: idea.keyword || '',
      competitorRef: idea.competitorRef || '',
      priority: idea.priority || 'Normal',
      ideaStatus: idea.ideaStatus || 'Brainstorm'
    })
    setIsEditModalOpen(true)
  }

  const handleEditSubmit = async () => {
    if (!editingIdea) return
    if (!editFormData.topic) {
      message.warning('Topic field is required')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/strategy', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData)
      })
      if (res.ok) {
        message.success('Strategy idea updated successfully')
        setIsEditModalOpen(false)
        setEditingIdea(null)
        loadIdeas()
      } else {
        message.error('Failed to update strategy idea')
      }
    } catch (err) {
      console.error(err)
      message.error('Error updating strategy idea')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteClick = (idea: StrategyItem) => {
    Modal.confirm({
      title: `Are you sure you want to delete ${idea.topic}?`,
      content: 'This action cannot be undone.',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          const res = await fetch(`/api/strategy?id=${encodeURIComponent(idea.id)}`, {
            method: 'DELETE'
          })
          if (res.ok) {
            message.success('Strategy idea deleted successfully')
            loadIdeas()
          } else {
            message.error('Failed to delete strategy idea')
          }
        } catch (err) {
          console.error(err)
          message.error('Error deleting strategy idea')
        }
      }
    })
  }

  const filtered = ideas.filter(idea =>
    idea.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (idea.keyword || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (idea.contentPillar || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (idea.industry || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'researching': return 'blue'
      case 'ready': return 'success'
      default: return 'warning'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high': return 'red'
      case 'low': return 'default'
      default: return 'blue'
    }
  }

  const columns: any[] = [
    {
      title: 'Topic',
      dataIndex: 'topic',
      key: 'topic',
      sorter: (a: any, b: any) => a.topic.localeCompare(b.topic),
      render: (text: string, record: any) => (
        <div>
          <span className="font-extrabold text-slate-800 font-['Plus_Jakarta_Sans']">{text}</span>
          {record.searchIntent && (
            <p className="text-xs text-slate-400 mt-1 italic font-medium">"{record.searchIntent}"</p>
          )}
        </div>
      )
    },
    {
      title: 'Industry',
      dataIndex: 'industry',
      key: 'industry',
      render: (text: string) => <span>{text || '—'}</span>
    },
    {
      title: 'Persona',
      dataIndex: 'persona',
      key: 'persona',
      render: (text: string) => <span>{text || '—'}</span>
    },
    {
      title: 'Keyword',
      dataIndex: 'keyword',
      key: 'keyword',
      render: (text: string) => <span className="text-blue-600 font-bold">{text || '—'}</span>
    },
    {
      title: 'Content Pillar',
      dataIndex: 'contentPillar',
      key: 'contentPillar',
      render: (text: string) => <span>{text || '—'}</span>
    },
    {
      title: 'Funnel',
      dataIndex: 'funnelStage',
      key: 'funnelStage',
      render: (text: string) => <Tag style={{ fontWeight: 'bold' }}>{text || 'TOFU'}</Tag>
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      render: (text: string) => (
        <Tag color={getPriorityColor(text)} style={{ fontWeight: 'bold' }}>
          {text.toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'Status',
      dataIndex: 'ideaStatus',
      key: 'ideaStatus',
      render: (text: string) => (
        <Tag color={getStatusColor(text)} style={{ fontWeight: 'bold' }}>
          {text.toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right',
      render: (_: any, record: any) => (
        <Space size="middle">
          <Button
            type={record.ideaStatus === 'Researching' ? 'default' : 'primary'}
            size="small"
            icon={record.ideaStatus !== 'Researching' && promotingId !== record.id ? <Zap size={12} /> : null}
            onClick={() => handlePromote(record)}
            disabled={promotingId === record.id || record.ideaStatus === 'Researching'}
            loading={promotingId === record.id}
            style={{ borderRadius: '6px', fontWeight: 'bold', fontSize: '11px', height: '24px' }}
          >
            {record.ideaStatus === 'Researching' ? 'Promoted' : 'Promote'}
          </Button>
          <Button
            type="link"
            icon={<Edit2 size={15} />}
            onClick={() => handleEditClick(record)}
          />
          <Button
            type="link"
            danger
            icon={<Trash2 size={15} />}
            onClick={() => handleDeleteClick(record)}
          />
        </Space>
      )
    }
  ]

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-slate-500">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="font-medium text-sm animate-pulse font-['Plus_Jakarta_Sans']">Loading strategy planner...</p>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <Title level={2} className="!mb-0 flex items-center gap-3 !font-extrabold tracking-tight">
            <Lightbulb className="h-8 w-8 text-blue-600 animate-pulse" /> Strategy & Ideation
          </Title>
          <p className="text-slate-500 text-sm mt-1">
            Store brainstormed thoughts, keyword metrics, and concept frameworks before drafting campaigns.
          </p>
        </div>
        <Button
          type="primary"
          icon={<Plus size={16} />}
          onClick={() => setIsModalOpen(true)}
          size="large"
          style={{ borderRadius: '12px' }}
        >
          Add Strategy Idea
        </Button>
      </div>

      {/* Stats Summary Strip */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card bordered={false} className="shadow-sm border border-slate-100" bodyStyle={{ padding: '16px' }}>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
                <Lightbulb size={18} />
              </div>
              <Statistic title="Brainstorms" value={ideas.filter(i => i.ideaStatus === 'Brainstorm').length} valueStyle={{ fontWeight: 'bold', color: '#d97706' }} />
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card bordered={false} className="shadow-sm border border-slate-100" bodyStyle={{ padding: '16px' }}>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                <TrendingUp size={18} />
              </div>
              <Statistic title="Researching" value={ideas.filter(i => i.ideaStatus === 'Researching').length} valueStyle={{ fontWeight: 'bold', color: '#2563eb' }} />
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card bordered={false} className="shadow-sm border border-slate-100" bodyStyle={{ padding: '16px' }}>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                <Sparkles size={18} />
              </div>
              <Statistic title="Total Ideas" value={ideas.length} valueStyle={{ fontWeight: 'bold', color: '#059669' }} />
            </div>
          </Card>
        </Col>
      </Row>

      {/* Search Bar */}
      <Card bordered={false} className="shadow-sm border border-slate-100" bodyStyle={{ padding: '16px' }}>
        <Input
          prefix={<Search size={16} className="text-slate-400 mr-1" />}
          placeholder="Search by topic title, keyword, pillar, or industry..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          allowClear
          size="large"
        />
      </Card>

      {/* Ideas Table */}
      <Card bordered={false} className="shadow-sm rounded-2xl overflow-hidden" bodyStyle={{ padding: 0 }}>
        <Table
          dataSource={filtered}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10, showSizeChanger: true }}
          scroll={{ x: 'max-content' }}
          className="custom-table"
        />
      </Card>

      {/* Modal Form */}
      <Modal
        title={
          <div className="flex items-center gap-2.5 text-slate-800 pb-2 border-b border-slate-100">
            <Lightbulb className="w-5 h-5 text-blue-600" />
            <span className="text-base font-extrabold font-['Plus_Jakarta_Sans']">
              Add New Strategy Idea
            </span>
          </div>
        }
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        keyboard={true}
        footer={[
          <Button key="cancel" onClick={() => setIsModalOpen(false)}>
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            onClick={() => handleSubmit()}
            disabled={!formData.topic}
          >
            Save Idea
          </Button>
        ]}
        destroyOnClose
      >
        <Form
          layout="vertical"
          className="space-y-3 py-3"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && e.target instanceof HTMLInputElement) {
              e.preventDefault()
              handleSubmit()
            }
          }}
        >
          <Form.Item label={<Text strong style={{ fontSize: 12 }}>TOPIC *</Text>} required>
            <Input
              placeholder="e.g. B2B LinkedIn outreach framework"
              value={formData.topic}
              onChange={e => setFormData({ ...formData, topic: e.target.value })}
              size="large"
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label={<Text strong style={{ fontSize: 12 }}>INDUSTRY</Text>}>
                <Input
                  placeholder="e.g. SaaS / FinTech"
                  value={formData.industry}
                  onChange={e => setFormData({ ...formData, industry: e.target.value })}
                  size="large"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label={<Text strong style={{ fontSize: 12 }}>TARGET PERSONA</Text>}>
                <Input
                  placeholder="e.g. CMOs, Marketing Directors"
                  value={formData.persona}
                  onChange={e => setFormData({ ...formData, persona: e.target.value })}
                  size="large"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label={<Text strong style={{ fontSize: 12 }}>KEYWORD</Text>}>
                <Input
                  placeholder="e.g. b2b linkedin strategy"
                  value={formData.keyword}
                  onChange={e => setFormData({ ...formData, keyword: e.target.value })}
                  size="large"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label={<Text strong style={{ fontSize: 12 }}>CONTENT PILLAR</Text>}>
                <Input
                  placeholder="e.g. Educational, Product"
                  value={formData.contentPillar}
                  onChange={e => setFormData({ ...formData, contentPillar: e.target.value })}
                  size="large"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label={<Text strong style={{ fontSize: 12 }}>FUNNEL STAGE</Text>}>
                <Select
                  value={formData.funnelStage}
                  onChange={value => setFormData({ ...formData, funnelStage: value })}
                  size="large"
                  options={[
                    { value: 'TOFU', label: 'TOFU (Awareness)' },
                    { value: 'MOFU', label: 'MOFU (Consideration)' },
                    { value: 'BOFU', label: 'BOFU (Decision)' }
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label={<Text strong style={{ fontSize: 12 }}>PRIORITY</Text>}>
                <Select
                  value={formData.priority}
                  onChange={value => setFormData({ ...formData, priority: value })}
                  size="large"
                  options={[
                    { value: 'Low', label: 'Low' },
                    { value: 'Normal', label: 'Normal' },
                    { value: 'High', label: 'High' }
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label={<Text strong style={{ fontSize: 12 }}>SEARCH INTENT / BRIEF DESCRIPTION</Text>}>
            <TextArea
              rows={3}
              placeholder="Summarize search keywords, competitor links, reference articles, or content angles..."
              value={formData.searchIntent}
              onChange={e => setFormData({ ...formData, searchIntent: e.target.value })}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Select Client for Promotion Modal */}
      <Modal
        title={<span className="font-bold text-base text-slate-800">Promote Idea to Client Proposal</span>}
        open={isPromoteModalOpen}
        onCancel={() => {
          setIsPromoteModalOpen(false)
          setActivePromotingIdea(null)
          promoteForm.resetFields()
        }}
        footer={[
          <Button key="cancel" onClick={() => {
            setIsPromoteModalOpen(false)
            setActivePromotingIdea(null)
            promoteForm.resetFields()
          }}>
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            onClick={() => promoteForm.submit()}
            loading={promotingId !== null}
            className="bg-blue-600 border-none font-bold"
          >
            Submit Proposal
          </Button>
        ]}
        destroyOnClose
        width={380}
      >
        <Form
          form={promoteForm}
          layout="vertical"
          onFinish={handlePromoteSubmit}
          className="mt-4"
        >
          <Form.Item
            label={<span className="text-xs font-semibold text-slate-600">Select Client Target</span>}
            name="clientName"
            rules={[{ required: true, message: 'Please select a client for this proposal request!' }]}
          >
            <Select placeholder="Choose target client...">
              {clients.map(client => (
                <Select.Option key={client.clientName} value={client.clientName}>
                  {client.clientName}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit Strategy Idea Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2.5 text-slate-800 pb-2 border-b border-slate-100">
            <Lightbulb className="w-5 h-5 text-blue-600" />
            <span className="text-base font-extrabold font-['Plus_Jakarta_Sans']">
              Edit Strategy Idea
            </span>
          </div>
        }
        open={isEditModalOpen}
        onCancel={() => {
          setIsEditModalOpen(false)
          setEditingIdea(null)
        }}
        keyboard={true}
        footer={[
          <Button key="cancel" onClick={() => {
            setIsEditModalOpen(false)
            setEditingIdea(null)
          }}>
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            onClick={handleEditSubmit}
            disabled={!editFormData.topic}
            loading={saving}
          >
            Save Changes
          </Button>
        ]}
        destroyOnClose
      >
        <Form
          layout="vertical"
          className="space-y-4 py-3"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && e.target instanceof HTMLInputElement) {
              e.preventDefault()
              handleEditSubmit()
            }
          }}
        >
          <Form.Item label={<Text strong style={{ fontSize: 12 }}>STRATEGY TOPIC / TITLE *</Text>} required>
            <Input
              placeholder="e.g. 5 B2B Copywriting Secrets"
              value={editFormData.topic}
              onChange={e => setEditFormData({ ...editFormData, topic: e.target.value })}
              size="large"
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label={<Text strong style={{ fontSize: 12 }}>TARGET INDUSTRY</Text>}>
                <Input
                  placeholder="e.g. SaaS, Fintech"
                  value={editFormData.industry}
                  onChange={e => setEditFormData({ ...editFormData, industry: e.target.value })}
                  size="large"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label={<Text strong style={{ fontSize: 12 }}>TARGET PERSONA</Text>}>
                <Input
                  placeholder="e.g. Marketing Director"
                  value={editFormData.persona}
                  onChange={e => setEditFormData({ ...editFormData, persona: e.target.value })}
                  size="large"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label={<Text strong style={{ fontSize: 12 }}>KEYWORD</Text>}>
                <Input
                  placeholder="e.g. b2b linkedin strategy"
                  value={editFormData.keyword}
                  onChange={e => setEditFormData({ ...editFormData, keyword: e.target.value })}
                  size="large"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label={<Text strong style={{ fontSize: 12 }}>CONTENT PILLAR</Text>}>
                <Input
                  placeholder="e.g. Educational, Product"
                  value={editFormData.contentPillar}
                  onChange={e => setEditFormData({ ...editFormData, contentPillar: e.target.value })}
                  size="large"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label={<Text strong style={{ fontSize: 12 }}>FUNNEL STAGE</Text>}>
                <Select
                  value={editFormData.funnelStage}
                  onChange={value => setEditFormData({ ...editFormData, funnelStage: value })}
                  size="large"
                  options={[
                    { value: 'TOFU', label: 'TOFU (Awareness)' },
                    { value: 'MOFU', label: 'MOFU (Consideration)' },
                    { value: 'BOFU', label: 'BOFU (Decision)' }
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label={<Text strong style={{ fontSize: 12 }}>PRIORITY</Text>}>
                <Select
                  value={editFormData.priority}
                  onChange={value => setEditFormData({ ...editFormData, priority: value })}
                  size="large"
                  options={[
                    { value: 'Low', label: 'Low' },
                    { value: 'Normal', label: 'Normal' },
                    { value: 'High', label: 'High' }
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label={<Text strong style={{ fontSize: 12 }}>STATUS</Text>}>
                <Select
                  value={editFormData.ideaStatus}
                  onChange={value => setEditFormData({ ...editFormData, ideaStatus: value })}
                  size="large"
                  options={[
                    { value: 'Brainstorm', label: 'Brainstorm' },
                    { value: 'Researching', label: 'Researching' },
                    { value: 'Ready', label: 'Ready' }
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label={<Text strong style={{ fontSize: 12 }}>COMPETITOR REF</Text>}>
                <Input
                  placeholder="e.g. https://competitor.com/post"
                  value={editFormData.competitorRef}
                  onChange={e => setEditFormData({ ...editFormData, competitorRef: e.target.value })}
                  size="large"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label={<Text strong style={{ fontSize: 12 }}>SEARCH INTENT / BRIEF DESCRIPTION</Text>}>
            <TextArea
              rows={3}
              placeholder="Summarize search keywords, competitor links, reference articles, or content angles..."
              value={editFormData.searchIntent}
              onChange={e => setEditFormData({ ...editFormData, searchIntent: e.target.value })}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
