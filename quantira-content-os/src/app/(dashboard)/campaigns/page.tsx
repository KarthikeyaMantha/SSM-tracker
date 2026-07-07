'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import { Table, Modal, Form, Input, Select, InputNumber, Button, Badge, Card, message, Space } from 'antd'

const { Option } = Select

export default function CampaignsPage() {
  const [clients, setClients] = useState<any[]>([])
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCampaign, setEditingCampaign] = useState<any>(null)
  const [form] = Form.useForm()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [clientsRes, campaignsRes] = await Promise.all([
        fetch('/api/clients'),
        fetch('/api/campaigns')
      ])
      const clientsData = await clientsRes.json()
      const campaignsData = await campaignsRes.json()
      if (Array.isArray(clientsData)) setClients(clientsData)
      if (Array.isArray(campaignsData)) setCampaigns(campaignsData)
    } catch (error) {
      console.error('Failed to load data:', error)
      message.error('Failed to fetch campaign resources.')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (record: any) => {
    setEditingCampaign(record)
    form.setFieldsValue({
      clientId: record.clientId,
      campaignName: record.campaignName,
      goal: record.goal,
      budget: record.budget,
      status: record.status || 'Planning'
    })
    setIsModalOpen(true)
  }

  const handleDelete = (record: any) => {
    Modal.confirm({
      title: `Are you sure you want to delete ${record.campaignName}?`,
      content: 'This action cannot be undone.',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          const res = await fetch(`/api/campaigns?campaignId=${encodeURIComponent(record.campaignId)}`, {
            method: 'DELETE'
          })
          if (res.ok) {
            message.success('Campaign deleted successfully!')
            loadData()
          } else {
            const err = await res.json()
            message.error(err.error || 'Failed to delete campaign.')
          }
        } catch (error) {
          console.error('Failed to delete campaign:', error)
          message.error('An error occurred while deleting.')
        }
      }
    })
  }

  const handleSubmit = async (values: any) => {
    setSaving(true)
    try {
      const payload = {
        campaignId: editingCampaign?.campaignId || undefined,
        clientId: values.clientId,
        campaignName: values.campaignName,
        goal: values.goal || '',
        budget: Number(values.budget) || 0,
        status: values.status || 'Planning'
      }

      const url = '/api/campaigns'
      const method = editingCampaign ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      
      if (res.ok) {
        message.success(editingCampaign ? 'Campaign updated successfully!' : 'Campaign created successfully!')
        setIsModalOpen(false)
        setEditingCampaign(null)
        form.resetFields()
        loadData()
      } else {
        const err = await res.json()
        message.error(err.error || 'Failed to submit campaign.')
      }
    } catch (error) {
      console.error('Failed to submit campaign:', error)
      message.error('An error occurred during submission.')
    } finally {
      setSaving(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return <Badge status="success" text={<span className="font-semibold text-xs text-green-700">Active</span>} />
      case 'planning':
        return <Badge status="warning" text={<span className="font-semibold text-xs text-amber-700">Planning</span>} />
      case 'completed':
        return <Badge status="default" text={<span className="font-semibold text-xs text-slate-500">Completed</span>} />
      default:
        return <Badge status="default" text={<span className="font-semibold text-xs text-slate-500">{status}</span>} />
    }
  }

  const columns: any[] = [
    {
      title: 'Campaign ID',
      dataIndex: 'campaignId',
      key: 'campaignId',
      sorter: (a: any, b: any) => a.campaignId.localeCompare(b.campaignId),
      render: (text: string) => <span className="font-mono text-slate-600 font-bold">{text}</span>
    },
    {
      title: 'Client Name',
      dataIndex: 'clientId',
      key: 'clientId',
      sorter: (a: any, b: any) => a.clientId.localeCompare(b.clientId),
      render: (clientId: string) => {
        const client = clients.find(c => c.clientName === clientId)
        return <span className="font-bold text-slate-800">{client?.clientName || clientId}</span>
      }
    },
    {
      title: 'Campaign Name',
      dataIndex: 'campaignName',
      key: 'campaignName',
      sorter: (a: any, b: any) => a.campaignName.localeCompare(b.campaignName)
    },
    {
      title: 'Goal',
      dataIndex: 'goal',
      key: 'goal',
      render: (text: string) => <span>{text || '-'}</span>
    },
    {
      title: 'Budget',
      dataIndex: 'budget',
      key: 'budget',
      sorter: (a: any, b: any) => a.budget - b.budget,
      render: (value: number) => <span>₹{value?.toLocaleString()}</span>
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getStatusBadge(status)
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
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Campaigns</h1>
          <p className="text-slate-500 text-xs mt-1">Plan and allocate marketing budgets for active campaigns.</p>
        </div>
        <Button
          type="primary"
          icon={<Plus className="w-4.5 h-4.5 mr-1 shrink-0" />}
          onClick={() => {
            setEditingCampaign(null)
            form.resetFields()
            setIsModalOpen(true)
          }}
          className="bg-blue-600 hover:bg-blue-700 rounded-xl h-10 px-4 font-bold text-xs shadow-sm flex items-center justify-center border-none"
        >
          Add Campaign
        </Button>
      </div>

      {/* Campaigns Table Card */}
      <Card bordered={false} className="shadow-sm rounded-2xl overflow-hidden" bodyStyle={{ padding: 0 }}>
        <Table
          dataSource={campaigns}
          columns={columns}
          rowKey="campaignId"
          loading={loading}
          pagination={{ pageSize: 10, showSizeChanger: false }}
          scroll={{ x: 'max-content' }}
          className="custom-table"
        />
      </Card>

      {/* Add/Edit Campaign Modal */}
      <Modal
        title={<span className="font-bold text-base text-slate-800">{editingCampaign ? 'Edit Campaign' : 'Add New Campaign'}</span>}
        open={isModalOpen}
        onCancel={() => {
          if (!saving) {
            setIsModalOpen(false)
            setEditingCampaign(null)
            form.resetFields()
          }
        }}
        footer={null}
        destroyOnClose
        width={400}
        className="rounded-2xl overflow-hidden"
        keyboard={true}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ status: 'Planning' }}
          className="mt-4 space-y-4"
        >

          <Form.Item
            label={<span className="text-xs font-semibold text-slate-600">Select Client</span>}
            name="clientId"
            rules={[{ required: true, message: 'Please select a client!' }]}
          >
            <Select placeholder="Choose a client..." className="text-xs">
              {clients.map(client => (
                <Option key={client.clientName} value={client.clientName}>
                  {client.clientName}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label={<span className="text-xs font-semibold text-slate-600">Campaign Name</span>}
            name="campaignName"
            rules={[{ required: true, message: 'Please input campaign name!' }]}
          >
            <Input placeholder="e.g. Q3 Growth Campaign" className="rounded-lg p-2 text-xs" />
          </Form.Item>

          <Form.Item
            label={<span className="text-xs font-semibold text-slate-600">Goal</span>}
            name="goal"
          >
            <Input placeholder="e.g. Increase product signups" className="rounded-lg p-2 text-xs" />
          </Form.Item>

          <Form.Item
            label={<span className="text-xs font-semibold text-slate-600">Budget (INR)</span>}
            name="budget"
          >
            <InputNumber
              placeholder="e.g. 100000"
              className="w-full rounded-lg p-1 text-xs"
              formatter={(value) => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => value!.replace(/₹\s?|(,*)/g, '')}
            />
          </Form.Item>

          <Form.Item
            label={<span className="text-xs font-semibold text-slate-600">Status</span>}
            name="status"
          >
            <Select className="text-xs">
              <Option value="Planning">Planning</Option>
              <Option value="Active">Active</Option>
              <Option value="Completed">Completed</Option>
            </Select>
          </Form.Item>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
            <Button
              onClick={() => {
                setIsModalOpen(false)
                setEditingCampaign(null)
                form.resetFields()
              }}
              disabled={saving}
              className="rounded-lg text-xs"
            >
              Cancel
            </Button>
            <Button type="primary" htmlType="submit" loading={saving} className="rounded-lg bg-blue-600 text-xs border-none font-semibold">
              {editingCampaign ? 'Save Changes' : 'Add Campaign'}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  )
}
