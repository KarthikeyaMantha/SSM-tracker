import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id
    const data = await request.json()

    const updated = await db.campaign.update({
      where: { campaignId: id },
      data: {
        clientId: data.clientId,
        campaignName: data.campaignName,
        goal: data.goal || null,
        budget: parseFloat(data.budget) || 0,
        status: data.status || 'Planning'
      }
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error(`PATCH /api/campaigns/${params.id} error:`, error)
    return NextResponse.json({ error: "Failed to update campaign" }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id
    await db.campaign.delete({
      where: { campaignId: id }
    })
    return NextResponse.json({ message: "Campaign deleted successfully" })
  } catch (error) {
    console.error(`DELETE /api/campaigns/${params.id} error:`, error)
    return NextResponse.json({ error: "Failed to delete campaign" }, { status: 500 })
  }
}
