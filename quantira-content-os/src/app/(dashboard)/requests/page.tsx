'use client'

import { useState, useEffect } from 'react'
import {
  Card,
  Button,
  Table,
  Select,
  Input,
  Modal,
  Tag,
  Space,
  Row,
  Col,
  Statistic,
  message,
  Typography,
  Form
} from 'antd'
import {
  Inbox,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Building2,
  User,
  Layers,
  FileSignature,
  Edit2,
  Trash2
} from 'lucide-react'
import type { ColumnsType } from 'antd/es/table'

const { Title, Text, Paragraph } = Typography
const { TextArea } = Input

interface RequestItem {
  requestId: number
  client: string
  platform: string | null
  contentType: string | null
  priority: string
  objective: string | null
  brief: string | null
  dueDate: string | null
  status: string
  assignedTo: string | null
  requestedBy: string | null
  requestDate: string
}

export default function RequestsPage() {
  const [requests, setRequests] = useState<RequestItem[]>([])
  const [clients, setClients] = useState<{ clientName: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  // New Request Modal
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    requestedBy: '',
    client: '',
    platform: 'LinkedIn',
    contentType: 'Post',
    priority: 'Normal',
    objective: '',
    brief: '',
    dueDate: '',
    assignedTo: ''
  })
  
  // Edit Request Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<RequestItem | null>(null)
  const [editFormData, setEditFormData] = useState({
    requestedBy: '',
    client: '',
    platform: 'LinkedIn',
    contentType: 'Post',
    priority: 'Normal',
    objective: '',
    brief: '',
    dueDate: '',
    assignedTo: '',
    status: 'Open'
  })

  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadRequests()
    loadClients()
  }, [])

  const loadRequests = async () => {
    try {
      const res = await fetch('/api/requests')
      const json = await res.json()
      if (Array.isArray(json)) setRequests(json)
    } catch (error) {
      console.error('Failed to load requests:', error)
      message.error('Failed to load intake requests')
    } finally {
      setLoading(false)
    }
  }

  const loadClients = async () => {
    try {
      const res = await fetch('/api/clients')
      const json = await res.json()
      if (Array.isArray(json)) setClients(json)
    } catch (error) {
      console.error('Failed to load clients:', error)
    }
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!formData.client || !formData.brief) return
    setSaving(true)
    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      if (res.ok) {
        message.success('Request submitted successfully')
        setIsModalOpen(false)
        setFormData({
          requestedBy: '', client: '', platform: 'LinkedIn', contentType: 'Post',
          priority: 'Normal', objective: '', brief: '', dueDate: '', assignedTo: ''
        })
        loadRequests()
      } else {
        message.error('Failed to submit request')
      }
    } catch (error) {
      console.error('Failed to submit request:', error)
      message.error('Error submitting request')
    } finally {
      setSaving(false)
    }
  }

  const handleEditClick = (item: RequestItem) => {
    setEditingItem(item)
    setEditFormData({
      requestedBy: item.requestedBy || '',
      client: item.client || '',
      platform: item.platform || 'LinkedIn',
      contentType: item.contentType || 'Post',
      priority: item.priority || 'Normal',
      objective: item.objective || '',
      brief: item.brief || '',
      dueDate: item.dueDate ? new Date(item.dueDate).toISOString().split('T')[0] : '',
      assignedTo: item.assignedTo || '',
      status: item.status || 'Open'
    })
    setIsEditModalOpen(true)
  }

  const handleEditSubmit = async () => {
    if (!editingItem) return
    if (!editFormData.client || !editFormData.brief) {
      message.warning('Please enter all required fields')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/requests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: editingItem.requestId,
          ...editFormData
        })
      })
      if (res.ok) {
        message.success('Request updated successfully')
        setIsEditModalOpen(false)
        setEditingItem(null)
        loadRequests()
      } else {
        message.error('Failed to update request')
      }
    } catch (err) {
      console.error(err)
      message.error('Error updating request')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteClick = (item: RequestItem) => {
    Modal.confirm({
      title: `Are you sure you want to delete ${item.objective || item.contentType || 'this request'}?`,
      content: 'This action cannot be undone.',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          const res = await fetch(`/api/requests?requestId=${item.requestId}`, {
            method: 'DELETE'
          })
          if (res.ok) {
            message.success('Request deleted successfully')
            loadRequests()
          } else {
            message.error('Failed to delete request')
          }
        } catch (err) {
          console.error(err)
          message.error('Error deleting request')
        }
      }
    })
  }

  const handleApproveScaffold = async (id: number) => {
    setSaving(true)
    try {
      const res = await fetch('/api/requests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId: id, status: 'Approved' })
      })
      if (res.ok) {
        message.success('Request approved and scaffolded in Content Master')
        loadRequests()
      } else {
        message.error('Failed to approve request')
      }
    } catch (error) {
      console.error('Failed to approve request:', error)
      message.error('Error approving request')
    } finally {
      setSaving(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved': return 'success'
      case 'open':
      case 'pending': return 'warning'
      case 'rejected': return 'error'
      default: return 'default'
    }
  }

  const filtered = requests.filter(req => {
    const matchSearch =
      (req.client || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (req.platform || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (req.objective || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (req.brief || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (req.requestedBy || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchStatus = filterStatus ? req.status === filterStatus : true
    return matchSearch && matchStatus
  })

  const statsTotal = requests.length
  const statsOpen = requests.filter(r => r.status === 'Open' || r.status === 'Pending').length
  const statsApproved = requests.filter(r => r.status === 'Approved').length

  const columns: ColumnsType<RequestItem> = [
    {
      title: 'Client',
      dataIndex: 'client',
      key: 'client',
      render: (client) => (
        <Space size="small">
          <Building2 size={13} className="text-slate-400" />
          <Text strong style={{ fontSize: '13px' }}>{client}</Text>
        </Space>
      )
    },
    {
      title: 'Platform',
      dataIndex: 'platform',
      key: 'platform',
      render: (platform) => (
        <Tag color="blue" style={{ fontWeight: '600', fontSize: '10px' }}>
          {(platform || '—').toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'Objective & Brief',
      key: 'objectiveBrief',
      render: (_, req) => (
        <div style={{ maxWidth: '280px' }}>
          <div style={{ fontWeight: 'bold', color: '#1f2937', fontSize: '13px' }}>
            {req.objective || req.contentType || 'New Request'}
          </div>
          {req.brief && (
            <Paragraph type="secondary" ellipsis={{ rows: 2 }} style={{ fontSize: '11px', margin: '4px 0 0 0' }}>
              {req.brief}
            </Paragraph>
          )}
        </div>
      )
    },
    {
      title: 'Due Date',
      dataIndex: 'dueDate',
      key: 'dueDate',
      render: (date) => (
        <Text style={{ fontFamily: 'monospace', fontSize: '12px' }}>
          {date ? new Date(date).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric'
          }) : '—'}
        </Text>
      )
    },
    {
      title: 'Assigned To',
      dataIndex: 'assignedTo',
      key: 'assignedTo',
      render: (assigned) => (
        <Space size="small">
          <User size={13} className="text-slate-400" />
          <Text style={{ fontSize: '13px' }}>{assigned || '—'}</Text>
        </Space>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={getStatusColor(status)} style={{ fontWeight: 'bold' }}>
          {status.toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right',
      render: (_, req) => (
        <Space size="middle">
          {req.status !== 'Approved' ? (
            <Button
              type="primary"
              ghost
              size="small"
              icon={<CheckCircle2 size={13} />}
              loading={saving}
              onClick={() => handleApproveScaffold(req.requestId)}
            >
              Approve & Scaffold
            </Button>
          ) : (
            <Tag style={{ fontSize: '10px', fontWeight: 'bold', letterSpacing: '0.03em' }}>
              CLONED TO MASTER
            </Tag>
          )}
          <Button
            type="link"
            icon={<Edit2 size={15} />}
            onClick={() => handleEditClick(req)}
          />
          <Button
            type="link"
            danger
            icon={<Trash2 size={15} />}
            onClick={() => handleDeleteClick(req)}
          />
        </Space>
      )
    }
  ]

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-slate-500">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="font-medium text-sm animate-pulse font-['Plus_Jakarta_Sans']">Loading intake requests...</p>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <Title level={2} className="!mb-0 flex items-center gap-3 !font-extrabold tracking-tight">
            <Inbox className="h-8 w-8 text-blue-600" /> Content Requests
          </Title>
          <p className="text-slate-500 text-sm mt-1">
            Review content requests and design assignments requested by clients.
          </p>
        </div>
        <Button
          type="primary"
          icon={<Plus size={15} />}
          onClick={() => setIsModalOpen(true)}
          size="large"
          style={{ borderRadius: '12px' }}
        >
          New Request
        </Button>
      </div>

      {/* Stats Widgets */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card bordered={false} className="shadow-sm border border-slate-100" bodyStyle={{ padding: '16px' }}>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <Layers size={20} />
              </div>
              <Statistic title="Total Requests" value={statsTotal} valueStyle={{ fontWeight: 'bold' }} />
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card bordered={false} className="shadow-sm border border-slate-100" bodyStyle={{ padding: '16px' }}>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                <Clock size={20} />
              </div>
              <Statistic title="Open & Pending" value={statsOpen} valueStyle={{ fontWeight: 'bold', color: '#d97706' }} />
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card bordered={false} className="shadow-sm border border-slate-100" bodyStyle={{ padding: '16px' }}>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <CheckCircle2 size={20} />
              </div>
              <Statistic title="Approved & Scaffolded" value={statsApproved} valueStyle={{ fontWeight: 'bold', color: '#16a34a' }} />
            </div>
          </Card>
        </Col>
      </Row>

      {/* Filters Bar */}
      <Card bordered={false} className="shadow-sm border border-slate-100" bodyStyle={{ padding: '16px' }}>
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <div className="relative flex-1">
            <Input
              prefix={<Search size={16} className="text-slate-400 mr-1" />}
              placeholder="Search by client, platform, objective, brief, or requester..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              allowClear
              size="large"
            />
          </div>

          <Select
            value={filterStatus}
            onChange={value => setFilterStatus(value)}
            style={{ width: 180 }}
            size="large"
            placeholder="All Statuses"
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'Open', label: 'Open' },
              { value: 'Pending', label: 'Pending' },
              { value: 'Approved', label: 'Approved' }
            ]}
          />
        </div>
      </Card>

      {/* Requests Table */}
      <Card bordered={false} className="shadow-sm border border-slate-100" bodyStyle={{ padding: 0 }}>
        <Table
          columns={columns}
          dataSource={filtered}
          rowKey="requestId"
          loading={loading}
          pagination={{ pageSize: 10, showSizeChanger: true }}
        />
      </Card>

      {/* New Request Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2.5 text-blue-600 pb-2 border-b border-slate-100">
            <FileSignature size={20} className="stroke-[2.5]" />
            <span className="text-base font-extrabold font-['Plus_Jakarta_Sans'] text-slate-800">
              Submit Content Request
            </span>
          </div>
        }
        open={isModalOpen}
        onCancel={() => {
          if (!saving) {
            setIsModalOpen(false)
          }
        }}
        keyboard={true}
        footer={[
          <Button key="cancel" onClick={() => setIsModalOpen(false)} disabled={saving}>
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            onClick={() => handleSubmit()}
            disabled={saving || !formData.client || !formData.brief}
            loading={saving}
          >
            Submit Request
          </Button>
        ]}
        destroyOnClose
        width={650}
      >
        <Form
          layout="vertical"
          className="space-y-4 py-3"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && e.target instanceof HTMLInputElement) {
              e.preventDefault()
              handleSubmit()
            }
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label={<Text strong style={{ fontSize: 12 }}>CLIENT *</Text>} required>
                <Select
                  value={formData.client}
                  onChange={value => setFormData({ ...formData, client: value })}
                  placeholder="Select a client..."
                  size="large"
                  options={clients.map(c => ({ value: c.clientName, label: c.clientName }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label={<Text strong style={{ fontSize: 12 }}>REQUESTED BY</Text>}>
                <Input
                  value={formData.requestedBy}
                  onChange={e => setFormData({ ...formData, requestedBy: e.target.value })}
                  placeholder="E.g., Alice Smith"
                  size="large"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label={<Text strong style={{ fontSize: 12 }}>PLATFORM</Text>}>
                <Select
                  value={formData.platform}
                  onChange={value => setFormData({ ...formData, platform: value })}
                  size="large"
                  options={[
                    { value: 'LinkedIn', label: 'LinkedIn' },
                    { value: 'Instagram', label: 'Instagram' },
                    { value: 'Facebook', label: 'Facebook' }
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label={<Text strong style={{ fontSize: 12 }}>DUE DATE</Text>}>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                  className="w-full rounded-md border border-slate-200 px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-slate-700 bg-white"
                  style={{ height: '40px' }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label={<Text strong style={{ fontSize: 12 }}>CONTENT TYPE</Text>}>
                <Input
                  value={formData.contentType}
                  onChange={e => setFormData({ ...formData, contentType: e.target.value })}
                  placeholder="E.g., Post, Video"
                  size="large"
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
                    { value: 'Normal', label: 'Normal' },
                    { value: 'High', label: 'High' },
                    { value: 'Low', label: 'Low' }
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label={<Text strong style={{ fontSize: 12 }}>OBJECTIVE</Text>}>
            <Input
              value={formData.objective}
              onChange={e => setFormData({ ...formData, objective: e.target.value })}
              placeholder="E.g., Promote new dashboard features"
              size="large"
            />
          </Form.Item>

          <Form.Item label={<Text strong style={{ fontSize: 12 }}>OBJECTIVE / BRIEF *</Text>} required>
            <TextArea
              rows={4}
              value={formData.brief}
              onChange={e => setFormData({ ...formData, brief: e.target.value })}
              placeholder="Detailed brief..."
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit Request Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2.5 text-blue-600 pb-2 border-b border-slate-100">
            <FileSignature size={20} className="stroke-[2.5]" />
            <span className="text-base font-extrabold font-['Plus_Jakarta_Sans'] text-slate-800">
              Edit Content Request
            </span>
          </div>
        }
        open={isEditModalOpen}
        onCancel={() => {
          if (!saving) {
            setIsEditModalOpen(false)
            setEditingItem(null)
          }
        }}
        keyboard={true}
        footer={[
          <Button key="cancel" onClick={() => {
            setIsEditModalOpen(false)
            setEditingItem(null)
          }} disabled={saving}>
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            onClick={handleEditSubmit}
            disabled={saving || !editFormData.client || !editFormData.brief}
            loading={saving}
          >
            Save Changes
          </Button>
        ]}
        destroyOnClose
        width={650}
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
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label={<Text strong style={{ fontSize: 12 }}>CLIENT *</Text>} required>
                <Select
                  value={editFormData.client}
                  onChange={value => setEditFormData({ ...editFormData, client: value })}
                  placeholder="Select a client..."
                  size="large"
                  options={clients.map(c => ({ value: c.clientName, label: c.clientName }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label={<Text strong style={{ fontSize: 12 }}>REQUESTED BY</Text>}>
                <Input
                  value={editFormData.requestedBy}
                  onChange={e => setEditFormData({ ...editFormData, requestedBy: e.target.value })}
                  placeholder="E.g., Alice Smith"
                  size="large"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label={<Text strong style={{ fontSize: 12 }}>PLATFORM</Text>}>
                <Select
                  value={editFormData.platform}
                  onChange={value => setEditFormData({ ...editFormData, platform: value })}
                  size="large"
                  options={[
                    { value: 'LinkedIn', label: 'LinkedIn' },
                    { value: 'Instagram', label: 'Instagram' },
                    { value: 'Facebook', label: 'Facebook' }
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label={<Text strong style={{ fontSize: 12 }}>DUE DATE</Text>}>
                <input
                  type="date"
                  value={editFormData.dueDate}
                  onChange={e => setEditFormData({ ...editFormData, dueDate: e.target.value })}
                  className="w-full rounded-md border border-slate-200 px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-slate-700 bg-white"
                  style={{ height: '40px' }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label={<Text strong style={{ fontSize: 12 }}>CONTENT TYPE</Text>}>
                <Input
                  value={editFormData.contentType}
                  onChange={e => setEditFormData({ ...editFormData, contentType: e.target.value })}
                  placeholder="E.g., Post, Video"
                  size="large"
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
                    { value: 'Normal', label: 'Normal' },
                    { value: 'High', label: 'High' },
                    { value: 'Low', label: 'Low' }
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label={<Text strong style={{ fontSize: 12 }}>STATUS</Text>}>
                <Select
                  value={editFormData.status}
                  onChange={value => setEditFormData({ ...editFormData, status: value })}
                  size="large"
                  options={[
                    { value: 'Open', label: 'Open' },
                    { value: 'Pending', label: 'Pending' },
                    { value: 'Approved', label: 'Approved' },
                    { value: 'Rejected', label: 'Rejected' }
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label={<Text strong style={{ fontSize: 12 }}>ASSIGNED TO</Text>}>
                <Input
                  value={editFormData.assignedTo || ''}
                  onChange={e => setEditFormData({ ...editFormData, assignedTo: e.target.value })}
                  placeholder="E.g., Developer"
                  size="large"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label={<Text strong style={{ fontSize: 12 }}>OBJECTIVE</Text>}>
            <Input
              value={editFormData.objective}
              onChange={e => setEditFormData({ ...editFormData, objective: e.target.value })}
              placeholder="E.g., Promote new dashboard features"
              size="large"
            />
          </Form.Item>

          <Form.Item label={<Text strong style={{ fontSize: 12 }}>OBJECTIVE / BRIEF *</Text>} required>
            <TextArea
              rows={4}
              value={editFormData.brief}
              onChange={e => setEditFormData({ ...editFormData, brief: e.target.value })}
              placeholder="Detailed brief..."
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
