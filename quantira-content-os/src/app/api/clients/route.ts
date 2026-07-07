import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { auth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userRole = session.user.role

    let clients = await db.client.findMany({
      orderBy: {
        clientName: 'asc'
      }
    })

    if (userRole === 'COPYWRITER' || userRole === 'DESIGNER') {
      clients = clients.map(client => {
        const clientCopy = { ...client }
        delete (clientCopy as any).monthlyRetainer
        return clientCopy
      })
    }

    return NextResponse.json(clients)
  } catch (error) {
    console.error("GET /api/clients error:", error)
    return NextResponse.json({ error: "Failed to fetch clients" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'ACCOUNT_MANAGER')) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    const data = await request.json()

    // Auto-generate Client ID (e.g. CL-001)
    const clients = await db.client.findMany({ select: { clientId: true } })
    const ids = clients.map(c => {
      const match = c.clientId?.match(/\d+/)
      return match ? parseInt(match[0], 10) : 0
    })
    const maxId = ids.length > 0 ? Math.max(...ids) : 0
    const nextClientId = `CL-${String(maxId + 1).padStart(3, '0')}`

    const client = await db.client.create({
      data: {
        clientId: nextClientId,
        clientName: data.clientName,
        industry: data.industry || null,
        accountManager: data.accountManager || null,
        monthlyRetainer: parseFloat(data.monthlyRetainer) || 0,
        startDate: data.startDate ? new Date(data.startDate) : null,
        status: data.status || 'Active'
      }
    })
    return NextResponse.json(client)
  } catch (error) {
    console.error("POST /api/clients error:", error)
    return NextResponse.json({ error: "Failed to create client" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth()
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'ACCOUNT_MANAGER')) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    const data = await request.json()
    const { clientId, clientName, industry, accountManager, monthlyRetainer, startDate, status } = data

    if (!clientId && !clientName) {
      return NextResponse.json({ error: "clientId or clientName is required for update" }, { status: 400 })
    }

    const updated = await db.client.update({
      where: clientId ? { clientId } : { clientName },
      data: {
        clientName,
        industry: industry || null,
        accountManager: accountManager || null,
        monthlyRetainer: parseFloat(monthlyRetainer) || 0,
        startDate: startDate ? new Date(startDate) : null,
        status: status || 'Active'
      }
    })
    return NextResponse.json(updated)
  } catch (error) {
    console.error("PUT /api/clients error:", error)
    return NextResponse.json({ error: "Failed to update client" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth()
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'ACCOUNT_MANAGER')) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    const { searchParams } = new URL(request.url)
    const clientName = searchParams.get('clientName')

    if (!clientName) {
      return NextResponse.json({ error: "clientName parameter is required" }, { status: 400 })
    }

    await db.client.delete({
      where: { clientName }
    })
    return NextResponse.json({ message: "Client deleted successfully" })
  } catch (error: any) {
    console.error("DELETE /api/clients error:", error)
    // Return a specific error message if there's a constraint / dependency issue
    if (error.code === 'P2003') {
      return NextResponse.json({ error: "Failed to delete client due to existing dependent campaigns or records." }, { status: 400 })
    }
    return NextResponse.json({ error: "Failed to delete client. Make sure all dependent records are deleted first." }, { status: 500 })
  }
}

