import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const data = await db.contentScorecard.findMany({
      include: {
        content: {
          select: {
            contentTitle: true,
            platform: true,
            clientId: true
          }
        }
      }
    })
    return NextResponse.json(data)
  } catch (error) {
    console.error("GET /api/scorecard error:", error)
    return NextResponse.json({ error: "Failed to fetch scorecard data" }, { status: 500 })
  }
}
