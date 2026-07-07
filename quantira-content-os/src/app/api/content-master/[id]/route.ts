import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id
    const data = await request.json()

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

    const updated = await db.contentMaster.update({
      where: { contentId: id },
      data: updateData,
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error(`PATCH /api/content-master/${params.id} error:`, error)
    return NextResponse.json({ error: "Failed to update content item" }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id
    await db.contentMaster.delete({
      where: { contentId: id },
    })
    return NextResponse.json({ message: "Content deleted successfully" })
  } catch (error) {
    console.error(`DELETE /api/content-master/${params.id} error:`, error)
    return NextResponse.json({ error: "Failed to delete content item" }, { status: 500 })
  }
}
