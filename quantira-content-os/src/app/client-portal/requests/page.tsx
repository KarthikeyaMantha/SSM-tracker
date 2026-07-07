'use client'

import React, { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Card, Form, Input, Select, DatePicker, Button, message } from 'antd'
import { Send, Inbox } from 'lucide-react'
import { useRouter } from 'next/navigation'

const { TextArea } = Input

export default function ClientRequestPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [form] = Form.useForm()
  const [submitting, setSubmitting] = useState(false)

  const clientName = session?.user?.clientName || 'Client'
  const userEmail = session?.user?.email || 'Client User'

  const handleSubmit = async (values: any) => {
    setSubmitting(true)
    try {
      const payload = {
        requestedBy: userEmail,
        client: clientName,
        platform: values.platform,
        contentType: values.contentType,
        priority: values.priority || 'Normal',
        objective: values.objective,
        brief: values.brief,
        dueDate: values.dueDate ? values.dueDate.toISOString() : null,
      }

      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        throw new Error('Failed to submit content request')
      }

      message.success('Content request submitted successfully! Your account manager has been notified.')
      form.resetFields()
      router.push('/client-portal/dashboard')
    } catch (err: any) {
      console.error(err)
      message.error(err.message || 'Something went wrong.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto font-['Inter',-apple-system,sans-serif]">
      {/* Header */}
      <div className="border-b border-slate-100 pb-5">
        <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
          <Inbox className="w-6 h-6 text-blue-600" /> New Content Request
        </h1>
        <p className="text-slate-500 text-xs mt-1">Submit a new copy production request for review and scheduling.</p>
      </div>

      <Card bordered={false} className="shadow-sm border border-slate-100 rounded-2xl p-4">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          requiredMark={false}
          initialValues={{ priority: 'Normal' }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Form.Item
              label={<span className="text-xs font-bold text-slate-600">Publish Platform</span>}
              name="platform"
              rules={[{ required: true, message: 'Please select a platform' }]}
            >
              <Select placeholder="Select Platform" size="large">
                <Select.Option value="LinkedIn">LinkedIn</Select.Option>
                <Select.Option value="Twitter">Twitter / X</Select.Option>
                <Select.Option value="Instagram">Instagram</Select.Option>
                <Select.Option value="YouTube">YouTube</Select.Option>
                <Select.Option value="Blog">Blog / Website</Select.Option>
                <Select.Option value="Newsletter">Newsletter</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item
              label={<span className="text-xs font-bold text-slate-600">Content Type</span>}
              name="contentType"
              rules={[{ required: true, message: 'Please select content type' }]}
            >
              <Select placeholder="Select Type" size="large">
                <Select.Option value="Carousel">Carousel Post</Select.Option>
                <Select.Option value="Long Form">Long Form Post</Select.Option>
                <Select.Option value="Short Form">Short Form Post</Select.Option>
                <Select.Option value="Video Script">Video Script</Select.Option>
                <Select.Option value="Article">Blog Article</Select.Option>
                <Select.Option value="Ad Copy">Ad Copy</Select.Option>
              </Select>
            </Form.Item>
          </div>

          <Form.Item
            label={<span className="text-xs font-bold text-slate-600">Content Objective</span>}
            name="objective"
            rules={[{ required: true, message: 'Please enter the content objective' }]}
          >
            <Input placeholder="e.g. Lead generation for new Q3 webinar" size="large" />
          </Form.Item>

          <Form.Item
            label={<span className="text-xs font-bold text-slate-600">Detailed Brief &amp; Guidelines</span>}
            name="brief"
            rules={[{ required: true, message: 'Please enter details or brief description' }]}
          >
            <TextArea 
              placeholder="Provide context, references, key messages, target audience, call-to-actions, and copy directions..." 
              rows={5} 
            />
          </Form.Item>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Form.Item
              label={<span className="text-xs font-bold text-slate-600">Requested Due Date</span>}
              name="dueDate"
              rules={[{ required: true, message: 'Please select a due date' }]}
            >
              <DatePicker className="w-full" size="large" />
            </Form.Item>

            <Form.Item
              label={<span className="text-xs font-bold text-slate-600">Priority Level</span>}
              name="priority"
            >
              <Select size="large">
                <Select.Option value="Low">Low</Select.Option>
                <Select.Option value="Normal">Normal</Select.Option>
                <Select.Option value="High">High</Select.Option>
                <Select.Option value="Urgent">Urgent</Select.Option>
              </Select>
            </Form.Item>
          </div>

          <div className="border-t border-slate-100 pt-5 mt-5 flex justify-end">
            <Button
              type="primary"
              htmlType="submit"
              loading={submitting}
              icon={<Send size={14} />}
              className="bg-blue-600 hover:bg-blue-700 border-none font-bold rounded-xl h-11 px-6 flex items-center gap-2 cursor-pointer shadow-sm shadow-blue-200"
            >
              Submit Request
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  )
}
