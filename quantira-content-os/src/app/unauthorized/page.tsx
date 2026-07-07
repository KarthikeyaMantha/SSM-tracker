'use client'

import { Button, Result } from 'antd'
import { useRouter } from 'next/navigation'
import { ShieldAlert } from 'lucide-react'

export default function UnauthorizedPage() {
  const router = useRouter()

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 font-['Inter',-apple-system,sans-serif]">
      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl max-w-md w-full text-center">
        <Result
          status="403"
          icon={<ShieldAlert className="w-16 h-16 text-rose-500 mx-auto mb-4 animate-bounce" />}
          title={<span className="text-xl font-extrabold text-slate-800 tracking-tight">Access Denied</span>}
          subTitle={<span className="text-slate-500 text-xs">Sorry, you do not have sufficient permissions to access this page. Please contact your manager if you believe this is an error.</span>}
          extra={
            <Button 
              type="primary" 
              onClick={() => {
                router.push('/')
                router.refresh()
              }}
              className="bg-blue-600 hover:bg-blue-700 rounded-xl h-10 px-6 font-bold text-xs border-none shadow-sm flex items-center justify-center mx-auto"
            >
              Back to Home
            </Button>
          }
        />
      </div>
    </div>
  )
}
