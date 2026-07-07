import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id
    const data = await request.json()

    const updated = await db.client.update({
      where: { clientId: id },
      data: {
        clientName: data.clientName,
        industry: data.industry || null,
        accountManager: data.accountManager || null,
        monthlyRetainer: parseFloat(data.monthlyRetainer) || 0,
        status: data.status || 'Active'
      }
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error(`PATCH /api/clients/${params.id} error:`, error)
    return NextResponse.json({ error: "Failed to update client" }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id
    await db.client.delete({
      where: { clientId: id }
    })
    return NextResponse.json({ message: "Client deleted successfully" })
  } catch (error) {
    console.error(`DELETE /api/clients/${params.id} error:`, error)
    return NextResponse.json({ error: "Failed to delete client" }, { status: 500 })
  }
}
