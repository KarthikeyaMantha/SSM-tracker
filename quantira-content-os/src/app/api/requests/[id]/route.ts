import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    const data = await request.json()

    // Build dynamic update values
    const updateData: any = {}
    if (data.status !== undefined) updateData.status = data.status
    if (data.requestedBy !== undefined) updateData.requestedBy = data.requestedBy
    if (data.client !== undefined) updateData.client = data.client
    if (data.platform !== undefined) updateData.platform = data.platform
    if (data.contentType !== undefined) updateData.contentType = data.contentType
    if (data.priority !== undefined) updateData.priority = data.priority
    if (data.objective !== undefined) updateData.objective = data.objective
    if (data.brief !== undefined) updateData.brief = data.brief
    if (data.assignedTo !== undefined) updateData.assignedTo = data.assignedTo
    if (data.dueDate !== undefined) updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null

    const updated = await db.contentRequest.update({
      where: { requestId: id },
      data: updateData
    })

    // "Approve & Scaffold" — when a request is approved, auto-create
    // a ContentMaster draft + Production + Approval entry
    if (data.status === 'Approved') {
      const req = await db.contentRequest.findUnique({
        where: { requestId: id }
      })

      if (req) {
        // Auto-generate Content ID (e.g. CNT-0001) sequential
        const contents = await db.contentMaster.findMany({ select: { contentId: true } })
        const ids = contents.map(c => {
          const match = c.contentId.match(/\d+/)
          return match ? parseInt(match[0], 10) : 0
        })
        const maxId = ids.length > 0 ? Math.max(...ids) : 0
        const nextContentId = `CNT-${String(maxId + 1).padStart(4, '0')}`

        // Create ContentMaster draft
        await db.contentMaster.create({
          data: {
            contentId: nextContentId,
            clientId: req.client,
            contentTitle: req.requestTitle || req.contentType || 'New Request',
            topic: req.description || null,
            platform: req.platform || 'TBD',
            status: 'Draft',
            owner: req.requestedBy || null,
            healthStatus: 'On Track',
            priority: req.priority || 'Normal'
          }
        })

        // Auto-create Production Record
        await db.contentProduction.create({
          data: { contentId: nextContentId }
        })

        // Auto-create Approval Record
        await db.approval.create({
          data: {
            contentId: nextContentId,
            submittedBy: req.requestedBy || 'System',
            reviewer: 'Manager',
            approvalStatus: 'Pending'
          }
        })

        // Auto-create Performance Tracker Record
        await db.performanceTracker.create({
          data: { contentId: nextContentId }
        })

        // Auto-create Content Scorecard Record
        await db.contentScorecard.create({
          data: { contentId: nextContentId }
        })
      }
    }

    return NextResponse.json(updated)
  } catch (error) {
    console.error(`PUT /api/requests/${params.id} error:`, error)
    return NextResponse.json({ error: "Failed to update request" }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    await db.contentRequest.delete({
      where: { requestId: id }
    })
    return NextResponse.json({ message: "Request deleted successfully" })
  } catch (error) {
    console.error(`DELETE /api/requests/${params.id} error:`, error)
    return NextResponse.json({ error: "Failed to delete request" }, { status: 500 })
  }
}
// Touched to reload diagnostics

