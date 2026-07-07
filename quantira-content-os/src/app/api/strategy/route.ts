import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const strategies = await db.contentStrategy.findMany({
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(strategies)
  } catch (error) {
    console.error("GET /api/strategy error:", error)
    return NextResponse.json({ error: "Failed to fetch strategy items" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const strategy = await db.contentStrategy.create({
      data: {
        topic: data.topic,
        industry: data.industry,
        persona: data.persona,
        funnelStage: data.funnelStage,
        searchIntent: data.searchIntent,
        contentPillar: data.contentPillar,
        keyword: data.keyword,
        competitorRef: data.competitorRef,
        priority: data.priority || 'Normal',
        ideaStatus: data.ideaStatus || 'Brainstorm'
      }
    })
    return NextResponse.json(strategy)
  } catch (error) {
    console.error("POST /api/strategy error:", error)
    return NextResponse.json({ error: "Failed to create strategy item" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json()
    const strategy = await db.contentStrategy.update({
      where: { id: data.id },
      data: {
        topic: data.topic,
        industry: data.industry,
        persona: data.persona,
        funnelStage: data.funnelStage,
        searchIntent: data.searchIntent,
        contentPillar: data.contentPillar,
        keyword: data.keyword,
        competitorRef: data.competitorRef,
        priority: data.priority,
        ideaStatus: data.ideaStatus
      }
    })
    return NextResponse.json(strategy)
  } catch (error) {
    console.error("PUT /api/strategy error:", error)
    return NextResponse.json({ error: "Failed to update strategy item" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: "id parameter is required" }, { status: 400 })
    }

    await db.contentStrategy.delete({
      where: { id }
    })
    return NextResponse.json({ message: "Strategy idea deleted successfully" })
  } catch (error) {
    console.error("DELETE /api/strategy error:", error)
    return NextResponse.json({ error: "Failed to delete strategy item" }, { status: 500 })
  }
}

