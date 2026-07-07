import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { auth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // 1. Calculate active monthly retainer sum
    const clients = await db.client.findMany({
      where: { status: 'Active' },
      select: { monthlyRetainer: true }
    })
    const totalAccountValue = clients.reduce((sum, c) => sum + (c.monthlyRetainer || 0), 0)

    // 2. Calculate campaign budget sum
    const campaigns = await db.campaign.findMany({
      where: { status: 'Active' },
      select: { budget: true }
    })
    const expectedRevenue = campaigns.reduce((sum, c) => sum + (c.budget || 0), 0)

    // 3. Count active campaigns
    const activeCampaignsCount = await db.campaign.count({
      where: { status: 'Active' }
    })

    // 4. Count active queue items (not published)
    const activeContentCount = await db.contentMaster.count({
      where: { NOT: { status: 'Published' } }
    })

    // 5. Get recent approvals
    const approvalsList = await db.approval.findMany({
      take: 3,
      orderBy: { lastUpdated: 'desc' },
      include: {
        content: {
          select: {
            contentTitle: true,
            campaign: {
              select: {
                campaignName: true
              }
            }
          }
        }
      }
    })
    const recentApprovals = approvalsList.map(a => ({
      contentTitle: a.content.contentTitle,
      campaign: a.content.campaign?.campaignName || 'General',
      submittedBy: a.submittedBy || 'System',
      status: a.approvalStatus,
      badgeStatus: a.approvalStatus === 'Approved' ? 'success' : a.approvalStatus === 'Revision' ? 'error' : 'warning'
    }))

    // 6. Get campaigns progress
    const campaignsList = await db.campaign.findMany({
      take: 3,
      include: {
        contentMaster: { select: { status: true } }
      },
      orderBy: { startDate: 'desc' }
    })
    const campaignProgress = campaignsList.map(c => {
      const total = c.contentMaster.length
      const published = c.contentMaster.filter(item => item.status === 'Published').length
      const percent = total > 0 ? Math.round((published / total) * 100) : 0
      return {
        name: c.campaignName,
        client: c.clientId,
        budget: `₹${c.budget?.toLocaleString() || 0} budget`,
        percent,
        strokeColor: percent > 60 ? '#52c41a' : percent > 30 ? '#1890ff' : '#fa8c16'
      }
    })

    // 7. Build synthetic monthly trend (use real retainer as base for last 6 months)
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
    const base = totalAccountValue || 50000
    const trendData = months.map((month, i) => ({
      month,
      revenue: Math.round(base * (0.6 + i * 0.07 + Math.random() * 0.08)),
      leads: Math.round(8 + i * 2 + Math.random() * 5)
    }))

    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userRole = session.user.role

    const responseData: any = {
      totalAccountValue: `₹${totalAccountValue.toLocaleString()}`,
      expectedRevenue: `₹${expectedRevenue.toLocaleString()}`,
      activeCampaigns: `${activeCampaignsCount} Active`,
      activeContentItems: `${activeContentCount} Queue`,
      activeCampaignsCount,
      activeContentCount,
      totalAccountValueRaw: totalAccountValue,
      expectedRevenueRaw: expectedRevenue,
      recentApprovals,
      campaignProgress,
      trendData
    }

    if (userRole === 'COPYWRITER' || userRole === 'DESIGNER') {
      delete responseData.totalAccountValue
      delete responseData.totalAccountValueRaw
      delete responseData.expectedRevenue
      delete responseData.expectedRevenueRaw

      if (responseData.campaignProgress) {
        responseData.campaignProgress = responseData.campaignProgress.map((item: any) => {
          const itemCopy = { ...item }
          delete itemCopy.budget
          return itemCopy
        })
      }

      if (responseData.trendData) {
        responseData.trendData = responseData.trendData.map((item: any) => {
          const itemCopy = { ...item }
          delete itemCopy.revenue
          return itemCopy
        })
      }
    }

    return NextResponse.json(responseData)
  } catch (error) {
    console.error("GET /api/dashboard error:", error)
    return NextResponse.json({ error: "Failed to load dashboard metrics" }, { status: 500 })
  }
}
