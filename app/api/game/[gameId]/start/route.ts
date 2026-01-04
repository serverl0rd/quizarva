import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'
import { redis } from '@/lib/redis/kv'
import { notifyPhaseChange } from '@/lib/sse/broadcast'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  req: NextRequest,
  { params }: { params: { gameId: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { gameId } = params

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Verify user is the host
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: {
        players: true,
      },
    })

    if (!game || game.hostId !== user.id) {
      return NextResponse.json(
        { error: 'Only the host can start the game' },
        { status: 403 }
      )
    }

    if (game.status !== 'WAITING') {
      return NextResponse.json(
        { error: 'Game has already started' },
        { status: 400 }
      )
    }

    if (game.players.length !== 3) {
      return NextResponse.json(
        { error: 'Game requires exactly 3 players' },
        { status: 400 }
      )
    }

    // Update game status
    await prisma.game.update({
      where: { id: gameId },
      data: {
        status: 'IN_PROGRESS',
        startedAt: new Date(),
        currentBoard: 1,
        currentSelector: null, // Host starts as selector
      },
    })

    // Initialize game state in Redis
    const gameStateKey = `game:${gameId}:state`
    await redis.hset(gameStateKey, {
      phase: 'selection',
      currentBoard: 1,
      startedAt: Date.now(),
      lastUpdated: Date.now(),
    })

    // Notify all clients
    await notifyPhaseChange(gameId, 'selection')

    return NextResponse.json({
      success: true,
      message: 'Game started successfully',
    })
  } catch (error) {
    console.error('Start game error:', error)
    return NextResponse.json(
      { error: 'Failed to start game' },
      { status: 500 }
    )
  }
}