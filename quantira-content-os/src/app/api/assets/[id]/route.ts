import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json()
    const updated = await db.asset.update({
      where: { id: params.id },
      data: {
        contentId: data.contentId,
        assetType: data.assetType,
        canvaLink: data.canvaLink,
        driveLink: data.driveLink,
        version: parseInt(data.version) || 1
      }
    })

    // Propagate links back to ContentMaster
    const updatePayload: any = {}
    if (data.canvaLink !== undefined) updatePayload.canvaLink = data.canvaLink
    if (data.driveLink !== undefined) updatePayload.driveLink = data.driveLink

    if (Object.keys(updatePayload).length > 0 && data.contentId) {
      await db.contentMaster.update({
        where: { contentId: data.contentId },
        data: updatePayload
      })
    }

    return NextResponse.json(updated)
  } catch (error) {
    console.error(`PUT /api/assets/${params.id} error:`, error)
    return NextResponse.json({ error: "Failed to update asset" }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await db.asset.delete({
      where: { id: params.id }
    })
    return NextResponse.json({ message: "Asset deleted successfully" })
  } catch (error) {
    console.error(`DELETE /api/assets/${params.id} error:`, error)
    return NextResponse.json({ error: "Failed to delete asset" }, { status: 500 })
  }
}
