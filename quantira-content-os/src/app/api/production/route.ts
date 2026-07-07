import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const production = await db.contentProduction.findMany({
      include: {
        content: { select: { contentTitle: true, platform: true, status: true } }
      },
      orderBy: { lastUpdated: 'desc' }
    })
    return NextResponse.json(production)
  } catch (error) {
    console.error("GET /api/production error:", error)
    return NextResponse.json({ error: "Failed to fetch production content" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json()
    const { contentId, productionId } = data

    if (!contentId && !productionId) {
      return NextResponse.json({ error: "contentId or productionId is required for update" }, { status: 400 })
    }

    const selector = productionId 
      ? { productionId: parseInt(productionId) } 
      : { contentId }

    const updated = await db.contentProduction.update({
      where: selector as any,
      data: {
        copywriter: data.copywriter !== undefined ? data.copywriter : undefined,
        writerStatus: data.writerStatus !== undefined ? data.writerStatus : undefined,
        designer: data.designer !== undefined ? data.designer : undefined,
        designStatus: data.designStatus !== undefined ? data.designStatus : undefined,
        videoEditor: data.videoEditor !== undefined ? data.videoEditor : undefined,
        editingStatus: data.editingStatus !== undefined ? data.editingStatus : undefined,
        revisionCount: data.revisionCount !== undefined ? parseInt(data.revisionCount) : undefined,
      }
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("PUT /api/production error:", error)
    return NextResponse.json({ error: "Failed to update production record" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const contentId = searchParams.get('contentId')
    const productionId = searchParams.get('productionId')

    if (!contentId && !productionId) {
      return NextResponse.json({ error: "contentId or productionId parameter is required" }, { status: 400 })
    }

    const selector = productionId 
      ? { productionId: parseInt(productionId) } 
      : { contentId }

    await db.contentProduction.delete({
      where: selector as any
    })
    return NextResponse.json({ message: "Production record deleted successfully" })
  } catch (error: any) {
    console.error("DELETE /api/production error:", error)
    return NextResponse.json({ error: "Failed to delete production record." }, { status: 500 })
  }
}

