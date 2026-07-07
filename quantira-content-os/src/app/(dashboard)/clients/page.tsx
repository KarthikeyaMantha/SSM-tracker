'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import { Table, Modal, Form, Input, InputNumber, DatePicker, Button, Badge, Space, Card, message } from 'antd'
import dayjs from 'dayjs'
import RoleGuard from '@/components/RoleGuard'

export default function ClientsPage() {
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<any>(null)
  const [form] = Form.useForm()

  useEffect(() => {
    loadClients()
  }, [])

  const loadClients = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/clients')
      const data = await response.json()
      if (Array.isArray(data)) {
        setClients(data)
      }
    } catch (error) {
      console.error('Failed to load clients:', error)
      message.error('Failed to load clients database.')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (record: any) => {
    setEditingClient(record)
    form.setFieldsValue({
      clientName: record.clientName,
      industry: record.industry,
      accountManager: record.accountManager,
      monthlyRetainer: record.monthlyRetainer,
      startDate: record.startDate ? dayjs(record.startDate) : null,
      status: record.status || 'Active'
    })
    setIsModalOpen(true)
  }

  const handleDelete = (record: any) => {
    Modal.confirm({
      title: `Are you sure you want to delete ${record.clientName}?`,
      content: 'This action cannot be undone.',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          const res = await fetch(`/api/clients?clientName=${encodeURIComponent(record.clientName)}`, {
            method: 'DELETE'
          })
          if (res.ok) {
            message.success('Client deleted successfully!')
            loadClients()
          } else {
            const err = await res.json()
            message.error(err.error || 'Failed to delete client.')
          }
        } catch (error: any) {
          console.error('Failed to delete client:', error)
          message.error(error.message || 'An error occurred while deleting.')
        }
      }
    })
  }

  const handleSubmit = async (values: any) => {
    setSaving(true)
    try {
      const payload = {
        clientId: editingClient?.clientId || undefined,
        clientName: values.clientName,
        industry: values.industry || '',
        accountManager: values.accountManager || '',
        monthlyRetainer: Number(values.monthlyRetainer) || 0,
        startDate: values.startDate ? values.startDate.toISOString() : null,
        status: values.status || 'Active'
      }

      const url = '/api/clients'
      const method = editingClient ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      
      if (res.ok) {
        message.success(editingClient ? 'Client updated successfully!' : 'Client added successfully!')
        setIsModalOpen(false)
        setEditingClient(null)
        form.resetFields()
        loadClients()
      } else {
        const err = await res.json()
        message.error(err.error || 'Failed to submit client.')
      }
    } catch (error) {
      console.error('Failed to submit client:', error)
      message.error('An error occurred during submission.')
    } finally {
      setSaving(false)
    }
  }

  const columns: any[] = [
    {
      title: 'Client ID',
      dataIndex: 'clientId',
      key: 'clientId',
      sorter: (a: any, b: any) => (a.clientId || '').localeCompare(b.clientId || ''),
      render: (text: string) => <span className="font-mono text-slate-500 font-bold">{text || '-'}</span>
    },
    {
      title: 'Client Name',
      dataIndex: 'clientName',
      key: 'clientName',
      sorter: (a: any, b: any) => a.clientName.localeCompare(b.clientName),
      render: (text: string) => <span className="font-bold text-slate-800">{text}</span>
    },
    {
      title: 'Industry',
      dataIndex: 'industry',
      key: 'industry',
      sorter: (a: any, b: any) => (a.industry || '').localeCompare(b.industry || '')
    },
    {
      title: 'Account Manager',
      dataIndex: 'accountManager',
      key: 'accountManager',
      sorter: (a: any, b: any) => (a.accountManager || '').localeCompare(b.accountManager || '')
    },
    {
      title: <RoleGuard allowedRoles={['ADMIN', 'ACCOUNT_MANAGER']}>Monthly Retainer</RoleGuard>,
      dataIndex: 'monthlyRetainer',
      key: 'monthlyRetainer',
      sorter: (a: any, b: any) => a.monthlyRetainer - b.monthlyRetainer,
      render: (value: number) => (
        <RoleGuard allowedRoles={['ADMIN', 'ACCOUNT_MANAGER']}>
          <span>₹{value?.toLocaleString()}</span>
        </RoleGuard>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Badge
          status={status === 'Active' ? 'success' : 'default'}
          text={<span className={`font-semibold text-xs ${status === 'Active' ? 'text-green-700' : 'text-slate-500'}`}>{status}</span>}
        />
      )
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
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Clients</h1>
          <p className="text-slate-500 text-xs mt-1">Manage active corporate accounts and retainers.</p>
        </div>
        <Button
          type="primary"
          icon={<Plus className="w-4.5 h-4.5 mr-1 shrink-0" />}
          onClick={() => {
            setEditingClient(null)
            form.resetFields()
            setIsModalOpen(true)
          }}
          className="bg-blue-600 hover:bg-blue-700 rounded-xl h-10 px-4 font-bold text-xs shadow-sm flex items-center justify-center border-none"
        >
          Add Client
        </Button>
      </div>

      {/* Clients Table Card */}
      <Card bordered={false} className="shadow-sm rounded-2xl overflow-hidden" bodyStyle={{ padding: 0 }}>
        <Table
          dataSource={clients}
          columns={columns}
          rowKey="clientId"
          loading={loading}
          pagination={{ pageSize: 10, showSizeChanger: false }}
          scroll={{ x: 'max-content' }}
          className="custom-table"
        />
      </Card>

      {/* Add/Edit Client Modal */}
      <Modal
        title={<span className="font-bold text-base text-slate-800">{editingClient ? 'Edit Client' : 'Add New Client'}</span>}
        open={isModalOpen}
        onCancel={() => {
          if (!saving) {
            setIsModalOpen(false)
            setEditingClient(null)
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
          initialValues={{ status: 'Active' }}
          className="mt-4 space-y-4"
        >
          <Form.Item
            label={<span className="text-xs font-semibold text-slate-600">Client Name</span>}
            name="clientName"
            rules={[{ required: true, message: 'Please input client name!' }]}
          >
            <Input placeholder="e.g. Acme Corp" className="rounded-lg p-2 text-xs" />
          </Form.Item>

          <Form.Item
            label={<span className="text-xs font-semibold text-slate-600">Industry</span>}
            name="industry"
          >
            <Input placeholder="e.g. Technology" className="rounded-lg p-2 text-xs" />
          </Form.Item>

          <Form.Item
            label={<span className="text-xs font-semibold text-slate-600">Account Manager</span>}
            name="accountManager"
          >
            <Input placeholder="e.g. Jane Smith" className="rounded-lg p-2 text-xs" />
          </Form.Item>

          <Form.Item
            label={<span className="text-xs font-semibold text-slate-600">Monthly Retainer (INR)</span>}
            name="monthlyRetainer"
          >
            <InputNumber
              placeholder="e.g. 50000"
              className="w-full rounded-lg p-1 text-xs"
              formatter={(value) => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => value!.replace(/₹\s?|(,*)/g, '')}
            />
          </Form.Item>

          <Form.Item
            label={<span className="text-xs font-semibold text-slate-600">Start Date</span>}
            name="startDate"
          >
            <DatePicker className="w-full rounded-lg p-2 text-xs" />
          </Form.Item>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
            <Button
              onClick={() => {
                setIsModalOpen(false)
                setEditingClient(null)
                form.resetFields()
              }}
              disabled={saving}
              className="rounded-lg text-xs"
            >
              Cancel
            </Button>
            <Button type="primary" htmlType="submit" loading={saving} className="rounded-lg bg-blue-600 text-xs border-none font-semibold">
              {editingClient ? 'Save Changes' : 'Add Client'}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  )
}
