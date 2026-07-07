import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Sidebar from '@/components/Sidebar'
import Providers from './Providers'
import AuthProvider from '@/components/AuthProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Quantira Content OS',
  description: 'Enterprise Content Operating System',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <Providers>
            <div className="flex h-screen bg-[#f0f2f5] overflow-hidden">
              {/* Desktop sidebar — hidden on mobile, visible xl+ */}
              <div className="hidden xl:flex shrink-0">
                <Sidebar />
              </div>
              <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {children}
              </div>
            </div>
          </Providers>
        </AuthProvider>
      </body>
    </html>
  )
}

