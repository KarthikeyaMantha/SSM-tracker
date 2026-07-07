import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id
    const data = await request.json()

    // Handle lookup by either contentId (string) or approvalId (numeric)
    const isNumeric = /^\d+$/.test(id)
    const selector = isNumeric 
      ? { approvalId: parseInt(id) } 
      : { contentId: id }

    const updated = await db.approval.update({
      where: selector as any,
      data: {
        approvalStatus: data.approvalStatus,
        feedback: data.feedback,
        finalApprovalDate: data.approvalStatus === 'Approved' ? new Date() : null
      }
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error(`PUT /api/approvals/${params.id} error:`, error)
    return NextResponse.json({ error: "Failed to update approval entry" }, { status: 500 })
  }
}
