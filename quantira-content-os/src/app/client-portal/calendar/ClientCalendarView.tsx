'use client'

import React from 'react'
import { Card, Badge, Typography, Tag } from 'antd'
import { Calendar } from 'lucide-react'

const { Text } = Typography

interface ContentItem {
  id: number
  contentId: string
  contentTitle: string
  platform: string
  status: string
  publishDate: string | null
}

interface ClientCalendarViewProps {
  clientName: string
  content: ContentItem[]
}

export default function ClientCalendarView({ clientName, content }: ClientCalendarViewProps) {
  // Group content by publish date string
  const groupedContent: { [date: string]: ContentItem[] } = {}
  content.forEach(item => {
    if (item.publishDate) {
      const dateKey = new Date(item.publishDate).toLocaleDateString('en-US', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
      if (!groupedContent[dateKey]) {
        groupedContent[dateKey] = []
      }
      groupedContent[dateKey].push(item)
    }
  })

  const dateKeys = Object.keys(groupedContent)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-100 pb-5">
        <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
          <Calendar className="w-6 h-6 text-blue-600" /> Content Calendar
        </h1>
        <p className="text-slate-500 text-xs mt-1">View scheduled publishing dates and master copy releases for {clientName}.</p>
      </div>

      {dateKeys.length === 0 ? (
        <Card bordered={false} className="shadow-sm border border-slate-100 rounded-2xl text-center py-12">
          <Text type="secondary" className="text-sm font-medium">No content scheduled in the calendar yet.</Text>
        </Card>
      ) : (
        <div className="space-y-6">
          {dateKeys.map(dateKey => (
            <div key={dateKey} className="space-y-3">
              <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest pl-1">{dateKey}</h3>
              <div className="grid grid-cols-1 gap-3">
                {groupedContent[dateKey].map(item => (
                  <Card 
                    key={item.id} 
                    bordered={false} 
                    className="shadow-sm border border-slate-100 rounded-2xl hover:shadow-md transition-all"
                    styles={{ body: { padding: '16px 24px' } }}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="space-y-1">
                        <span className="text-sm font-bold text-slate-800 block">{item.contentTitle}</span>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] text-slate-400 font-mono">ID: {item.contentId}</span>
                          <span className="text-slate-300">•</span>
                          <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">{item.platform}</span>
                        </div>
                      </div>
                      <div className="shrink-0 flex items-center gap-2">
                        <Tag 
                          color={item.status === 'Published' ? 'success' : item.status === 'Planned' ? 'processing' : 'warning'} 
                          className="text-[10px] font-extrabold uppercase py-0.5 px-2 rounded border-none m-0"
                        >
                          {item.status}
                        </Tag>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
