'use client'

import { useState, useEffect } from 'react'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import {
  Linkedin,
  Instagram,
  Youtube,
  Twitter,
  Globe,
  Settings,
  Plus,
  Minus,
  User,
  Palette,
  Video,
  FileText,
  Activity,
  Layers,
  Edit2,
  Trash2,
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Zap,
  Filter,
  CheckCircle,
  Menu
} from 'lucide-react'
import {
  Select,
  Input,
  Button,
  Card,
  Row,
  Col,
  Space,
  message,
  Badge,
  Tag,
  Typography,
  Empty,
  Modal,
  Form,
  InputNumber,
  Avatar,
  Tooltip,
  DatePicker,
  TimePicker,
  Switch
} from 'antd'
import dayjs from 'dayjs'

const { Option } = Select
const { Title, Text } = Typography

interface Content {
  contentTitle: string
  platform: string
  status: string
  priority?: string
  publishDate?: string | null
  publishTime?: string | null
  clientId?: string | null
  campaignId?: string | null
}

interface ProductionItem {
  productionId: number
  contentId: string
  content: Content
  copywriter?: string | null
  writerStatus: string
  designer?: string | null
  designStatus: string
  videoEditor?: string | null
  editingStatus: string
  revisionCount: number
  lastUpdated: string
}

const getPlatformIcon = (platform: string) => {
  switch (platform.toLowerCase()) {
    case 'linkedin':
      return <Linkedin className="w-3.5 h-3.5 text-blue-700 shrink-0" />
    case 'instagram':
      return <Instagram className="w-3.5 h-3.5 text-pink-600 shrink-0" />
    case 'youtube':
      return <Youtube className="w-3.5 h-3.5 text-red-600 shrink-0" />
    case 'twitter':
    case 'x':
      return <Twitter className="w-3.5 h-3.5 text-sky-500 shrink-0" />
    default:
      return <Globe className="w-3.5 h-3.5 text-slate-500 shrink-0" />
  }
}

const getPriorityColor = (priority?: string) => {
  switch (priority?.toLowerCase()) {
    case 'urgent':
      return 'error'
    case 'high':
      return 'warning'
    case 'low':
      return 'default'
    case 'normal':
    default:
      return 'processing'
  }
}

const getInitials = (name?: string | null) => {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

export default function ProductionPage() {
  const [production, setProduction] = useState<ProductionItem[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Filters state
  const [searchTerm, setSearchTerm] = useState('')
  const [filterPlatform, setFilterPlatform] = useState('')
  const [filterPriority, setFilterPriority] = useState('')
  const [myTasksOnly, setMyTasksOnly] = useState(false)

  // Current simulated user
  const currentUser = 'Creator'

  // Kanban collapse columns state
  const [collapsedColumns, setCollapsedColumns] = useState<Record<string, boolean>>({
    'Not Started': false,
    'In Progress': false,
    'Review': false,
    'Done': false
  })

  // Mobile viewport state
  const [isMobile, setIsMobile] = useState(false)

  // Detailed Modal states
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<ProductionItem | null>(null)
  const [detailForm] = Form.useForm()

  // Add Preset Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [presetStatus, setPresetStatus] = useState('Draft')
  const [addForm] = Form.useForm()

  useEffect(() => {
    setMounted(true)
    loadProduction()
    loadFiltersData()

    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const loadProduction = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/production')
      const data = await res.json()
      if (Array.isArray(data)) {
        setProduction(data)
      }
    } catch (error) {
      console.error('Failed to load production data:', error)
      message.error('Failed to load production pipeline database.')
    } finally {
      setLoading(false)
    }
  }

  const loadFiltersData = async () => {
    try {
      const [resClients, resCampaigns] = await Promise.all([
        fetch('/api/clients'),
        fetch('/api/campaigns')
      ])
      const dataClients = await resClients.json()
      const dataCampaigns = await resCampaigns.json()
      if (Array.isArray(dataClients)) setClients(dataClients)
      if (Array.isArray(dataCampaigns)) setCampaigns(dataCampaigns)
    } catch (err) {
      console.error(err)
    }
  }

  // Handle Drag & Drop dropping
  const onDragEnd = async (result: any) => {
    const { destination, source, draggableId } = result
    if (!destination) return
    if (destination.droppableId === source.droppableId && destination.index === source.index) return

    const draggableItem = production.find(p => p.contentId === draggableId)
    if (!draggableItem) return

    let newStatus = 'Draft'
    if (destination.droppableId === 'In Progress') {
      newStatus = 'In Progress'
    } else if (destination.droppableId === 'Review') {
      newStatus = 'Review'
    } else if (destination.droppableId === 'Done') {
      newStatus = 'Published'
    }

    // Optimistic Update
    setProduction(prev =>
      prev.map(p =>
        p.contentId === draggableId
          ? { ...p, content: { ...p.content, status: newStatus } }
          : p
      )
    )

    try {
      const res = await fetch('/api/content-master', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentId: draggableId,
          status: newStatus
        })
      })

      if (res.ok) {
        message.success(`Updated status to ${destination.droppableId}`)
      } else {
        message.error('Failed to update status on server')
        loadProduction()
      }
    } catch (error) {
      console.error(error)
      message.error('Error updating status')
      loadProduction()
    }
  }

  // Mobile change status fallback
  const handleMobileStatusChange = async (contentId: string, columnName: string) => {
    let newStatus = 'Draft'
    if (columnName === 'In Progress') {
      newStatus = 'In Progress'
    } else if (columnName === 'Review') {
      newStatus = 'Review'
    } else if (columnName === 'Done') {
      newStatus = 'Published'
    }

    setProduction(prev =>
      prev.map(p =>
        p.contentId === contentId
          ? { ...p, content: { ...p.content, status: newStatus } }
          : p
      )
    )

    try {
      const res = await fetch('/api/content-master', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentId, status: newStatus })
      })

      if (res.ok) {
        message.success(`Status updated to ${columnName}`)
      } else {
        message.error('Failed to update status')
        loadProduction()
      }
    } catch (err) {
      console.error(err)
      loadProduction()
    }
  }

  // Filter pipeline items
  const filteredProduction = production.filter(item => {
    const titleMatch = item.content.contentTitle.toLowerCase().includes(searchTerm.toLowerCase())
    const copywriterMatch = item.copywriter?.toLowerCase().includes(searchTerm.toLowerCase()) || false
    const designerMatch = item.designer?.toLowerCase().includes(searchTerm.toLowerCase()) || false
    const matchesSearch = titleMatch || copywriterMatch || designerMatch

    const matchesPlatform = filterPlatform ? item.content.platform === filterPlatform : true
    const matchesPriority = filterPriority ? item.content.priority === filterPriority : true

    const matchesUser = myTasksOnly
      ? item.copywriter === currentUser ||
        item.designer === currentUser ||
        item.videoEditor === currentUser
      : true

    return matchesSearch && matchesPlatform && matchesPriority && matchesUser
  })

  // Group columns
  const getColumnItems = (columnName: string) => {
    return filteredProduction.filter(item => {
      const status = item.content.status || 'Draft'
      if (columnName === 'Not Started') {
        return status === 'Draft' || status === 'Planned' || status === 'Not Started'
      }
      if (columnName === 'In Progress') {
        return status === 'In Progress'
      }
      if (columnName === 'Review') {
        return status === 'Review'
      }
      if (columnName === 'Done') {
        return status === 'Published' || status === 'Done'
      }
      return false
    })
  }

  // Open Edit Card Modal
  const handleCardClick = (item: ProductionItem) => {
    setSelectedItem(item)
    detailForm.setFieldsValue({
      copywriter: item.copywriter || '',
      writerStatus: item.writerStatus || 'Not Started',
      designer: item.designer || '',
      designStatus: item.designStatus || 'Not Required',
      videoEditor: item.videoEditor || '',
      editingStatus: item.editingStatus || 'Not Required',
      revisionCount: item.revisionCount || 0
    })
    setIsDetailModalOpen(true)
  }

  const handleDetailSubmit = async (values: any) => {
    if (!selectedItem) return
    setSaving(true)
    try {
      const res = await fetch('/api/production', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentId: selectedItem.contentId,
          copywriter: values.copywriter,
          writerStatus: values.writerStatus,
          designer: values.designer,
          designStatus: values.designStatus,
          videoEditor: values.videoEditor,
          editingStatus: values.editingStatus,
          revisionCount: parseInt(values.revisionCount) || 0
        })
      })

      if (res.ok) {
        message.success('Production pipeline updated successfully!')
        setIsDetailModalOpen(false)
        setSelectedItem(null)
        loadProduction()
      } else {
        const err = await res.json()
        message.error(err.error || 'Failed to update pipeline.')
      }
    } catch (error) {
      console.error(error)
      message.error('An error occurred during submission.')
    } finally {
      setSaving(false)
    }
  }

  // Open Preset Creation Modal
  const handleAddNewClick = (columnName: string) => {
    let dbStatus = 'Draft'
    if (columnName === 'In Progress') dbStatus = 'In Progress'
    if (columnName === 'Review') dbStatus = 'Review'
    if (columnName === 'Done') dbStatus = 'Published'

    setPresetStatus(dbStatus)
    addForm.resetFields()
    setIsAddModalOpen(true)
  }

  const handleAddSubmit = async (values: any) => {
    setSaving(true)
    try {
      const res = await fetch('/api/content-master', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentTitle: values.contentTitle,
          clientId: values.clientId,
          campaignId: values.campaignId,
          platform: values.platform,
          priority: values.priority,
          publishDate: values.publishDate ? values.publishDate.toISOString() : undefined,
          status: presetStatus
        })
      })

      if (res.ok) {
        message.success('Content entry created and scaffolded!')
        setIsAddModalOpen(false)
        addForm.resetFields()
        loadProduction()
      } else {
        const err = await res.json()
        message.error(err.error || 'Failed to create content entry.')
      }
    } catch (error) {
      console.error(error)
      message.error('Error creating content entry.')
    } finally {
      setSaving(false)
    }
  }

  // Delete production record
  const handleDeleteClick = (e: React.MouseEvent, item: ProductionItem) => {
    e.stopPropagation()
    Modal.confirm({
      title: `Are you sure you want to delete the production record for ${item.content.contentTitle}?`,
      content: 'This action cannot be undone.',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          const res = await fetch(`/api/production?contentId=${encodeURIComponent(item.contentId)}`, {
            method: 'DELETE'
          })
          if (res.ok) {
            message.success('Production pipeline record deleted successfully!')
            loadProduction()
          } else {
            const err = await res.json()
            message.error(err.error || 'Failed to delete record.')
          }
        } catch (error) {
          console.error(error)
          message.error('An error occurred.')
        }
      }
    })
  }

  // Toggle expand/collapse column
  const toggleCollapse = (columnName: string) => {
    setCollapsedColumns(prev => ({
      ...prev,
      [columnName]: !prev[columnName]
    }))
  }

  // Columns specification
  const boardColumns = [
    { name: 'Not Started', color: '#8c8c8c', bg: '#f5f5f5', border: 'border-slate-300' },
    { name: 'In Progress', color: '#1890ff', bg: '#e6f7ff', border: 'border-blue-300' },
    { name: 'Review', color: '#fa8c16', bg: '#fffbe6', border: 'border-amber-300' },
    { name: 'Done', color: '#52c41a', bg: '#f6ffed', border: 'border-green-300' }
  ]

  const columns: any[] = [] // for strict lint rules or unused variables

  if (!mounted) return null

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 min-h-[90vh]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <Title level={2} className="!mb-0 flex items-center gap-3 !font-extrabold tracking-tight">
            <Activity className="h-8 w-8 text-blue-600" /> Production Kanban
          </Title>
          <p className="text-slate-500 text-sm mt-1">
            Drag and drop content pieces across production pipelines, assign team members, and check revision history.
          </p>
        </div>
      </div>

      {/* Filter bar */}
      <Card bordered={false} className="shadow-sm border border-slate-100" bodyStyle={{ padding: '16px' }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={8}>
            <Input
              prefix={<Menu size={16} className="text-slate-400 mr-1.5" />}
              placeholder="Search title, copywriter, designer..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={12} md={4}>
            <Select
              className="w-full"
              placeholder="Platform"
              value={filterPlatform || undefined}
              onChange={val => setFilterPlatform(val || '')}
              allowClear
            >
              <Option value="LinkedIn">LinkedIn</Option>
              <Option value="Instagram">Instagram</Option>
              <Option value="YouTube">YouTube</Option>
              <Option value="Twitter">Twitter</Option>
            </Select>
          </Col>
          <Col xs={12} md={4}>
            <Select
              className="w-full"
              placeholder="Priority"
              value={filterPriority || undefined}
              onChange={val => setFilterPriority(val || '')}
              allowClear
            >
              <Option value="Urgent">Urgent</Option>
              <Option value="High">High</Option>
              <Option value="Normal">Normal</Option>
              <Option value="Low">Low</Option>
            </Select>
          </Col>
          <Col xs={24} md={8} className="flex justify-end items-center gap-2">
            <Text className="text-xs font-semibold text-slate-500">My Tasks Only:</Text>
            <Switch checked={myTasksOnly} onChange={setMyTasksOnly} />
          </Col>
        </Row>
      </Card>

      {/* Board Canvas */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <Text className="text-slate-400 font-semibold">Loading Pipeline Board...</Text>
        </div>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex flex-col md:flex-row gap-4 overflow-x-auto pb-6 select-none min-h-[600px] items-start">
            {boardColumns.map(col => {
              const columnName = col.name
              const isCollapsed = collapsedColumns[columnName]
              const items = getColumnItems(columnName)

              if (isCollapsed) {
                // Collapsed Column Sidebar state
                return (
                  <div
                    key={columnName}
                    onClick={() => toggleCollapse(columnName)}
                    className="flex flex-col items-center justify-between w-12 min-h-[500px] bg-white border border-slate-100 rounded-2xl py-4 cursor-pointer shadow-sm hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex flex-col items-center gap-3">
                      <ChevronRight size={16} className="text-slate-400" />
                      <span
                        className="font-bold text-slate-700 text-xs tracking-wider uppercase whitespace-nowrap"
                        style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                      >
                        {columnName}
                      </span>
                    </div>
                    <Badge count={items.length} style={{ backgroundColor: col.color }} />
                  </div>
                )
              }

              return (
                <div
                  key={columnName}
                  className="flex flex-col w-full md:w-[300px] shrink-0 bg-slate-50 border border-slate-100 rounded-2xl p-4 h-[650px] shadow-sm"
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between mb-4 shrink-0">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: col.color }} />
                      <span className="font-bold text-slate-700 text-sm">{columnName}</span>
                      <Badge count={items.length} className="ml-1" style={{ backgroundColor: col.color, color: '#fff' }} />
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        type="text"
                        size="small"
                        icon={<Plus size={14} />}
                        onClick={() => handleAddNewClick(columnName)}
                      />
                      <Button
                        type="text"
                        size="small"
                        icon={<ChevronLeft size={14} />}
                        onClick={() => toggleCollapse(columnName)}
                      />
                    </div>
                  </div>

                  {/* Drag-and-drop droppable section */}
                  {isMobile ? (
                    // Mobile Dropdown column Selector view
                    <div className="flex-1 overflow-y-auto space-y-3 p-1">
                      {items.map(item => (
                        <div
                          key={item.contentId}
                          onClick={() => handleCardClick(item)}
                          className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm hover:shadow-md cursor-pointer relative"
                        >
                          <div className="flex justify-between items-start gap-2 mb-2">
                            <Text className="font-bold text-slate-800 text-xs line-clamp-2">{item.content.contentTitle}</Text>
                            <Tag color={getPriorityColor(item.content.priority)} style={{ fontSize: '9px', fontWeight: 'bold' }}>
                              {item.content.priority || 'NORMAL'}
                            </Tag>
                          </div>
                          <div className="flex justify-between items-center text-[10px] text-slate-400">
                            <span className="font-mono font-bold text-[10px]">{item.contentId}</span>
                            {getPlatformIcon(item.content.platform)}
                          </div>
                          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                            <select
                              value={columnName}
                              onChange={e => handleMobileStatusChange(item.contentId, e.target.value)}
                              className="text-[11px] border border-slate-200 rounded px-1 py-0.5 bg-white text-slate-700 outline-none cursor-pointer focus:border-blue-500"
                              style={{ width: 120 }}
                              onClick={e => e.stopPropagation()}
                            >
                              <option value="Not Started">Not Started</option>
                              <option value="In Progress">In Progress</option>
                              <option value="Review">Review</option>
                              <option value="Done">Done</option>
                            </select>
                          </div>
                        </div>
                      ))}
                      {items.length === 0 && <Empty description="Empty Column" image={Empty.PRESENTED_IMAGE_SIMPLE} />}
                    </div>
                  ) : (
                    // Desktop Drag & Drop Droppable Board View
                    <Droppable droppableId={columnName}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`flex-1 overflow-y-auto space-y-3 p-1 rounded-xl transition-colors ${snapshot.isDraggingOver ? 'bg-slate-200/40' : ''}`}
                        >
                          {items.map((item, index) => {
                            const isOverdue =
                              item.content.publishDate &&
                              new Date(item.content.publishDate) < new Date() &&
                              item.content.status !== 'Published'

                            return (
                              <Draggable draggableId={item.contentId} index={index} key={item.contentId}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    onClick={() => handleCardClick(item)}
                                    className={`bg-white border border-slate-200 p-4 rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer relative group ${
                                      snapshot.isDragging ? 'rotate-2 shadow-lg border-blue-500 scale-102 ring-4 ring-blue-500/10' : ''
                                    }`}
                                  >
                                    <div className="flex justify-between items-start gap-2 mb-2">
                                      <Text className="font-bold text-slate-800 text-xs line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors">
                                        {item.content.contentTitle}
                                      </Text>
                                    </div>

                                    {/* Mid metadata row */}
                                    <div className="flex items-center justify-between gap-2 mt-2">
                                      <span className="font-mono text-[9px] text-slate-400 font-bold">{item.contentId}</span>
                                      <div className="flex items-center gap-1.5">
                                        {getPlatformIcon(item.content.platform)}
                                        <Tag color={getPriorityColor(item.content.priority)} style={{ fontSize: '9px', fontWeight: 'bold', margin: 0, padding: '0 4px' }}>
                                          {item.content.priority ? item.content.priority.toUpperCase() : 'NORMAL'}
                                        </Tag>
                                      </div>
                                    </div>

                                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between" onClick={e => e.stopPropagation()}>
                                      <span className="text-[10px] font-bold text-slate-400 uppercase">Change Status:</span>
                                      <select
                                        value={columnName}
                                        onChange={e => handleMobileStatusChange(item.contentId, e.target.value)}
                                        className="text-[11px] border border-slate-200 rounded px-1 py-0.5 bg-white text-slate-700 outline-none cursor-pointer focus:border-blue-500"
                                        style={{ width: 120 }}
                                      >
                                        <option value="Not Started">Not Started</option>
                                        <option value="In Progress">In Progress</option>
                                        <option value="Review">Review</option>
                                        <option value="Done">Done</option>
                                      </select>
                                    </div>

                                    {/* Bottom Assignees and due date section */}
                                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 text-[10px] text-slate-400 font-medium">
                                      <div className="flex items-center gap-1">
                                        {item.content.publishDate ? (
                                          <span className={`flex items-center gap-1 font-bold ${isOverdue ? 'text-rose-500' : 'text-slate-400'}`}>
                                            <Calendar size={11} />
                                            {dayjs(item.content.publishDate).format('MMM D')}
                                          </span>
                                        ) : (
                                          <span>No Date</span>
                                        )}
                                        {item.revisionCount > 0 && (
                                          <Badge
                                            count={`r${item.revisionCount}`}
                                            style={{ backgroundColor: '#ff4d4f', fontSize: '9px', fontWeight: 'bold', height: '14px', lineHeight: '14px', minWidth: '18px', padding: '0 2px' }}
                                          />
                                        )}
                                      </div>

                                      <Avatar.Group size="small" maxCount={3}>
                                        {item.copywriter && (
                                          <Tooltip title={`Copywriter: ${item.copywriter}`}>
                                            <Avatar style={{ backgroundColor: '#1890ff', fontSize: '9px' }}>{getInitials(item.copywriter)}</Avatar>
                                          </Tooltip>
                                        )}
                                        {item.designer && (
                                          <Tooltip title={`Designer: ${item.designer}`}>
                                            <Avatar style={{ backgroundColor: '#87d068', fontSize: '9px' }}>{getInitials(item.designer)}</Avatar>
                                          </Tooltip>
                                        )}
                                        {item.videoEditor && (
                                          <Tooltip title={`Video Editor: ${item.videoEditor}`}>
                                            <Avatar style={{ backgroundColor: '#722ed1', fontSize: '9px' }}>{getInitials(item.videoEditor)}</Avatar>
                                          </Tooltip>
                                        )}
                                      </Avatar.Group>
                                    </div>
                                  </div>
                                )}
                              </Draggable>
                            )
                          })}
                          {provided.placeholder}
                          {items.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-28 border border-dashed border-slate-200 rounded-xl text-slate-300">
                              <Empty description="No Cards" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                            </div>
                          )}
                        </div>
                      )}
                    </Droppable>
                  )}
                </div>
              )
            })}
          </div>
        </DragDropContext>
      )}

      {/* Edit Detail Modal */}
      <Modal
        title={<span className="font-bold text-base text-slate-800">Content Production Details</span>}
        open={isDetailModalOpen}
        onCancel={() => {
          if (!saving) {
            setIsDetailModalOpen(false)
            setSelectedItem(null)
          }
        }}
        footer={null}
        destroyOnClose
        width={500}
        className="rounded-2xl overflow-hidden"
        keyboard={true}
      >
        {selectedItem && (
          <Form
            form={detailForm}
            layout="vertical"
            onFinish={handleDetailSubmit}
            className="mt-4 space-y-4"
          >
            <div className="mb-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Topic Title</Text>
              <Text className="font-extrabold text-slate-800 text-sm leading-snug">{selectedItem.content.contentTitle}</Text>
              <div className="flex gap-2 mt-2">
                <Tag color="blue" className="text-[10px] uppercase font-bold px-2 py-0.5 rounded border-0 m-0">
                  {selectedItem.content.platform}
                </Tag>
                <Tag color={getPriorityColor(selectedItem.content.priority)} className="text-[10px] uppercase font-bold px-2 py-0.5 rounded border-0 m-0">
                  {selectedItem.content.priority || 'Normal'}
                </Tag>
              </div>
            </div>

            <Form.Item
              label={<span className="text-xs font-semibold text-slate-600">Copywriter</span>}
              name="copywriter"
            >
              <Input placeholder="Assign copywriter..." className="rounded-lg p-2 text-xs" />
            </Form.Item>

            <Form.Item
              label={<span className="text-xs font-semibold text-slate-600">Writer Status</span>}
              name="writerStatus"
            >
              <Select className="text-xs">
                <Option value="Not Started">Not Started</Option>
                <Option value="In Progress">In Progress</Option>
                <Option value="Review">Review</Option>
                <Option value="Approved">Approved</Option>
              </Select>
            </Form.Item>

            <Form.Item
              label={<span className="text-xs font-semibold text-slate-600">Designer</span>}
              name="designer"
            >
              <Input placeholder="Assign designer..." className="rounded-lg p-2 text-xs" />
            </Form.Item>

            <Form.Item
              label={<span className="text-xs font-semibold text-slate-600">Design Status</span>}
              name="designStatus"
            >
              <Select className="text-xs">
                <Option value="Not Started">Not Started</Option>
                <Option value="In Progress">In Progress</Option>
                <Option value="Review">Review</Option>
                <Option value="Approved">Approved</Option>
                <Option value="Not Required">Not Required</Option>
              </Select>
            </Form.Item>

            <Form.Item
              label={<span className="text-xs font-semibold text-slate-600">Video Editor</span>}
              name="videoEditor"
            >
              <Input placeholder="Assign video editor..." className="rounded-lg p-2 text-xs" />
            </Form.Item>

            <Form.Item
              label={<span className="text-xs font-semibold text-slate-600">Editing Status</span>}
              name="editingStatus"
            >
              <Select className="text-xs">
                <Option value="Not Started">Not Started</Option>
                <Option value="In Progress">In Progress</Option>
                <Option value="Review">Review</Option>
                <Option value="Approved">Approved</Option>
                <Option value="Not Required">Not Required</Option>
              </Select>
            </Form.Item>

            <Form.Item
              label={<span className="text-xs font-semibold text-slate-600">Revision Count</span>}
              name="revisionCount"
            >
              <InputNumber min={0} className="w-full rounded-lg p-1 text-xs" />
            </Form.Item>

            <div className="flex justify-between items-center pt-4 border-t border-slate-100 mt-6">
              <Button
                type="text"
                danger
                icon={<Trash2 size={14} />}
                onClick={(e) => {
                  setIsDetailModalOpen(false)
                  handleDeleteClick(e, selectedItem)
                }}
                disabled={saving}
                className="rounded-lg text-xs font-semibold"
              >
                Delete Record
              </Button>
              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    setIsDetailModalOpen(false)
                    setSelectedItem(null)
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
            </div>
          </Form>
        )}
      </Modal>

      {/* Add Content Modal */}
      <Modal
        title={<span className="font-bold text-base text-slate-800">Add New Content Entry</span>}
        open={isAddModalOpen}
        onCancel={() => {
          if (!saving) {
            setIsAddModalOpen(false)
            addForm.resetFields()
          }
        }}
        footer={null}
        destroyOnClose
        width={500}
        className="rounded-2xl overflow-hidden"
        keyboard={true}
      >
        <Form
          form={addForm}
          layout="vertical"
          onFinish={handleAddSubmit}
          className="mt-4 space-y-4"
        >
          <Form.Item
            label={<span className="text-xs font-semibold text-slate-600">Content Title *</span>}
            name="contentTitle"
            rules={[{ required: true, message: 'Please enter content title!' }]}
          >
            <Input placeholder="Enter title..." className="rounded-lg p-2 text-xs" />
          </Form.Item>

          <Form.Item
            label={<span className="text-xs font-semibold text-slate-600">Client Name *</span>}
            name="clientId"
            rules={[{ required: true, message: 'Please select target client!' }]}
          >
            <Select placeholder="Select Client..." className="text-xs">
              {clients.map(client => (
                <Option key={client.clientName} value={client.clientName}>
                  {client.clientName}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label={<span className="text-xs font-semibold text-slate-600">Linked Campaign</span>}
            name="campaignId"
          >
            <Select placeholder="Choose Campaign (optional)..." className="text-xs" allowClear>
              {campaigns.map(camp => (
                <Option key={camp.campaignId} value={camp.campaignId}>
                  {camp.campaignName} ({camp.campaignId})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label={<span className="text-xs font-semibold text-slate-600">Platform *</span>}
            name="platform"
            rules={[{ required: true, message: 'Please select platform!' }]}
            initialValue="LinkedIn"
          >
            <Select className="text-xs">
              <Option value="LinkedIn">LinkedIn</Option>
              <Option value="Instagram">Instagram</Option>
              <Option value="YouTube">YouTube</Option>
              <Option value="Twitter">Twitter</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label={<span className="text-xs font-semibold text-slate-600">Priority</span>}
            name="priority"
            initialValue="Normal"
          >
            <Select className="text-xs">
              <Option value="Low">Low</Option>
              <Option value="Normal">Normal</Option>
              <Option value="High">High</Option>
              <Option value="Urgent">Urgent</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label={<span className="text-xs font-semibold text-slate-600">Publish Date</span>}
            name="publishDate"
          >
            <DatePicker className="w-full text-xs" />
          </Form.Item>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
            <Button
              onClick={() => {
                setIsAddModalOpen(false)
                addForm.resetFields()
              }}
              disabled={saving}
              className="rounded-lg text-xs"
            >
              Cancel
            </Button>
            <Button type="primary" htmlType="submit" loading={saving} className="rounded-lg bg-blue-600 text-xs border-none font-semibold">
              Add Content
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  )
}
