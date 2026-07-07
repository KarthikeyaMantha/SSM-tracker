'use client'

import { useState, Suspense } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Form, Input, Button, Alert, Card, Typography, Spin } from 'antd'
import { Sparkles, Mail, Lock } from 'lucide-react'

const { Title, Text } = Typography

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const callbackUrl = searchParams.get('callbackUrl') || '/'

  const onFinish = async (values: any) => {
    setLoading(true)
    setError(null)
    try {
      const res = await signIn('credentials', {
        email: values.email,
        password: values.password,
        redirect: false
      })

      if (res?.error) {
        setError('Invalid email or password. Please try again.')
      } else {
        router.push(callbackUrl)
        router.refresh()
      }
    } catch (err: any) {
      setError('An unexpected error occurred. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {error && (
        <Alert
          message={error}
          type="error"
          showIcon
          className="mb-4 rounded-xl text-xs"
        />
      )}

      <Form
        name="login_form"
        layout="vertical"
        onFinish={onFinish}
        requiredMark={false}
      >
        <Form.Item
          label={<span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Email Address</span>}
          name="email"
          rules={[
            { required: true, message: 'Please enter your email!' },
            { type: 'email', message: 'Please enter a valid email!' }
          ]}
        >
          <Input 
            prefix={<Mail className="w-4 h-4 text-slate-400 mr-1" />} 
            placeholder="name@company.com" 
            size="large"
            className="rounded-xl border-slate-200 hover:border-blue-400 focus:border-blue-500"
          />
        </Form.Item>

        <Form.Item
          label={<span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Password</span>}
          name="password"
          rules={[{ required: true, message: 'Please enter your password!' }]}
        >
          <Input.Password
            prefix={<Lock className="w-4 h-4 text-slate-400 mr-1" />}
            placeholder="••••••••"
            size="large"
            className="rounded-xl border-slate-200 hover:border-blue-400 focus:border-blue-500"
          />
        </Form.Item>

        <Form.Item className="mt-6 mb-0">
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            block
            size="large"
            style={{ backgroundColor: '#1890ff', borderColor: '#1890ff' }}
            className="rounded-xl font-bold text-sm shadow-sm hover:brightness-105 h-11 transition-all border-none"
          >
            Sign In
          </Button>
        </Form.Item>
      </Form>
    </>
  )
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 font-['Inter',-apple-system,sans-serif] px-4">
      <Card className="w-full max-w-md shadow-xl rounded-3xl border border-slate-100 p-4">
        <div className="flex flex-col items-center mb-6">
          <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-md mb-3">
            <Sparkles className="w-6 h-6" />
          </div>
          <Title level={3} className="!mb-0 !font-extrabold tracking-tight">Welcome Back</Title>
          <Text type="secondary" className="text-xs">Sign in to your Quantira Content OS account</Text>
        </div>

        <Suspense fallback={<div className="flex justify-center p-6"><Spin size="large" /></div>}>
          <LoginForm />
        </Suspense>
      </Card>
    </div>
  )
}
