import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const approvals = await db.approval.findMany({
      include: {
        content: { select: { contentTitle: true, platform: true, clientId: true, priority: true, publishDate: true } }
      },
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(approvals)
  } catch (error) {
    console.error("GET /api/approvals error:", error)
    return NextResponse.json({ error: "Failed to fetch approvals" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const approval = await db.approval.create({
      data: {
        contentId: data.contentId,
        submittedBy: data.submittedBy,
        reviewer: data.reviewer || null,
        approvalStatus: 'Pending',
        revisionRound: parseInt(data.revisionRound) || 1,
        feedback: data.feedback || null
      }
    })
    return NextResponse.json(approval)
  } catch (error) {
    console.error("POST /api/approvals error:", error)
    return NextResponse.json({ error: "Failed to create approval entry" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json()
    const { contentId, approvalId } = data

    if (!contentId && !approvalId) {
      return NextResponse.json({ error: "contentId or approvalId is required for update" }, { status: 400 })
    }

    const selector = approvalId 
      ? { approvalId: parseInt(approvalId) } 
      : { contentId }

    const updated = await db.approval.update({
      where: selector as any,
      data: {
        submittedBy: data.submittedBy !== undefined ? data.submittedBy : undefined,
        reviewer: data.reviewer !== undefined ? data.reviewer : undefined,
        approvalStatus: data.approvalStatus !== undefined ? data.approvalStatus : undefined,
        revisionRound: data.revisionRound !== undefined ? parseInt(data.revisionRound) : undefined,
        feedback: data.feedback !== undefined ? data.feedback : undefined,
        finalApprovalDate: data.approvalStatus === 'Approved' ? new Date() : (data.approvalStatus !== undefined ? null : undefined)
      }
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("PUT /api/approvals error:", error)
    return NextResponse.json({ error: "Failed to update approval entry" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const contentId = searchParams.get('contentId')
    const approvalId = searchParams.get('approvalId')

    if (!contentId && !approvalId) {
      return NextResponse.json({ error: "contentId or approvalId parameter is required" }, { status: 400 })
    }

    const selector = approvalId 
      ? { approvalId: parseInt(approvalId) } 
      : { contentId }

    await db.approval.delete({
      where: selector as any
    })
    return NextResponse.json({ message: "Approval record deleted successfully" })
  } catch (error: any) {
    console.error("DELETE /api/approvals error:", error)
    return NextResponse.json({ error: "Failed to delete approval record." }, { status: 500 })
  }
}

