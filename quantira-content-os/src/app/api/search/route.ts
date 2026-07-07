import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''

    if (!query.trim()) {
      return NextResponse.json([])
    }

    const [clients, campaigns, contentItems] = await Promise.all([
      db.client.findMany({
        where: {
          clientName: { contains: query }
        },
        take: 5
      }),
      db.campaign.findMany({
        where: {
          campaignName: { contains: query }
        },
        take: 5
      }),
      db.contentMaster.findMany({
        where: {
          contentTitle: { contains: query }
        },
        take: 5
      })
    ])

    const results: any[] = []

    clients.forEach(c => {
      results.push({
        type: 'Client',
        title: c.clientName,
        subtitle: c.industry || 'No Industry Specified',
        url: '/clients'
      })
    })

    campaigns.forEach(cmp => {
      results.push({
        type: 'Campaign',
        title: cmp.campaignName,
        subtitle: `Client: ${cmp.clientId} • Budget: ₹${cmp.budget?.toLocaleString()}`,
        url: '/campaigns'
      })
    })

    contentItems.forEach(cnt => {
      results.push({
        type: 'Content',
        title: cnt.contentTitle,
        subtitle: `${cnt.platform} ${cnt.contentFormat || ''} (${cnt.status})`,
        url: '/content-master'
      })
    })

    return NextResponse.json(results)
  } catch (error) {
    console.error("GET /api/search error:", error)
    return NextResponse.json({ error: "Failed to perform search query" }, { status: 500 })
  }
}
