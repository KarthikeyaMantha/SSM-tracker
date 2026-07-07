import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const assets = await db.asset.findMany({
      include: { content: { select: { contentTitle: true } } },
      orderBy: { uploadDate: 'desc' }
    })
    return NextResponse.json(assets)
  } catch (error) {
    console.error("GET /api/assets error:", error)
    return NextResponse.json({ error: "Failed to fetch assets" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const asset = await db.asset.create({
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
    if (data.canvaLink) updatePayload.canvaLink = data.canvaLink
    if (data.driveLink) updatePayload.driveLink = data.driveLink

    if (Object.keys(updatePayload).length > 0) {
      await db.contentMaster.update({
        where: { contentId: data.contentId },
        data: updatePayload
      })
    }

    return NextResponse.json(asset)
  } catch (error) {
    console.error("POST /api/assets error:", error)
    return NextResponse.json({ error: "Failed to create asset" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json()
    const { id } = data

    if (!id) {
      return NextResponse.json({ error: "id is required for update" }, { status: 400 })
    }

    const updated = await db.asset.update({
      where: { id },
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
    console.error("PUT /api/assets error:", error)
    return NextResponse.json({ error: "Failed to update asset" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: "id parameter is required" }, { status: 400 })
    }

    await db.asset.delete({
      where: { id }
    })
    return NextResponse.json({ message: "Asset deleted successfully" })
  } catch (error) {
    console.error("DELETE /api/assets error:", error)
    return NextResponse.json({ error: "Failed to delete asset" }, { status: 500 })
  }
}

