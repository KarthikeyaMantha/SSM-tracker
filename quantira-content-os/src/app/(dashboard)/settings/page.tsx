'use client'

import React, { useState } from 'react'
import { Card, Switch, Select, Button, Typography, Space, Divider, message, Tabs, Alert, Tag } from 'antd'
import { Settings, Bell, Database, Cloud, Globe, HelpCircle, Save, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react'

const { Title, Text } = Typography

export default function SettingsPage() {
  const [saving, setSaving] = useState(false)
  const [dbStatus, setDbStatus] = useState('Connected')

  const handleSave = () => {
    setSaving(true)
    setTimeout(() => {
      setSaving(false)
      message.success('System settings saved successfully!')
    }, 1000)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-['Inter',-apple-system,sans-serif]">
      {/* Header */}
      <div className="flex justify-between items-start flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">System Settings</h1>
          <p className="text-sm text-slate-400 mt-1 font-medium">Configure workspace behaviors, database engines, and API integrations</p>
        </div>
        <Button
          type="primary"
          onClick={handleSave}
          loading={saving}
          icon={<Save size={14} />}
          className="rounded-lg h-9 bg-blue-600 flex items-center gap-1.5"
        >
          Save Settings
        </Button>
      </div>

      {/* Main Tabs Container */}
      <Card className="rounded-xl border border-slate-100 shadow-sm p-4">
        <Tabs
          defaultActiveKey="general"
          items={[
            {
              key: 'general',
              label: <span className="flex items-center gap-2 font-bold text-xs"><Globe size={14} /> General</span>,
              children: (
                <div className="space-y-6 pt-4">
                  {/* Preferences section */}
                  <div>
                    <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider mb-4">Workspace Preferences</h3>
                    <div className="space-y-4">
                      {/* Interface Language */}
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-xs font-bold text-slate-800">Interface Language</p>
                          <p className="text-[10px] text-slate-400">Set the default localization display language.</p>
                        </div>
                        <Select defaultValue="en_IN" className="w-36 h-9" options={[{ value: 'en_IN', label: 'English (IN)' }, { value: 'en_US', label: 'English (US)' }]} />
                      </div>

                      <Divider className="my-0" />

                      {/* Auto-Sync frequency */}
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-xs font-bold text-slate-800">Auto-Sync Interval</p>
                          <p className="text-[10px] text-slate-400">Frequency of dynamic content synchronization sweeps.</p>
                        </div>
                        <Select defaultValue="5m" className="w-36 h-9" options={[{ value: '1m', label: '1 Minute' }, { value: '5m', label: '5 Minutes' }, { value: '15m', label: '15 Minutes' }]} />
                      </div>

                      <Divider className="my-0" />

                      {/* System Maintenance mode */}
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-xs font-bold text-slate-800">Live Analytics Capture</p>
                          <p className="text-[10px] text-slate-400">Stream live reaches and impressions calculations automatically.</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                    </div>
                  </div>
                </div>
              )
            },
            {
              key: 'notifications',
              label: <span className="flex items-center gap-2 font-bold text-xs"><Bell size={14} /> Notifications</span>,
              children: (
                <div className="space-y-6 pt-4">
                  <div>
                    <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider mb-4">Alert Preferences</h3>
                    <div className="space-y-4">
                      {[
                        { title: 'Email Alerts', subtitle: 'Receive updates for new content assignments and due dates.' },
                        { title: 'Approval Reminders', subtitle: 'Send automatic reminders for approvals and draft reviews.' },
                        { title: 'Weekly Reports digest', subtitle: 'Send weekly scorecard performance analytics summaries.' }
                      ].map((n, idx) => (
                        <div key={idx} className="space-y-4">
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <p className="text-xs font-bold text-slate-800">{n.title}</p>
                              <p className="text-[10px] text-slate-400">{n.subtitle}</p>
                            </div>
                            <Switch defaultChecked={idx !== 2} />
                          </div>
                          {idx !== 2 && <Divider className="my-0" />}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )
            },
            {
              key: 'integrations',
              label: <span className="flex items-center gap-2 font-bold text-xs"><Database size={14} /> Integrations</span>,
              children: (
                <div className="space-y-6 pt-4">
                  {/* Database configuration status */}
                  <div>
                    <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider mb-3">Database Engines</h3>
                    <div className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                          <Database size={16} className="text-emerald-500" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800 flex items-center gap-2">
                            Prisma Client Database Engine
                            <Tag color="green" className="text-[9px] font-black uppercase rounded">Connected</Tag>
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">Database server: PostgreSQL. Connected safely using environment variables.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Divider className="my-0" />

                  {/* API Connections statuses */}
                  <div>
                    <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider mb-4">External APIs</h3>
                    <div className="space-y-4">
                      {[
                        { service: 'Canva API Connection', desc: 'Sync asset layout elements directly from your Canva workspace.', connected: true },
                        { service: 'Google Drive SDK', desc: 'Store campaign audio and video files directly in cloud folders.', connected: true },
                        { service: 'Slack Webhooks API', desc: 'Post instant notifications when assets are reviewed and approved.', connected: false },
                      ].map((item, idx) => (
                        <div key={idx} className="space-y-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-3">
                              <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                                item.connected ? 'bg-blue-50' : 'bg-slate-100'
                              }`}>
                                <Cloud size={16} className={item.connected ? 'text-blue-500' : 'text-slate-400'} />
                              </div>
                              <div>
                                <p className="text-xs font-bold text-slate-800 flex items-center gap-2">
                                  {item.service}
                                  <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${
                                    item.connected ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'
                                  }`}>
                                    {item.connected ? 'Connected' : 'Offline'}
                                  </span>
                                </p>
                                <p className="text-[10px] text-slate-400 mt-0.5">{item.desc}</p>
                              </div>
                            </div>
                            <Button size="small" className="rounded-lg text-[10px] font-bold h-7">
                              {item.connected ? 'Disconnect' : 'Connect'}
                            </Button>
                          </div>
                          {idx !== 2 && <Divider className="my-0" />}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )
            }
          ]}
        />
      </Card>
    </div>
  )
}
