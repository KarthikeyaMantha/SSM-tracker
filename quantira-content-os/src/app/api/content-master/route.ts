import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const content = await db.contentMaster.findMany({
      include: {
        client: { select: { clientName: true } },
        campaign: { select: { campaignName: true } },
        contentProduction: { select: { writerStatus: true, designStatus: true, editingStatus: true } },
        performanceTracker: { select: { reach: true, impressions: true, profileVisits: true, leadsGenerated: true, revenueGenerated: true, engagementRate: true } },
        contentScorecard: { select: { reachScore: true, engagementScore: true, leadScore: true, conversionScore: true, overallScore: true } }
      },
      orderBy: { publishDate: 'asc' }
    })
    return NextResponse.json(content)
  } catch (error) {
    console.error("GET /api/content-master error:", error)
    return NextResponse.json({ error: "Failed to fetch content" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()

    // Auto-generate Content ID (e.g. CNT-0001)
    const contents = await db.contentMaster.findMany({ select: { contentId: true } })
    const ids = contents.map(c => {
      const match = c.contentId.match(/\d+/)
      return match ? parseInt(match[0], 10) : 0
    })
    const maxId = ids.length > 0 ? Math.max(...ids) : 0
    const nextContentId = `CNT-${String(maxId + 1).padStart(4, '0')}`

    const content = await db.contentMaster.create({
      data: {
        contentId: nextContentId,
        campaignId: data.campaignId || null,
        clientId: data.clientId || null,
        contentTitle: data.contentTitle,
        topic: data.topic || null,
        contentPillar: data.contentPillar || null,
        funnelStage: data.funnelStage || null,
        platform: data.platform,
        contentFormat: data.contentFormat || null,
        priority: data.priority || 'Normal',
        owner: data.owner || null,
        publishDate: data.publishDate ? new Date(data.publishDate) : null,
        publishTime: data.publishTime || null,
        status: data.status || 'Draft',
        daysRemaining: parseInt(data.daysRemaining) || 0,
        healthStatus: data.healthStatus || 'On Track',
        month: data.month || null,
        week: parseInt(data.week) || null,
        quarter: data.quarter || null,
        caption: data.caption || null,
        hashtags: data.hashtags || null,
        canvaLink: data.canvaLink || null,
        driveLink: data.driveLink || null
      }
    })

    // 1. Auto-create Production Record
    await db.contentProduction.create({
      data: { contentId: content.contentId }
    })

    // 2. Auto-create Approval Record
    await db.approval.create({
      data: { 
        contentId: content.contentId, 
        submittedBy: data.owner || 'System', 
        reviewer: 'Manager', 
        approvalStatus: 'Pending' 
      }
    })

    // 3. Auto-create Performance Tracker Record
    await db.performanceTracker.create({
      data: { contentId: content.contentId }
    })

    // 4. Auto-create Content Scorecard Record
    await db.contentScorecard.create({
      data: { contentId: content.contentId }
    })

    return NextResponse.json(content)
  } catch (error) {
    console.error("POST /api/content-master error:", error)
    return NextResponse.json({ error: "Failed to create content" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json()
    const { contentId } = data

    if (!contentId) {
      return NextResponse.json({ error: "contentId is required for update" }, { status: 400 })
    }

    const updateData: any = {}
    if (data.status !== undefined) updateData.status = data.status
    if (data.healthStatus !== undefined) updateData.healthStatus = data.healthStatus
    if (data.priority !== undefined) updateData.priority = data.priority
    if (data.publishDate !== undefined) {
      updateData.publishDate = data.publishDate ? new Date(data.publishDate) : null
    }
    if (data.publishTime !== undefined) updateData.publishTime = data.publishTime
    if (data.caption !== undefined) updateData.caption = data.caption
    if (data.hashtags !== undefined) updateData.hashtags = data.hashtags
    if (data.canvaLink !== undefined) updateData.canvaLink = data.canvaLink
    if (data.driveLink !== undefined) updateData.driveLink = data.driveLink
    if (data.contentTitle !== undefined) updateData.contentTitle = data.contentTitle
    if (data.clientId !== undefined) updateData.clientId = data.clientId || null
    if (data.campaignId !== undefined) updateData.campaignId = data.campaignId || null
    if (data.targetPersona !== undefined) updateData.targetPersona = data.targetPersona || null
    if (data.painPoint !== undefined) updateData.painPoint = data.painPoint || null
    if (data.contentPillar !== undefined) updateData.contentPillar = data.contentPillar || null

    const updated = await db.contentMaster.update({
      where: { contentId },
      data: updateData,
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("PUT /api/content-master error:", error)
    return NextResponse.json({ error: "Failed to update content master item" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const contentId = searchParams.get('contentId')

    if (!contentId) {
      return NextResponse.json({ error: "contentId parameter is required" }, { status: 400 })
    }

    await db.contentMaster.delete({
      where: { contentId }
    })
    return NextResponse.json({ message: "Content deleted successfully" })
  } catch (error: any) {
    console.error("DELETE /api/content-master error:", error)
    return NextResponse.json({ error: "Failed to delete content master item." }, { status: 500 })
  }
}

