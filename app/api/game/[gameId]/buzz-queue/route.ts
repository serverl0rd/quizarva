import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  req: NextRequest,
  { params }: { params: { gameId: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { gameId } = params

    // Verify user is part of the game
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const game = await prisma.game.findUnique({
      where: { id: gameId },
      select: { hostId: true },
    })

    const player = await prisma.player.findFirst({
      where: {
        gameId,
        userId: user.id,
      },
    })

    if (!game || (game.hostId !== user.id && !player)) {
      return NextResponse.json(
        { error: 'Not authorized to view this game' },
        { status: 403 }
      )
    }

    // Get buzz queue from database
    const buzzQueue = await prisma.buzzQueue.findMany({
      where: { gameId },
      orderBy: { order: 'asc' },
      include: {
        player: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              }
            }
          }
        }
      }
    })

    // Transform for frontend
    const queueItems = buzzQueue.map(item => ({
      id: item.id,
      playerId: item.player.id,
      playerName: item.player.user.name || 'Unknown',
      position: item.order,
      isActive: item.isActive,
    }))

    return NextResponse.json(queueItems)
  } catch (error) {
    console.error('Get buzz queue error:', error)
    return NextResponse.json(
      { error: 'Failed to get buzz queue' },
      { status: 500 }
    )
  }
}