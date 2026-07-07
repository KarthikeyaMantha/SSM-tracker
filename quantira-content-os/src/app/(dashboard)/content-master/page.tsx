'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import { Table, Modal, Form, Input, Select, DatePicker, TimePicker, Button, Badge, Space, Card, message } from 'antd'
import dayjs from 'dayjs'

const { Option } = Select
const { TextArea } = Input

export default function ContentMasterPage() {
  const [content, setContent] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedClient, setSelectedClient] = useState('')
  const [editingItem, setEditingItem] = useState<any>(null)
  const [form] = Form.useForm()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [cRes, clRes, cmRes] = await Promise.all([
        fetch('/api/content-master'),
        fetch('/api/clients'),
        fetch('/api/campaigns')
      ])
      const cData = await cRes.json()
      const clData = await clRes.json()
      const cmData = await cmRes.json()
      if (Array.isArray(cData)) setContent(cData)
      if (Array.isArray(clData)) setClients(clData)
      if (Array.isArray(cmData)) setCampaigns(cmData)
    } catch (error) {
      console.error('Failed to load content master data:', error)
      message.error('Failed to load content master resources.')
    } finally {
      setLoading(false)
    }
  }

  const filteredCampaigns = campaigns.filter(c => c.clientId === selectedClient)

  const handleEdit = (record: any) => {
    setEditingItem(record)
    setSelectedClient(record.clientId || '')
    form.setFieldsValue({
      contentTitle: record.contentTitle,
      clientId: record.clientId,
      campaignId: record.campaignId,
      platform: record.platform ? record.platform.split(', ') : [],
      priority: record.priority,
      status: record.status,
      healthStatus: record.healthStatus,
      publishDate: record.publishDate ? dayjs(record.publishDate) : null,
      publishTime: record.publishTime ? dayjs(record.publishTime, 'HH:mm') : null,
      targetPersona: record.targetPersona,
      painPoint: record.painPoint,
      contentPillar: record.contentPillar
    })
    setIsModalOpen(true)
  }

  const handleDelete = (record: any) => {
    Modal.confirm({
      title: `Are you sure you want to delete ${record.contentTitle}?`,
      content: 'This action cannot be undone.',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          const res = await fetch(`/api/content-master?contentId=${encodeURIComponent(record.contentId)}`, {
            method: 'DELETE'
          })
          if (res.ok) {
            message.success('Content item deleted successfully!')
            loadData()
          } else {
            const err = await res.json()
            message.error(err.error || 'Failed to delete content item.')
          }
        } catch (error) {
          console.error('Failed to delete content item:', error)
          message.error('An error occurred while deleting.')
        }
      }
    })
  }

  const handleSubmit = async (values: any) => {
    setSaving(true)
    try {
      const payload = {
        contentId: editingItem?.contentId || undefined,
        contentTitle: values.contentTitle,
        clientId: selectedClient || values.clientId,
        campaignId: values.campaignId || null,
        platform: values.platform ? (Array.isArray(values.platform) ? values.platform.join(', ') : values.platform) : '',
        priority: values.priority || 'Normal',
        status: values.status || 'Draft',
        healthStatus: values.healthStatus || 'On Track',
        publishDate: values.publishDate ? values.publishDate.toISOString() : null,
        publishTime: values.publishTime ? (typeof values.publishTime === 'string' ? values.publishTime : values.publishTime.format('HH:mm')) : null,
        targetPersona: values.targetPersona || null,
        painPoint: values.painPoint || null,
        contentPillar: values.contentPillar || null
      }
      
      const url = '/api/content-master'
      const method = editingItem ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      
      if (res.ok) {
        message.success(editingItem ? 'Content entry updated successfully!' : 'Content entry created successfully!')
        setIsModalOpen(false)
        setEditingItem(null)
        form.resetFields()
        setSelectedClient('')
        loadData()
      } else {
        const err = await res.json()
        message.error(err.error || 'Failed to submit content entry.')
      }
    } catch (error) {
      console.error('Failed to submit content:', error)
      message.error('An error occurred during submission.')
    } finally {
      setSaving(false)
    }
  }



  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'published':
        return <Badge status="success" text={<span className="font-semibold text-xs text-green-700">Published</span>} />
      case 'planned':
        return <Badge status="processing" text={<span className="font-semibold text-xs text-blue-700">Planned</span>} />
      case 'draft':
      default:
        return <Badge status="default" text={<span className="font-semibold text-xs text-slate-500">Draft</span>} />
    }
  }

  const getHealthBadge = (health: string) => {
    switch (health.toLowerCase()) {
      case 'on track':
        return <Badge status="success" text={<span className="font-semibold text-xs text-green-700">On Track</span>} />
      case 'upcoming':
        return <Badge status="warning" text={<span className="font-semibold text-xs text-amber-700">Upcoming</span>} />
      case 'needs attention':
      case 'delayed':
      default:
        return <Badge status="error" text={<span className="font-semibold text-xs text-rose-700">{health}</span>} />
    }
  }

  const columns: any[] = [
    {
      title: 'ID',
      dataIndex: 'contentId',
      key: 'contentId',
      sorter: (a: any, b: any) => a.contentId.localeCompare(b.contentId),
      render: (text: string) => <span className="font-mono text-slate-500 font-bold">{text}</span>
    },
    {
      title: 'Title',
      dataIndex: 'contentTitle',
      key: 'contentTitle',
      sorter: (a: any, b: any) => a.contentTitle.localeCompare(b.contentTitle),
      render: (text: string) => <span className="font-bold text-slate-800">{text}</span>
    },
    {
      title: 'Client',
      dataIndex: 'clientId',
      key: 'clientId',
      sorter: (a: any, b: any) => (a.clientId || '').localeCompare(b.clientId || ''),
      render: (clientId: string) => {
        const client = clients.find(c => c.clientName === clientId)
        return <span>{client?.clientName || clientId || '-'}</span>
      }
    },
    {
      title: 'Campaign',
      dataIndex: 'campaignId',
      key: 'campaignId',
      render: (campaignId: string) => {
        const campaign = campaigns.find(c => c.campaignId === campaignId)
        return <span>{campaign?.campaignName || campaignId || '-'}</span>
      }
    },
    {
      title: 'Platform',
      dataIndex: 'platform',
      key: 'platform',
      sorter: (a: any, b: any) => a.platform.localeCompare(b.platform)
    },
    {
      title: 'Publish Date',
      dataIndex: 'publishDate',
      key: 'publishDate',
      sorter: (a: any, b: any) => (a.publishDate || '').localeCompare(b.publishDate || ''),
      render: (date: string) => <span>{date ? dayjs(date).format('YYYY-MM-DD') : '-'}</span>
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getStatusBadge(status)
    },
    {
      title: 'Health',
      dataIndex: 'healthStatus',
      key: 'healthStatus',
      render: (health: string) => getHealthBadge(health)
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right',
      render: (_: any, record: any) => (
        <Space size="middle">
          <Button
            type="link"
            icon={<Edit2 className="w-4 h-4" />}
            onClick={() => handleEdit(record)}
          />
          <Button
            type="link"
            danger
            icon={<Trash2 className="w-4 h-4" />}
            onClick={() => handleDelete(record)}
          />
        </Space>
      )
    }
  ]

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-['Inter',-apple-system,sans-serif]">
      {/* Page Header */}
      <div className="flex justify-between items-center border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Content Master</h1>
          <p className="text-slate-500 text-xs mt-1">Audit, edit, and track master list of content across campaigns.</p>
        </div>
        <Button
          type="primary"
          icon={<Plus className="w-4.5 h-4.5 mr-1 shrink-0" />}
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 rounded-xl h-10 px-4 font-bold text-xs shadow-sm flex items-center justify-center border-none"
        >
          Add Content
        </Button>
      </div>

      {/* Table Container Card */}
      <Card bordered={false} className="shadow-sm rounded-2xl overflow-hidden" bodyStyle={{ padding: 0 }}>
        <Table
          dataSource={content}
          columns={columns}
          rowKey="contentId"
          loading={loading}
          pagination={{ pageSize: 10, showSizeChanger: false }}
          scroll={{ x: 'max-content' }}
          className="custom-table"
        />
      </Card>

      {/* Add/Edit Content Modal */}
      <Modal
        title={<span className="font-bold text-base text-slate-800">{editingItem ? 'Edit Content Item' : 'Add New Content'}</span>}
        open={isModalOpen}
        onCancel={() => {
          if (!saving) {
            setIsModalOpen(false)
            setEditingItem(null)
            form.resetFields()
            setSelectedClient('')
          }
        }}
        footer={null}
        destroyOnClose
        width={750}
        className="rounded-2xl overflow-hidden"
        keyboard={true}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            platform: ['LinkedIn'],
            priority: 'Normal',
            status: 'Draft',
            healthStatus: 'On Track'
          }}
          className="mt-4 space-y-4"
        >
          {/* Row 1: Title */}
          <Form.Item
            label={<span className="text-xs font-semibold text-slate-600">Content Title / Topic *</span>}
            name="contentTitle"
            rules={[{ required: true, message: 'Please input content title/topic!' }]}
          >
            <Input placeholder="e.g. Scaling SaaS with AI" className="rounded-lg p-2 text-xs" />
          </Form.Item>

          {/* Row 2: Client & Campaign */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item
              label={<span className="text-xs font-semibold text-slate-600">Select Client *</span>}
              name="clientId"
              rules={[{ required: true, message: 'Please select a client!' }]}
            >
              <Select
                placeholder="Choose a client..."
                onChange={(value) => {
                  setSelectedClient(value)
                  form.setFieldsValue({ campaignId: undefined })
                }}
                className="text-xs"
              >
                {clients.map(c => (
                  <Option key={c.clientName} value={c.clientName}>{c.clientName}</Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              label={<span className="text-xs font-semibold text-slate-600">Select Campaign *</span>}
              name="campaignId"
              rules={[{ required: true, message: 'Please select a campaign!' }]}
            >
              <Select
                placeholder="Choose a campaign..."
                disabled={!selectedClient}
                className="text-xs"
              >
                {filteredCampaigns.map(c => (
                  <Option key={c.campaignId} value={c.campaignId}>{c.campaignName}</Option>
                ))}
              </Select>
            </Form.Item>
          </div>

          {/* Row 3: Platform, Priority, Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Form.Item
              label={<span className="text-xs font-semibold text-slate-600">Platform(s)</span>}
              name="platform"
            >
              <Select mode="multiple" className="text-xs" placeholder="Select platform(s)...">
                <Option value="LinkedIn">LinkedIn</Option>
                <Option value="Instagram">Instagram</Option>
                <Option value="Facebook">Facebook</Option>
                <Option value="Twitter">Twitter / X</Option>
              </Select>
            </Form.Item>

            <Form.Item
              label={<span className="text-xs font-semibold text-slate-600">Priority</span>}
              name="priority"
            >
              <Select className="text-xs">
                <Option value="Low">Low</Option>
                <Option value="Normal">Normal</Option>
                <Option value="High">High</Option>
                <Option value="Urgent">Urgent</Option>
              </Select>
            </Form.Item>

            <Form.Item
              label={<span className="text-xs font-semibold text-slate-600">Status</span>}
              name="status"
            >
              <Select className="text-xs">
                <Option value="Draft">Draft</Option>
                <Option value="Planned">Planned</Option>
                <Option value="Published">Published</Option>
              </Select>
            </Form.Item>
          </div>

          {/* Row 4: Dates & Times */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item
              label={<span className="text-xs font-semibold text-slate-600">Publish Date</span>}
              name="publishDate"
            >
              <DatePicker className="w-full rounded-lg p-2 text-xs" />
            </Form.Item>

            <Form.Item
              label={<span className="text-xs font-semibold text-slate-600">Publish Time</span>}
              name="publishTime"
            >
              <TimePicker format="HH:mm" className="w-full rounded-lg p-2 text-xs" />
            </Form.Item>
          </div>

          {/* Row 5: AI Context Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-100 pt-4">
            <Form.Item
              label={<span className="text-xs font-semibold text-slate-600">Target Persona</span>}
              name="targetPersona"
            >
              <Input placeholder="e.g. CTOs" className="rounded-lg p-2 text-xs" />
            </Form.Item>

            <Form.Item
              label={<span className="text-xs font-semibold text-slate-600">Pain Point</span>}
              name="painPoint"
            >
              <Input placeholder="e.g. High churn rate" className="rounded-lg p-2 text-xs" />
            </Form.Item>

            <Form.Item
              label={<span className="text-xs font-semibold text-slate-600">Content Pillar</span>}
              name="contentPillar"
            >
              <Input placeholder="e.g. Thought Leadership" className="rounded-lg p-2 text-xs" />
            </Form.Item>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
            <Button
              onClick={() => {
                setIsModalOpen(false)
                setEditingItem(null)
                form.resetFields()
                setSelectedClient('')
              }}
              disabled={saving}
              className="rounded-lg text-xs"
            >
              Cancel
            </Button>
            <Button type="primary" htmlType="submit" loading={saving} className="rounded-lg bg-blue-600 text-xs border-none font-semibold">
              {editingItem ? 'Save Changes' : 'Add Content'}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  )
}
