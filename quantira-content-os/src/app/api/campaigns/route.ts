import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const campaigns = await db.campaign.findMany({
      include: {
        client: {
          select: {
            clientName: true
          }
        }
      },
      orderBy: {
        startDate: 'desc'
      }
    })
    return NextResponse.json(campaigns)
  } catch (error) {
    console.error("GET /api/campaigns error:", error)
    return NextResponse.json({ error: "Failed to fetch campaigns" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()

    // Auto-generate Campaign ID (e.g. CMP-001)
    const campaigns = await db.campaign.findMany({ select: { campaignId: true } })
    const ids = campaigns.map(c => {
      const match = c.campaignId.match(/\d+/)
      return match ? parseInt(match[0], 10) : 0
    })
    const maxId = ids.length > 0 ? Math.max(...ids) : 0
    const nextCampaignId = `CMP-${String(maxId + 1).padStart(3, '0')}`

    const campaign = await db.campaign.create({
      data: {
        campaignId: nextCampaignId,
        clientId: data.clientId,
        campaignName: data.campaignName,
        goal: data.goal || null,
        budget: parseFloat(data.budget) || 0,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        status: data.status || 'Planning'
      }
    })
    return NextResponse.json(campaign)
  } catch (error) {
    console.error("POST /api/campaigns error:", error)
    return NextResponse.json({ error: "Failed to create campaign" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json()
    const { campaignId, clientId, campaignName, goal, budget, startDate, endDate, status } = data

    if (!campaignId) {
      return NextResponse.json({ error: "campaignId is required for update" }, { status: 400 })
    }

    const updated = await db.campaign.update({
      where: { campaignId },
      data: {
        clientId,
        campaignName,
        goal: goal || null,
        budget: parseFloat(budget) || 0,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        status: status || 'Planning'
      }
    })
    return NextResponse.json(updated)
  } catch (error) {
    console.error("PUT /api/campaigns error:", error)
    return NextResponse.json({ error: "Failed to update campaign" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const campaignId = searchParams.get('campaignId')

    if (!campaignId) {
      return NextResponse.json({ error: "campaignId parameter is required" }, { status: 400 })
    }

    await db.campaign.delete({
      where: { campaignId }
    })
    return NextResponse.json({ message: "Campaign deleted successfully" })
  } catch (error: any) {
    console.error("DELETE /api/campaigns error:", error)
    if (error.code === 'P2003') {
      return NextResponse.json({ error: "Failed to delete campaign due to dependent records." }, { status: 400 })
    }
    return NextResponse.json({ error: "Failed to delete campaign." }, { status: 500 })
  }
}

