import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { prisma as db } from '@/lib/db/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: { gameId: string } }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify the requester is the host of the game
    const game = await db.game.findUnique({
      where: { id: params.gameId },
      select: { hostId: true },
    })

    if (!game || game.hostId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized - host only' }, { status: 401 })
    }

    // Fetch audit logs
    const auditLogs = await db.auditLog.findMany({
      where: { gameId: params.gameId },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Transform the data
    const logs = auditLogs.map(log => ({
      id: log.id,
      gameId: log.gameId,
      userId: log.userId,
      boardNumber: log.boardNumber,
      category: log.category,
      questionId: log.questionId,
      pointDelta: log.pointDelta,
      reason: log.reason,
      createdAt: log.createdAt.toISOString(),
      createdBy: log.user?.name || log.user?.email || 'System',
    }))

    return NextResponse.json(logs)
  } catch (error) {
    console.error('Get audit logs error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch audit logs' },
      { status: 500 }
    )
  }
}