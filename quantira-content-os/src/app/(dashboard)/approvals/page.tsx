'use client'

import { useState, useEffect } from 'react'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import {
  CheckCircle2,
  XCircle,
  MessageSquare,
  Search,
  User,
  Layers,
  Clock,
  ThumbsUp,
  AlertTriangle,
  Building2,
  ChevronDown,
  ChevronUp,
  Edit2,
  Trash2,
  Plus,
  Linkedin,
  Instagram,
  Youtube,
  Twitter,
  Globe,
  ChevronLeft,
  ChevronRight,
  Menu,
  FileSignature,
  Calendar
} from 'lucide-react'
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
  Empty,
  Badge,
  Form,
  InputNumber,
  Avatar,
  Tooltip,
  Switch
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'

const { TextArea } = Input
const { Title, Text } = Typography
const { Option } = Select

interface Content {
  contentTitle: string
  platform: string
  clientId?: string | null
  priority?: string | null
  publishDate?: string | null
}

interface ApprovalItem {
  approvalId: number
  contentId: string
  content: Content
  approvalStatus: string
  submittedBy?: string | null
  reviewer?: string | null
  revisionRound: number
  feedback?: string | null
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

const getPriorityColor = (priority?: string | null) => {
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

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<ApprovalItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Filters State
  const [searchTerm, setSearchTerm] = useState('')
  const [filterPlatform, setFilterPlatform] = useState('')
  const [filterPriority, setFilterPriority] = useState('')
  const [myTasksOnly, setMyTasksOnly] = useState(false)

  const currentUser = 'Manager'

  // Kanban collapse columns state
  const [collapsedColumns, setCollapsedColumns] = useState<Record<string, boolean>>({
    'Pending Review': false,
    'In Revision': false,
    'Approved': false
  })

  // Mobile viewport state
  const [isMobile, setIsMobile] = useState(false)

  // New Add/Edit states
  const [contentList, setContentList] = useState<any[]>([])
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [form] = Form.useForm()

  // Detailed Modal states
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<ApprovalItem | null>(null)
  const [detailForm] = Form.useForm()

  // Quick QA Revision Feedback Modal control
  const [feedbackModal, setFeedbackModal] = useState<{ contentId: string; status: string } | null>(null)
  const [feedbackText, setFeedbackText] = useState('')

  useEffect(() => {
    setMounted(true)
    loadApprovals()
    loadContentList()

    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const loadContentList = async () => {
    try {
      const res = await fetch('/api/content-master')
      const data = await res.json()
      if (Array.isArray(data)) setContentList(data)
    } catch (error) {
      console.error('Failed to load content list:', error)
    }
  }

  const loadApprovals = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/approvals')
      const data = await res.json()
      if (Array.isArray(data)) {
        setApprovals(data)
      }
    } catch (error) {
      console.error('Failed to load approvals queue:', error)
      message.error('Failed to load approvals queue')
    } finally {
      setLoading(false)
    }
  }

  // Handle Drag & Drop dropping
  const onDragEnd = async (result: any) => {
    const { destination, source, draggableId } = result
    if (!destination) return
    if (destination.droppableId === source.droppableId && destination.index === source.index) return

    const draggableItem = approvals.find(p => p.contentId === draggableId)
    if (!draggableItem) return

    let newStatus = 'Pending'
    if (destination.droppableId === 'In Revision') {
      newStatus = 'Revision'
    } else if (destination.droppableId === 'Approved') {
      newStatus = 'Approved'
    }

    // If moved to Revision, open feedback modal first to prompt QA details
    if (newStatus === 'Revision') {
      setFeedbackModal({ contentId: draggableId, status: 'Revision' })
      setFeedbackText('')
      return
    }

    // Optimistic Update
    setApprovals(prev =>
      prev.map(p =>
        p.contentId === draggableId
          ? { ...p, approvalStatus: newStatus }
          : p
      )
    )

    try {
      const res = await fetch('/api/approvals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentId: draggableId,
          approvalStatus: newStatus
        })
      })

      if (res.ok) {
        message.success(`Status updated to ${destination.droppableId}`)
        loadApprovals()
      } else {
        message.error('Failed to update status on server')
        loadApprovals()
      }
    } catch (error) {
      console.error(error)
      message.error('Error updating status')
      loadApprovals()
    }
  }

  // Quick QA Action button (Approve or Reject/Revision)
  const handleAction = async (contentId: string, status: string) => {
    if (status === 'Revision') {
      setFeedbackModal({ contentId, status })
      setFeedbackText('')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/approvals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentId, approvalStatus: status })
      })

      if (res.ok) {
        message.success(`Approval status updated to ${status}`)
        loadApprovals()
      } else {
        message.error('Failed to update status')
      }
    } catch (error) {
      console.error('Failed to update approval action:', error)
      message.error('Error occurred.')
    } finally {
      setSaving(false)
    }
  }

  // Submit revision instructions from modal
  const submitFeedback = async () => {
    if (!feedbackModal) return
    setSaving(true)
    try {
      const res = await fetch('/api/approvals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentId: feedbackModal.contentId,
          approvalStatus: 'Revision',
          feedback: feedbackText
        })
      })

      if (res.ok) {
        message.success('Revision feedback submitted successfully!')
        setFeedbackModal(null)
        loadApprovals()
      } else {
        message.error('Failed to submit revision feedback.')
      }
    } catch (error) {
      console.error(error)
      message.error('Error submitting feedback.')
    } finally {
      setSaving(false)
    }
  }

  // Mobile status change fallback
  const handleMobileStatusChange = async (contentId: string, columnName: string) => {
    let newStatus = 'Pending'
    if (columnName === 'In Revision') {
      newStatus = 'Revision'
    } else if (columnName === 'Approved') {
      newStatus = 'Approved'
    }

    if (newStatus === 'Revision') {
      setFeedbackModal({ contentId, status: 'Revision' })
      setFeedbackText('')
      return
    }

    setApprovals(prev =>
      prev.map(p =>
        p.contentId === contentId
          ? { ...p, approvalStatus: newStatus }
          : p
      )
    )

    try {
      const res = await fetch('/api/approvals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentId, approvalStatus: newStatus })
      })

      if (res.ok) {
        message.success(`Status updated to ${columnName}`)
      } else {
        message.error('Failed to update status')
        loadApprovals()
      }
    } catch (err) {
      console.error(err)
      loadApprovals()
    }
  }

  // Filter queue items
  const filteredApprovals = approvals.filter(item => {
    const titleMatch = item.content.contentTitle.toLowerCase().includes(searchTerm.toLowerCase())
    const submittedMatch = item.submittedBy?.toLowerCase().includes(searchTerm.toLowerCase()) || false
    const reviewerMatch = item.reviewer?.toLowerCase().includes(searchTerm.toLowerCase()) || false
    const matchesSearch = titleMatch || submittedMatch || reviewerMatch

    const matchesPlatform = filterPlatform ? item.content.platform === filterPlatform : true
    const matchesPriority = filterPriority ? item.content.priority === filterPriority : true

    const matchesUser = myTasksOnly
      ? item.reviewer === currentUser || item.submittedBy === currentUser
      : true

    return matchesSearch && matchesPlatform && matchesPriority && matchesUser
  })

  // Get Column items
  const getColumnItems = (columnName: string) => {
    return filteredApprovals.filter(item => {
      const status = item.approvalStatus || 'Pending'
      if (columnName === 'Pending Review') {
        return status === 'Pending'
      }
      if (columnName === 'In Revision') {
        return status === 'Revision'
      }
      if (columnName === 'Approved') {
        return status === 'Approved'
      }
      return false
    })
  }

  // Open Edit Approval Modal
  const handleEdit = (record: any) => {
    setSelectedItem(record)
    detailForm.setFieldsValue({
      contentId: record.contentId,
      submittedBy: record.submittedBy || '',
      reviewer: record.reviewer || '',
      revisionRound: record.revisionRound || 1,
      approvalStatus: record.approvalStatus || 'Pending',
      feedback: record.feedback || ''
    })
    setIsDetailModalOpen(true)
  }

  const handleDetailSubmit = async (values: any) => {
    if (!selectedItem) return
    setSaving(true)
    try {
      const res = await fetch('/api/approvals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentId: selectedItem.contentId,
          submittedBy: values.submittedBy,
          reviewer: values.reviewer || '',
          revisionRound: parseInt(values.revisionRound) || 1,
          approvalStatus: values.approvalStatus || 'Pending',
          feedback: values.feedback || ''
        })
      })

      if (res.ok) {
        message.success('Approval record updated successfully!')
        setIsDetailModalOpen(false)
        setSelectedItem(null)
        loadApprovals()
      } else {
        const err = await res.json()
        message.error(err.error || 'Failed to submit updates.')
      }
    } catch (error) {
      console.error(error)
      message.error('An error occurred during submission.')
    } finally {
      setSaving(false)
    }
  }

  // Open Preset Add Modal
  const handleAddNewClick = (columnName: string) => {
    let presetStatusVal = 'Pending'
    if (columnName === 'In Revision') presetStatusVal = 'Revision'
    if (columnName === 'Approved') presetStatusVal = 'Approved'

    form.resetFields()
    form.setFieldsValue({
      approvalStatus: presetStatusVal,
      revisionRound: 1
    })
    setIsAddEditModalOpen(true)
  }

  const handleAddEditSubmit = async (values: any) => {
    setSaving(true)
    try {
      const res = await fetch('/api/approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentId: values.contentId,
          submittedBy: values.submittedBy,
          reviewer: values.reviewer,
          revisionRound: parseInt(values.revisionRound) || 1,
          feedback: values.feedback
        })
      })

      if (res.ok) {
        // If status was preset to something else than pending, do a subsequent PUT to set the desired status
        if (values.approvalStatus !== 'Pending') {
          await fetch('/api/approvals', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contentId: values.contentId,
              approvalStatus: values.approvalStatus
            })
          })
        }

        message.success('Approval record created successfully!')
        setIsAddEditModalOpen(false)
        form.resetFields()
        loadApprovals()
      } else {
        const err = await res.json()
        message.error(err.error || 'Failed to submit.')
      }
    } catch (error) {
      console.error(error)
      message.error('Error creating approval record.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = (record: any) => {
    Modal.confirm({
      title: `Are you sure you want to delete this approval record?`,
      content: 'This action cannot be undone.',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          const res = await fetch(`/api/approvals?contentId=${encodeURIComponent(record.contentId)}`, {
            method: 'DELETE'
          })
          if (res.ok) {
            message.success('Approval record deleted successfully!')
            loadApprovals()
          } else {
            const err = await res.json()
            message.error(err.error || 'Failed to delete approval record.')
          }
        } catch (error) {
          console.error('Failed to delete approval:', error)
          message.error('An error occurred while deleting.')
        }
      }
    })
  }

  const toggleCollapse = (columnName: string) => {
    setCollapsedColumns(prev => ({
      ...prev,
      [columnName]: !prev[columnName]
    }))
  }

  const boardColumns = [
    { name: 'Pending Review', color: '#fa8c16', bg: '#fffbe6' },
    { name: 'In Revision', color: '#ff4d4f', bg: '#fff2f0' },
    { name: 'Approved', color: '#52c41a', bg: '#f6ffed' }
  ]

  const columns: any[] = [] // lint specs match

  if (!mounted) return null

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 min-h-[90vh]">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <Title level={2} className="!mb-0 flex items-center gap-3 !font-extrabold tracking-tight">
            <CheckCircle2 className="h-7 w-7 text-blue-600" /> Approvals Queue
          </Title>
          <p className="text-slate-500 text-sm mt-1">
            Drag and drop content pieces between review stages, log QA remarks, and request revisions.
          </p>
        </div>
      </div>

      {/* Filter bar */}
      <Card bordered={false} className="shadow-sm border border-slate-100" bodyStyle={{ padding: '16px' }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={8}>
            <Input
              prefix={<Menu size={16} className="text-slate-400 mr-1.5" />}
              placeholder="Search title, creator, reviewer..."
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
            <Text className="text-xs font-semibold text-slate-500">Assigned To Me:</Text>
            <Switch checked={myTasksOnly} onChange={setMyTasksOnly} />
          </Col>
        </Row>
      </Card>

      {/* Board Canvas */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <Text className="text-slate-400 font-semibold">Loading Approvals Queue...</Text>
        </div>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex flex-col md:flex-row gap-4 overflow-x-auto pb-6 select-none min-h-[600px] items-start">
            {boardColumns.map(col => {
              const columnName = col.name
              const isCollapsed = collapsedColumns[columnName]
              const items = getColumnItems(columnName)

              if (isCollapsed) {
                // Collapsed Column sidebar state
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
                  className="flex flex-col w-full md:w-[320px] shrink-0 bg-slate-50 border border-slate-100 rounded-2xl p-4 h-[650px] shadow-sm"
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
                          onClick={() => handleEdit(item)}
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
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Change Stage:</span>
                            <Select
                              value={columnName}
                              size="small"
                              onClick={e => e.stopPropagation()}
                              onChange={val => handleMobileStatusChange(item.contentId, val)}
                              style={{ width: 130, fontSize: '11px' }}
                            >
                              <Option value="Pending Review">Pending Review</Option>
                              <Option value="In Revision">In Revision</Option>
                              <Option value="Approved">Approved</Option>
                            </Select>
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
                              item.approvalStatus !== 'Approved'

                            return (
                              <Draggable draggableId={item.contentId} index={index} key={item.contentId}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    onClick={() => handleEdit(item)}
                                    className={`bg-white border border-slate-200 p-4 rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer relative group ${
                                      snapshot.isDragging ? 'rotate-2 shadow-lg border-blue-500 scale-102 ring-4 ring-blue-500/10' : ''
                                    }`}
                                  >
                                    <div className="flex justify-between items-start gap-2 mb-2">
                                      <Text className="font-bold text-slate-800 text-xs line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors">
                                        {item.content.contentTitle}
                                      </Text>
                                      <div className="flex items-center gap-1 shrink-0">
                                        <Button
                                          type="text"
                                          size="small"
                                          icon={<Edit2 size={13} />}
                                          onClick={e => {
                                            e.stopPropagation()
                                            handleEdit(item)
                                          }}
                                          title="Expand details"
                                          aria-label="Expand details"
                                          className="opacity-0 group-hover:opacity-100 transition-opacity p-0 w-6 h-6 flex items-center justify-center"
                                        />
                                        <Button
                                          type="text"
                                          danger
                                          size="small"
                                          icon={<Trash2 size={13} />}
                                          onClick={e => {
                                            e.stopPropagation()
                                            handleDelete(item)
                                          }}
                                          className="opacity-0 group-hover:opacity-100 transition-opacity p-0 w-6 h-6 flex items-center justify-center"
                                        />
                                      </div>
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

                                    {/* Feedback preview snippet */}
                                    {item.feedback && (
                                      <div className="mt-2.5 p-2 bg-slate-50 border border-slate-100 rounded-lg text-[10px] text-slate-500 italic line-clamp-2">
                                        "{item.feedback}"
                                      </div>
                                    )}

                                    {/* Mid-bottom client metadata */}
                                    {item.content.clientId && (
                                      <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400 mt-2">
                                        <Building2 size={11} />
                                        <span>{item.content.clientId}</span>
                                      </div>
                                    )}

                                    {/* Quick QA decision triggers inside pending review cards */}
                                    {item.approvalStatus === 'Pending' && (
                                      <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-100">
                                        <Button
                                          type="primary"
                                          size="small"
                                          style={{ backgroundColor: '#52c41a', borderColor: '#52c41a', fontSize: '9px', height: '22px' }}
                                          onClick={e => {
                                            e.stopPropagation()
                                            handleAction(item.contentId, 'Approved')
                                          }}
                                          loading={saving}
                                        >
                                          Approve
                                        </Button>
                                        <Button
                                          danger
                                          size="small"
                                          style={{ fontSize: '9px', height: '22px' }}
                                          onClick={e => {
                                            e.stopPropagation()
                                            handleAction(item.contentId, 'Revision')
                                          }}
                                          loading={saving}
                                        >
                                          Request Revision
                                        </Button>
                                      </div>
                                    )}

                                    {/* Bottom Info and avatars */}
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
                                        <Badge
                                          count={`Round ${item.revisionRound}`}
                                          style={{ backgroundColor: '#1890ff', fontSize: '9px', fontWeight: 'bold', height: '14px', lineHeight: '14px', minWidth: '18px', padding: '0 4px' }}
                                        />
                                      </div>

                                      <Avatar.Group size="small" maxCount={2}>
                                        {item.submittedBy && (
                                          <Tooltip title={`Submitted By: ${item.submittedBy}`}>
                                            <Avatar style={{ backgroundColor: '#fa8c16', fontSize: '9px' }}>{getInitials(item.submittedBy)}</Avatar>
                                          </Tooltip>
                                        )}
                                        {item.reviewer && (
                                          <Tooltip title={`Reviewer: ${item.reviewer}`}>
                                            <Avatar style={{ backgroundColor: '#52c41a', fontSize: '9px' }}>{getInitials(item.reviewer)}</Avatar>
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

      {/* Edit Approval Details Modal */}
      <Modal
        title={<span className="font-bold text-base text-slate-800">Edit Approval Pipeline Item</span>}
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
                {selectedItem.content.clientId && (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-slate-500">
                    <Building2 size={12} className="text-slate-400 shrink-0" />
                    {selectedItem.content.clientId}
                  </span>
                )}
              </div>
            </div>

            <Form.Item
              label={<span className="text-xs font-semibold text-slate-600">Submitted By</span>}
              name="submittedBy"
            >
              <Input placeholder="E.g., Creator" className="rounded-lg p-2 text-xs" />
            </Form.Item>

            <Form.Item
              label={<span className="text-xs font-semibold text-slate-600">Reviewer</span>}
              name="reviewer"
            >
              <Input placeholder="E.g., Manager" className="rounded-lg p-2 text-xs" />
            </Form.Item>

            <Form.Item
              label={<span className="text-xs font-semibold text-slate-600">Revision Round</span>}
              name="revisionRound"
              rules={[{ required: true, message: 'Please input revision round!' }]}
            >
              <InputNumber min={1} className="w-full rounded-lg p-1 text-xs" />
            </Form.Item>

            <Form.Item
              label={<span className="text-xs font-semibold text-slate-600">Approval Status</span>}
              name="approvalStatus"
            >
              <Select className="text-xs">
                <Option value="Pending">Pending Review</Option>
                <Option value="Approved">Approved</Option>
                <Option value="Revision">In Revision</Option>
              </Select>
            </Form.Item>

            <Form.Item
              label={<span className="text-xs font-semibold text-slate-600">Feedback</span>}
              name="feedback"
            >
              <TextArea rows={3} placeholder="Provide feedback or revision instructions..." className="rounded-lg p-2 text-xs" />
            </Form.Item>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
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
          </Form>
        )}
      </Modal>

      {/* Add New Approval Modal */}
      <Modal
        title={<span className="font-bold text-base text-slate-800">Add New Approval Entry</span>}
        open={isAddEditModalOpen}
        onCancel={() => {
          if (!saving) {
            setIsAddEditModalOpen(false)
            form.resetFields()
          }
        }}
        footer={null}
        destroyOnClose
        width={500}
        className="rounded-2xl overflow-hidden"
        keyboard={true}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleAddEditSubmit}
          className="mt-4 space-y-4"
        >
          <Form.Item
            label={<span className="text-xs font-semibold text-slate-600">Select Content Item *</span>}
            name="contentId"
            rules={[{ required: true, message: 'Please select a content item!' }]}
          >
            <Select placeholder="Choose content item..." className="text-xs">
              {contentList.map(c => (
                <Option key={c.contentId} value={c.contentId}>
                  {c.contentTitle} ({c.contentId})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label={<span className="text-xs font-semibold text-slate-600">Submitted By</span>}
            name="submittedBy"
          >
            <Input placeholder="E.g., Creator" className="rounded-lg p-2 text-xs" />
          </Form.Item>

          <Form.Item
            label={<span className="text-xs font-semibold text-slate-600">Reviewer</span>}
            name="reviewer"
          >
            <Input placeholder="E.g., Manager" className="rounded-lg p-2 text-xs" />
          </Form.Item>

          <Form.Item
            label={<span className="text-xs font-semibold text-slate-600">Revision Round</span>}
            name="revisionRound"
            rules={[{ required: true, message: 'Please input revision round!' }]}
          >
            <InputNumber min={1} className="w-full rounded-lg p-1 text-xs" />
          </Form.Item>

          <Form.Item
            label={<span className="text-xs font-semibold text-slate-600">Approval Status</span>}
            name="approvalStatus"
          >
            <Select className="text-xs">
              <Option value="Pending">Pending Review</Option>
              <Option value="Approved">Approved</Option>
              <Option value="Revision">In Revision</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label={<span className="text-xs font-semibold text-slate-600">Feedback</span>}
            name="feedback"
          >
            <TextArea rows={3} placeholder="Provide feedback or revision instructions..." className="rounded-lg p-2 text-xs" />
          </Form.Item>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
            <Button
              onClick={() => {
                setIsAddEditModalOpen(false)
                form.resetFields()
              }}
              disabled={saving}
              className="rounded-lg text-xs"
            >
              Cancel
            </Button>
            <Button type="primary" htmlType="submit" loading={saving} className="rounded-lg bg-blue-600 text-xs border-none font-semibold">
              Add Entry
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Feedback Request Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2.5 text-rose-600 pb-2 border-b border-slate-100">
            <MessageSquare size={20} className="stroke-[2.5]" />
            <span className="text-base font-extrabold font-['Plus_Jakarta_Sans'] text-slate-800">
              Submit Revision Instructions
            </span>
          </div>
        }
        open={!!feedbackModal}
        onCancel={() => setFeedbackModal(null)}
        footer={[
          <Button key="cancel" onClick={() => setFeedbackModal(null)} disabled={saving}>
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            danger
            onClick={submitFeedback}
            disabled={saving || !feedbackText.trim()}
            loading={saving}
          >
            Send Instructions
          </Button>
        ]}
        destroyOnClose
        keyboard={true}
      >
        <div className="space-y-4 py-3 font-['Inter',-apple-system,sans-serif]">
          <p className="text-xs text-slate-400 leading-relaxed font-medium">
            Provide exact feedback details for the content creator. This will log in their revision panel and increase the revision cycle count.
          </p>

          <TextArea
            rows={4}
            placeholder="E.g., Please change the main header font size and proofread the call-to-action link."
            value={feedbackText}
            onChange={e => setFeedbackText(e.target.value)}
          />
        </div>
      </Modal>
    </div>
  )
}
