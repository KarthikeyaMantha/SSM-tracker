'use client'

import React from 'react'
import { ConfigProvider } from 'antd'
import { AntdRegistry } from '@ant-design/nextjs-registry'
import { ProfileProvider } from '@/context/ProfileContext'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AntdRegistry>
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: '#2563eb', // Modern premium vibrant blue
            colorSuccess: '#10b981', // Premium success green
            colorWarning: '#f59e0b', // Amber warning
            colorError: '#ef4444',   // Rose red error
            borderRadius: 12,        // Softer premium corners
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          },
          components: {
            Card: {
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
            },
            Table: {
              headerBg: '#f8fafc',
              headerColor: '#475569',
              borderRadius: 12,
            }
          }
        }}
      >
        <ProfileProvider>
          {children}
        </ProfileProvider>
      </ConfigProvider>
    </AntdRegistry>
  )
}
