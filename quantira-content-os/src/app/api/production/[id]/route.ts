import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id
    const data = await request.json()

    // Handle lookup by either contentId (string) or productionId (numeric)
    const isNumeric = /^\d+$/.test(id)
    const selector = isNumeric 
      ? { productionId: parseInt(id) } 
      : { contentId: id }

    const updated = await db.contentProduction.update({
      where: selector as any,
      data: {
        copywriter: data.copywriter,
        writerStatus: data.writerStatus,
        designer: data.designer,
        designStatus: data.designStatus,
        videoEditor: data.videoEditor,
        editingStatus: data.editingStatus,
        revisionCount: parseInt(data.revisionCount) || 0,
      }
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error(`PUT /api/production/${params.id} error:`, error)
    return NextResponse.json({ error: "Failed to update production record" }, { status: 500 })
  }
}
