import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { redirect } from 'next/navigation'
import ClientDashboardView from './ClientDashboardView'

export const dynamic = 'force-dynamic'

export default async function ClientDashboardPage() {
  const session = await auth()
  
  if (!session || session.user.role !== 'CLIENT' || !session.user.clientName) {
    redirect('/unauthorized')
  }

  const clientName = session.user.clientName

  // Fetch all content entries for this client, including their performanceTracker stats
  const content = await db.contentMaster.findMany({
    where: { clientId: clientName },
    include: {
      performanceTracker: true
    },
    orderBy: {
      id: 'desc'
    }
  })

  // Calculations
  const planned = content.filter(c => c.status === 'Planned').length
  const published = content.filter(c => c.status === 'Published').length
  const totalReach = content.reduce((sum, c) => sum + (c.performanceTracker?.reach || 0), 0)
  const totalLeads = content.reduce((sum, c) => sum + (c.performanceTracker?.leadsGenerated || 0), 0)
  const totalRevenue = content.reduce((sum, c) => sum + (c.performanceTracker?.revenueGenerated || 0), 0)

  // Map to lightweight representation for transfer to client component
  const serializedContent = content.map(c => ({
    id: c.id,
    contentId: c.contentId,
    contentTitle: c.contentTitle,
    platform: c.platform,
    status: c.status,
    publishDate: c.publishDate ? c.publishDate.toISOString() : null
  }))

  const metrics = {
    planned,
    published,
    totalReach,
    totalLeads,
    totalRevenue
  }

  return (
    <ClientDashboardView 
      clientName={clientName} 
      metrics={metrics} 
      recentContent={serializedContent} 
    />
  )
}
