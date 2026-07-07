import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const performance = await db.performanceTracker.findMany({
      include: {
        content: {
          select: {
            contentTitle: true,
            platform: true,
            clientId: true,
            funnelStage: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    })
    return NextResponse.json(performance)
  } catch (error) {
    console.error("GET /api/performance error:", error)
    return NextResponse.json({ error: "Failed to fetch performance data" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json()
    const updated = await db.performanceTracker.update({
      where: { id: data.id },
      data: {
        reach: parseInt(data.reach) || 0,
        impressions: parseInt(data.impressions) || 0,
        likes: parseInt(data.likes) || 0,
        comments: parseInt(data.comments) || 0,
        shares: parseInt(data.shares) || 0,
        saves: parseInt(data.saves) || 0,
        profileVisits: parseInt(data.profileVisits) || 0,
        linkClicks: parseInt(data.linkClicks) || 0,
        leadsGenerated: parseInt(data.leadsGenerated) || 0,
        revenueGenerated: parseFloat(data.revenueGenerated) || 0,
        engagementRate: parseFloat(data.engagementRate) || 0,
        contentScore: parseFloat(data.contentScore) || 0
      }
    })
    // Recalculate scorecard parameters based on the updated performance metrics
    const reachScore      = Math.min(10, Number((updated.reach / 1000).toFixed(1))) || 0
    const engagementScore = Math.min(10, Number((updated.engagementRate * 1.5).toFixed(1))) || 0
    const leadScore       = Math.min(10, Number((updated.leadsGenerated / 10).toFixed(1))) || 0
    const conversionScore = Math.min(10, Number((updated.revenueGenerated / 500).toFixed(1))) || 0
    const overallScore    = Number(((reachScore + engagementScore + leadScore + conversionScore) / 4).toFixed(1)) || 0

    await db.contentScorecard.upsert({
      where: { contentId: updated.contentId },
      update: {
        reachScore,
        engagementScore,
        leadScore,
        conversionScore,
        overallScore
      },
      create: {
        contentId: updated.contentId,
        reachScore,
        engagementScore,
        leadScore,
        conversionScore,
        overallScore
      }
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("PUT /api/performance error:", error)
    return NextResponse.json({ error: "Failed to update performance data" }, { status: 500 })
  }
}
