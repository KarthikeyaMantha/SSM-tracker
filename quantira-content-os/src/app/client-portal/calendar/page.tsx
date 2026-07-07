import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { redirect } from 'next/navigation'
import ClientCalendarView from './ClientCalendarView'

export const dynamic = 'force-dynamic'

export default async function ClientCalendarPage() {
  const session = await auth()
  
  if (!session || session.user.role !== 'CLIENT' || !session.user.clientName) {
    redirect('/unauthorized')
  }

  const clientName = session.user.clientName

  // Fetch all content entries for this client that have a publish date
  const content = await db.contentMaster.findMany({
    where: { 
      clientId: clientName,
      publishDate: { not: null }
    },
    orderBy: {
      publishDate: 'asc'
    }
  })

  const serializedContent = content.map(c => ({
    id: c.id,
    contentId: c.contentId,
    contentTitle: c.contentTitle,
    platform: c.platform,
    status: c.status,
    publishDate: c.publishDate ? c.publishDate.toISOString() : null
  }))

  return (
    <ClientCalendarView 
      clientName={clientName} 
      content={serializedContent} 
    />
  )
}
