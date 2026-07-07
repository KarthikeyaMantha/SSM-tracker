import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await db.contentStrategy.delete({
      where: { id: params.id }
    })
    return NextResponse.json({ message: "Strategy idea deleted successfully" })
  } catch (error) {
    console.error(`DELETE /api/strategy/${params.id} error:`, error)
    return NextResponse.json({ error: "Failed to delete strategy item" }, { status: 500 })
  }
}
