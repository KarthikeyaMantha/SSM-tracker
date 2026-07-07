'use client'

import React, { useState, useEffect } from 'react'
import {
  Card,
  Button,
  Table,
  Input,
  Modal,
  Tag,
  Space,
  Row,
  Col,
  Statistic,
  message,
  Typography,
  Form,
  InputNumber,
  Select
} from 'antd'
import {
  FolderOpen,
  Plus,
  ExternalLink,
  Search,
  Layers,
  Activity,
  FolderOpen as FolderOpenIcon,
  Building2,
  FileSignature,
  Edit2,
  Trash2
} from 'lucide-react'
import type { ColumnsType } from 'antd/es/table'

const { Title, Text } = Typography

interface Asset {
  id: string
  contentId: string
  content: { contentTitle: string } | null
  assetType: string
  canvaLink: string | null
  driveLink: string | null
  version: number
  uploadDate: string
}

interface ContentItem {
  contentId: string
  contentTitle: string
}

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [contentList, setContentList] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null)
  const [saving, setSaving] = useState(false)

  const [addForm] = Form.useForm()
  const [editForm] = Form.useForm()

  useEffect(() => {
    loadAssets()
    fetch('/api/content-master')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setContentList(data)
      })
      .catch(err => console.error('Failed to load content master:', err))
  }, [])

  const loadAssets = async () => {
    try {
      const res = await fetch('/api/assets')
      const json = await res.json()
      if (Array.isArray(json)) setAssets(json)
    } catch (error) {
      console.error('Failed to load assets:', error)
      message.error('Failed to load asset library')
    } finally {
      setLoading(false)
    }
  }

  const handleAddSubmit = async (values: any) => {
    setSaving(true)
    try {
      const res = await fetch('/api/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentId: values.contentId,
          assetType: values.assetType,
          canvaLink: values.canvaLink || '',
          driveLink: values.driveLink || '',
          version: 1
        })
      })
      if (res.ok) {
        message.success('Asset uploaded successfully')
        setIsModalOpen(false)
        addForm.resetFields()
        loadAssets()
      } else {
        message.error('Failed to upload asset')
      }
    } catch (error) {
      console.error('Failed to upload asset:', error)
      message.error('Error uploading asset')
    } finally {
      setSaving(false)
    }
  }

  const handleEditClick = (asset: Asset) => {
    setEditingAsset(asset)
    editForm.setFieldsValue({
      contentId: asset.contentId || '',
      assetType: asset.assetType || 'Image',
      canvaLink: asset.canvaLink || '',
      driveLink: asset.driveLink || '',
      version: asset.version || 1
    })
    setIsEditModalOpen(true)
  }

  const handleEditSubmit = async (values: any) => {
    if (!editingAsset) return
    setSaving(true)
    try {
      const res = await fetch('/api/assets', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingAsset.id,
          contentId: values.contentId,
          assetType: values.assetType,
          canvaLink: values.canvaLink || '',
          driveLink: values.driveLink || '',
          version: parseInt(values.version) || 1
        })
      })
      if (res.ok) {
        message.success('Asset updated successfully')
        setIsEditModalOpen(false)
        setEditingAsset(null)
        editForm.resetFields()
        loadAssets()
      } else {
        message.error('Failed to update asset')
      }
    } catch (err) {
      console.error(err)
      message.error('Error updating asset')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteClick = (asset: Asset) => {
    Modal.confirm({
      title: `Are you sure you want to delete this ${asset.assetType} asset?`,
      content: 'This action cannot be undone.',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          const res = await fetch(`/api/assets?id=${encodeURIComponent(asset.id)}`, {
            method: 'DELETE'
          })
          if (res.ok) {
            message.success('Asset deleted successfully')
            loadAssets()
          } else {
            message.error('Failed to delete asset')
          }
        } catch (err) {
          console.error(err)
          message.error('Error deleting asset')
        }
      }
    })
  }

  const getAssetTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'image': return 'blue'
      case 'video': return 'purple'
      case 'carousel': return 'pink'
      default: return 'default'
    }
  }

  const filtered = assets.filter(asset => {
    const title = asset.content?.contentTitle || 'Unlinked Content'
    const matchSearch =
      title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (asset.assetType || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (asset.canvaLink || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (asset.driveLink || '').toLowerCase().includes(searchTerm.toLowerCase())
    return matchSearch
  })

  const statsTotal = assets.length
  const statsCanva = assets.filter(a => !!a.canvaLink).length
  const statsDrive = assets.filter(a => !!a.driveLink).length

  const columns: ColumnsType<Asset> = [
    {
      title: 'Content',
      key: 'content',
      render: (_, asset) => (
        <Space size="small">
          <Building2 size={13} className="text-slate-400" />
          <Text strong style={{ fontSize: '13px' }}>{asset.content?.contentTitle || 'Unlinked Content'}</Text>
        </Space>
      )
    },
    {
      title: 'Asset Type',
      dataIndex: 'assetType',
      key: 'assetType',
      render: (type) => (
        <Tag color={getAssetTypeColor(type)} style={{ fontWeight: 'bold' }}>
          {type.toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'Version',
      dataIndex: 'version',
      key: 'version',
      render: (version) => (
        <Text style={{ fontFamily: 'monospace', fontSize: '12px' }}>v{version}</Text>
      )
    },
    {
      title: 'Upload Date',
      dataIndex: 'uploadDate',
      key: 'uploadDate',
      render: (date) => (
        <Text style={{ fontFamily: 'monospace', fontSize: '12px' }}>
          {new Date(date).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric'
          })}
        </Text>
      )
    },
    {
      title: 'Links',
      key: 'links',
      render: (_, asset) => (
        <Space size="middle">
          {asset.canvaLink ? (
            <Button
              type="link"
              href={asset.canvaLink}
              target="_blank"
              rel="noopener noreferrer"
              icon={<ExternalLink size={13} />}
              style={{ padding: 0, height: 'auto', fontWeight: 'bold' }}
            >
              Canva
            </Button>
          ) : (
            <Text type="secondary">—</Text>
          )}
          {asset.driveLink ? (
            <Button
              type="link"
              href={asset.driveLink}
              target="_blank"
              rel="noopener noreferrer"
              icon={<ExternalLink size={13} />}
              style={{ padding: 0, height: 'auto', fontWeight: 'bold' }}
            >
              Drive
            </Button>
          ) : (
            <Text type="secondary">—</Text>
          )}
        </Space>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right',
      render: (_, asset) => (
        <Space size="middle">
          <Button
            type="link"
            icon={<Edit2 size={15} />}
            onClick={() => handleEditClick(asset)}
          />
          <Button
            type="link"
            danger
            icon={<Trash2 size={15} />}
            onClick={() => handleDeleteClick(asset)}
          />
        </Space>
      )
    }
  ]

  const selectStyle = {
    width: '100%',
    height: '40px',
    borderRadius: '8px',
    border: '1px solid #d9d9d9',
    padding: '0 11px',
    fontSize: '14px',
    color: 'rgba(0, 0, 0, 0.88)',
    outline: 'none',
    backgroundColor: '#fff',
    transition: 'all 0.2s'
  }

  const inputStyle = {
    width: '100%',
    height: '40px',
    borderRadius: '8px',
    border: '1px solid #d9d9d9',
    padding: '0 11px',
    fontSize: '14px',
    outline: 'none',
    transition: 'all 0.2s'
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <Title level={2} className="!mb-0 flex items-center gap-3 !font-extrabold tracking-tight">
            <FolderOpen className="h-8 w-8 text-blue-600" /> Asset Library
          </Title>
          <p className="text-slate-500 text-sm mt-1">
            Store and retrieve copy briefs, image templates, and production videos.
          </p>
        </div>
        <Button
          type="primary"
          icon={<Plus size={15} />}
          onClick={() => setIsModalOpen(true)}
          size="large"
          style={{ borderRadius: '12px' }}
        >
          Add Asset
        </Button>
      </div>

      {/* Stats Widgets */}
      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card bordered={false} className="shadow-sm border border-slate-100" bodyStyle={{ padding: '16px' }}>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <Layers size={20} />
              </div>
              <Statistic title="Total Assets" value={statsTotal} valueStyle={{ fontWeight: 'bold' }} />
            </div>
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card bordered={false} className="shadow-sm border border-slate-100" bodyStyle={{ padding: '16px' }}>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-teal-50 text-teal-600 rounded-xl">
                <Activity size={20} />
              </div>
              <Statistic title="Canva Projects" value={statsCanva} valueStyle={{ fontWeight: 'bold', color: '#0d9488' }} />
            </div>
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card bordered={false} className="shadow-sm border border-slate-100" bodyStyle={{ padding: '16px' }}>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                <FolderOpenIcon size={20} />
              </div>
              <Statistic title="Drive Folders" value={statsDrive} valueStyle={{ fontWeight: 'bold', color: '#4f46e5' }} />
            </div>
          </Card>
        </Col>
      </Row>

      {/* Search Bar */}
      <Card bordered={false} className="shadow-sm border border-slate-100" bodyStyle={{ padding: '16px' }}>
        <Input
          prefix={<Search size={16} className="text-slate-400 mr-1" />}
          placeholder="Search by content title, type, link..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          allowClear
          size="large"
        />
      </Card>

      {/* Assets Table */}
      <Card bordered={false} className="shadow-sm border border-slate-100" bodyStyle={{ padding: 0 }}>
        <Table
          columns={columns}
          dataSource={filtered}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10, showSizeChanger: true }}
        />
      </Card>

      {/* Add Asset Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2.5 text-blue-600 pb-2 border-b border-slate-100">
            <FileSignature size={20} className="stroke-[2.5]" />
            <span className="text-base font-extrabold font-['Plus_Jakarta_Sans'] text-slate-800">
              Add New Asset
            </span>
          </div>
        }
        open={isModalOpen}
        onCancel={() => {
          if (!saving) {
            setIsModalOpen(false)
            addForm.resetFields()
          }
        }}
        footer={null}
        destroyOnClose
        keyboard={true}
      >
        <Form
          form={addForm}
          layout="vertical"
          onFinish={handleAddSubmit}
          className="mt-4 space-y-4"
        >
          <Form.Item
            label={<span className="text-xs font-semibold text-slate-600">Link to Content *</span>}
            name="contentId"
            rules={[{ required: true, message: 'Please select a content item!' }]}
          >
            <Select placeholder="Choose content item..." className="text-xs">
              {contentList.map(c => (
                <Select.Option key={c.contentId} value={c.contentId}>
                  {c.contentTitle}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label={<span className="text-xs font-semibold text-slate-600">Asset Type</span>}
            name="assetType"
            initialValue="Image"
          >
            <Select className="text-xs">
              <Select.Option value="Image">Image</Select.Option>
              <Select.Option value="Video">Video</Select.Option>
              <Select.Option value="Document">Document</Select.Option>
              <Select.Option value="Carousel">Carousel</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            label={<span className="text-xs font-semibold text-slate-600">Canva Link</span>}
            name="canvaLink"
            rules={[{ type: 'url', message: 'Please enter a valid Canva URL!' }]}
          >
            <Input placeholder="https://canva.com/..." className="rounded-lg p-2 text-xs" />
          </Form.Item>

          <Form.Item
            label={<span className="text-xs font-semibold text-slate-600">Drive Link</span>}
            name="driveLink"
            rules={[{ type: 'url', message: 'Please enter a valid Google Drive URL!' }]}
          >
            <Input placeholder="https://drive.google.com/..." className="rounded-lg p-2 text-xs" />
          </Form.Item>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
            <Button
              onClick={() => {
                setIsModalOpen(false)
                addForm.resetFields()
              }}
              disabled={saving}
              className="rounded-lg text-xs"
            >
              Cancel
            </Button>
            <Button type="primary" htmlType="submit" loading={saving} className="rounded-lg bg-blue-600 text-xs border-none font-semibold">
              Upload Asset
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Edit Asset Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2.5 text-blue-600 pb-2 border-b border-slate-100">
            <FileSignature size={20} className="stroke-[2.5]" />
            <span className="text-base font-extrabold font-['Plus_Jakarta_Sans'] text-slate-800">
              Edit Asset Links
            </span>
          </div>
        }
        open={isEditModalOpen}
        onCancel={() => {
          if (!saving) {
            setIsEditModalOpen(false)
            setEditingAsset(null)
            editForm.resetFields()
          }
        }}
        footer={null}
        destroyOnClose
        keyboard={true}
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={handleEditSubmit}
          className="mt-4 space-y-4"
        >
          <Form.Item
            label={<span className="text-xs font-semibold text-slate-600">Link to Content *</span>}
            name="contentId"
            rules={[{ required: true, message: 'Please select a content item!' }]}
          >
            <Select placeholder="Choose content item..." className="text-xs">
              {contentList.map(c => (
                <Select.Option key={c.contentId} value={c.contentId}>
                  {c.contentTitle}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label={<span className="text-xs font-semibold text-slate-600">Asset Type</span>}
            name="assetType"
          >
            <Select className="text-xs">
              <Select.Option value="Image">Image</Select.Option>
              <Select.Option value="Video">Video</Select.Option>
              <Select.Option value="Document">Document</Select.Option>
              <Select.Option value="Carousel">Carousel</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            label={<span className="text-xs font-semibold text-slate-600">Canva Link</span>}
            name="canvaLink"
            rules={[{ type: 'url', message: 'Please enter a valid Canva URL!' }]}
          >
            <Input placeholder="https://canva.com/..." className="rounded-lg p-2 text-xs" />
          </Form.Item>

          <Form.Item
            label={<span className="text-xs font-semibold text-slate-600">Drive Link</span>}
            name="driveLink"
            rules={[{ type: 'url', message: 'Please enter a valid Google Drive URL!' }]}
          >
            <Input placeholder="https://drive.google.com/..." className="rounded-lg p-2 text-xs" />
          </Form.Item>

          <Form.Item
            label={<span className="text-xs font-semibold text-slate-600">Version</span>}
            name="version"
            rules={[{ required: true, message: 'Please enter a version!' }]}
          >
            <InputNumber min={1} className="w-full rounded-lg p-1 text-xs" />
          </Form.Item>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
            <Button
              onClick={() => {
                setIsEditModalOpen(false)
                setEditingAsset(null)
                editForm.resetFields()
              }}
              disabled={saving}
              className="rounded-lg text-xs"
            >
              Cancel
            </Button>
            <Button type="primary" htmlType="submit" loading={saving} className="rounded-lg bg-blue-600 text-xs border-none font-semibold">
              Save Changes
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  )
}
