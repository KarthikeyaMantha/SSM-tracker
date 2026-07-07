'use client'

import React, { useState, useEffect } from 'react'
import { Card, Avatar, Typography, Button, Input, Form, Switch, Divider, message, Tag, Modal } from 'antd'
import { User, Mail, Shield, Key, Smartphone, Save, BadgeCheck, QrCode } from 'lucide-react'
import { useProfile } from '@/context/ProfileContext'

const { Title, Text } = Typography

export default function ProfilePage() {
  const { profile, updateProfile } = useProfile()
  const [form] = Form.useForm()
  const [passwordForm] = Form.useForm()
  const [mfaCodeForm] = Form.useForm()

  const [saving, setSaving] = useState(false)
  const [twoFactor, setTwoFactor] = useState(false)
  
  // Modals state
  const [passwordModalOpen, setPasswordModalOpen] = useState(false)
  const [mfaModalOpen, setMfaModalOpen] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [verifyingMfa, setVerifyingMfa] = useState(false)

  // Sync form values on profile load
  useEffect(() => {
    form.setFieldsValue({
      fullName: profile.fullName,
      email: profile.email,
      phone: profile.phone,
      role: profile.role,
    })
  }, [profile, form])

  const handleSave = (values: any) => {
    setSaving(true)
    setTimeout(() => {
      updateProfile({
        fullName: values.fullName,
        email: values.email,
        phone: values.phone,
      })
      setSaving(false)
      message.success('Account profile updated successfully!')
    }, 1000)
  }

  const handlePasswordChange = (values: any) => {
    setChangingPassword(true)
    setTimeout(() => {
      setChangingPassword(false)
      setPasswordModalOpen(false)
      passwordForm.resetFields()
      message.success('Password updated successfully!')
    }, 1200)
  }

  const handleMfaToggle = (checked: boolean) => {
    if (checked) {
      setMfaModalOpen(true)
    } else {
      setTwoFactor(false)
      message.info('Two-Factor Authentication disabled.')
    }
  }

  const handleMfaVerify = (values: any) => {
    setVerifyingMfa(true)
    setTimeout(() => {
      setVerifyingMfa(false)
      setMfaModalOpen(false)
      setTwoFactor(true)
      mfaCodeForm.resetFields()
      message.success('Two-Factor Authentication configured successfully!')
    }, 1200)
  }

  const initials = profile.fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase() || 'QA'

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-['Inter',-apple-system,sans-serif]">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Account &amp; Profile</h1>
        <p className="text-sm text-slate-400 mt-1 font-medium">Manage your personal settings, security, and preferences</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: User Card */}
        <div className="md:col-span-1 space-y-6">
          <Card className="rounded-xl border border-slate-100 shadow-sm text-center p-4">
            <div className="flex flex-col items-center">
              <Avatar
                size={96}
                className="bg-blue-600 font-bold border-4 border-blue-50 text-3xl shadow-sm mb-4"
              >
                {initials}
              </Avatar>
              <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-1.5 justify-center">
                {profile.fullName}
                <BadgeCheck size={16} className="text-blue-500 fill-blue-50" />
              </h3>
              <p className="text-xs text-slate-400 font-medium">{profile.email}</p>
              
              <div className="mt-4 flex flex-wrap gap-2 justify-center">
                <Tag color="blue" className="text-[10px] font-black uppercase rounded-full px-2.5">
                  {profile.role}
                </Tag>
                <Tag color="green" className="text-[10px] font-black uppercase rounded-full px-2.5">
                  Verified
                </Tag>
              </div>
            </div>

            <Divider className="my-5" />

            <div className="space-y-3.5 text-left text-xs text-slate-500 font-medium">
              <div className="flex justify-between">
                <span>Account ID</span>
                <span className="font-bold text-slate-700">USR-4901</span>
              </div>
              <div className="flex justify-between">
                <span>Member Since</span>
                <span className="font-bold text-slate-700">June 2026</span>
              </div>
              <div className="flex justify-between">
                <span>Last Login</span>
                <span className="font-bold text-slate-700">Just now</span>
              </div>
            </div>
          </Card>

          {/* Connected Devices */}
          <Card className="rounded-xl border border-slate-100 shadow-sm p-4" title={<span className="text-xs font-black text-slate-700 uppercase tracking-wider">Active Sessions</span>}>
            <div className="space-y-4">
              {[
                { browser: 'Chrome on Windows', location: 'Hyderabad, IN', current: true },
                { browser: 'Safari on iPhone', location: 'Hyderabad, IN', current: false },
              ].map((s, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs">
                  <Smartphone size={16} className="text-slate-400 mt-0.5" />
                  <div>
                    <p className="font-bold text-slate-700 flex items-center gap-1.5">
                      {s.browser}
                      {s.current && <span className="text-[9px] bg-emerald-50 text-emerald-600 font-extrabold px-1.5 py-0.5 rounded">Active</span>}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{s.location}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Column: Edit Profile & Security Details */}
        <div className="md:col-span-2 space-y-6">
          <Card className="rounded-xl border border-slate-100 shadow-sm p-6" title={<span className="text-xs font-black text-slate-700 uppercase tracking-wider">Personal Information</span>}>
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSave}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Form.Item
                  label={<span className="text-xs font-bold text-slate-600">Full Name</span>}
                  name="fullName"
                  rules={[{ required: true, message: 'Name is required' }]}
                >
                  <Input prefix={<User size={14} className="text-slate-400 mr-1" />} className="rounded-lg h-9" />
                </Form.Item>

                <Form.Item
                  label={<span className="text-xs font-bold text-slate-600">Email Address</span>}
                  name="email"
                  rules={[{ required: true, type: 'email', message: 'Valid email is required' }]}
                >
                  <Input prefix={<Mail size={14} className="text-slate-400 mr-1" />} className="rounded-lg h-9" />
                </Form.Item>

                <Form.Item
                  label={<span className="text-xs font-bold text-slate-600">Phone Number</span>}
                  name="phone"
                >
                  <Input className="rounded-lg h-9" />
                </Form.Item>

                <Form.Item
                  label={<span className="text-xs font-bold text-slate-600">Role</span>}
                  name="role"
                >
                  <Input disabled className="rounded-lg h-9 bg-slate-50 text-slate-400" />
                </Form.Item>
              </div>

              <div className="flex justify-end mt-4">
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={saving}
                  icon={<Save size={14} />}
                  className="rounded-lg h-9 bg-blue-600 flex items-center gap-1.5"
                >
                  Save Profile
                </Button>
              </div>
            </Form>
          </Card>

          {/* Security & Authentication */}
          <Card className="rounded-xl border border-slate-100 shadow-sm p-6" title={<span className="text-xs font-black text-slate-700 uppercase tracking-wider">Security &amp; Credentials</span>}>
            <div className="space-y-6">
              {/* Password update modal trigger */}
              <div className="flex items-start gap-4 justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
                    <Key size={16} className="text-amber-500" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">Change Password</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">Keep your security robust with a unique passcode credentials reset.</p>
                  </div>
                </div>
                <Button onClick={() => setPasswordModalOpen(true)} className="rounded-lg text-xs font-bold h-8 border-slate-200">
                  Reset Password
                </Button>
              </div>

              <Divider className="my-0" />

              {/* Two-Factor Authentication */}
              <div className="flex items-start gap-4 justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                    <Shield size={16} className="text-blue-500" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">Two-Factor Authentication</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">Add an extra verification layer to guard access credentials verification.</p>
                  </div>
                </div>
                <Switch checked={twoFactor} onChange={handleMfaToggle} />
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* ─── Change Password Modal ────────────────────────────────────────── */}
      <Modal
        title={<span className="font-extrabold text-slate-800 text-sm">Change Credentials Password</span>}
        open={passwordModalOpen}
        onCancel={() => { setPasswordModalOpen(false); passwordForm.resetFields() }}
        footer={null}
        className="rounded-2xl"
      >
        <Form
          form={passwordForm}
          layout="vertical"
          onFinish={handlePasswordChange}
          className="pt-4"
        >
          <Form.Item
            label={<span className="text-xs font-bold text-slate-600">Current Password</span>}
            name="currentPassword"
            rules={[{ required: true, message: 'Please enter your current password' }]}
          >
            <Input.Password className="rounded-lg h-9" />
          </Form.Item>

          <Form.Item
            label={<span className="text-xs font-bold text-slate-600">New Password</span>}
            name="newPassword"
            rules={[{ required: true, min: 6, message: 'Password must be at least 6 characters long' }]}
          >
            <Input.Password className="rounded-lg h-9" />
          </Form.Item>

          <Form.Item
            label={<span className="text-xs font-bold text-slate-600">Confirm New Password</span>}
            name="confirmPassword"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: 'Please confirm your new password' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve()
                  }
                  return Promise.reject(new Error('Passwords do not match!'))
                },
              }),
            ]}
          >
            <Input.Password className="rounded-lg h-9" />
          </Form.Item>

          <div className="flex justify-end gap-2 pt-2">
            <Button onClick={() => { setPasswordModalOpen(false); passwordForm.resetFields() }} className="rounded-lg text-xs font-bold h-9">
              Cancel
            </Button>
            <Button type="primary" htmlType="submit" loading={changingPassword} className="rounded-lg text-xs font-bold h-9 bg-blue-600">
              Save Password
            </Button>
          </div>
        </Form>
      </Modal>

      {/* ─── Two-Factor Setup Modal (MFA Simulation) ───────────────────────── */}
      <Modal
        title={<span className="font-extrabold text-slate-800 text-sm">Two-Factor Authentication Setup</span>}
        open={mfaModalOpen}
        onCancel={() => { setMfaModalOpen(false); mfaCodeForm.resetFields() }}
        footer={null}
        className="rounded-2xl"
      >
        <Form
          form={mfaCodeForm}
          layout="vertical"
          onFinish={handleMfaVerify}
          className="pt-4 space-y-4"
        >
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex flex-col items-center text-center gap-3">
            <QrCode size={120} className="text-slate-700 bg-white p-2 rounded-lg border" />
            <div>
              <p className="text-xs font-bold text-slate-800">Scan QR Code</p>
              <p className="text-[10px] text-slate-400 mt-1 max-w-xs">
                Scan this barcode with your authenticator application (Google Authenticator / Authy) or enter code below manually.
              </p>
              <code className="text-[10px] font-mono bg-white px-2 py-1 border rounded block mt-2 text-slate-600 select-all">
                QTOS AUTH KEY SEC 77892
              </code>
            </div>
          </div>

          <Form.Item
            label={<span className="text-xs font-bold text-slate-600">Verification Code</span>}
            name="code"
            rules={[
              { required: true, len: 6, message: 'Please enter the 6-digit confirmation code' },
              { pattern: /^[0-9]+$/, message: 'Code must contain numbers only' }
            ]}
          >
            <Input placeholder="000000" maxLength={6} className="rounded-lg h-10 text-center font-mono tracking-widest text-lg" />
          </Form.Item>

          <div className="flex justify-end gap-2 pt-2">
            <Button onClick={() => { setMfaModalOpen(false); mfaCodeForm.resetFields() }} className="rounded-lg text-xs font-bold h-9">
              Cancel
            </Button>
            <Button type="primary" htmlType="submit" loading={verifyingMfa} className="rounded-lg text-xs font-bold h-9 bg-blue-600">
              Verify &amp; Enable
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  )
}
