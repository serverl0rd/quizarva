import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'
import { redis } from '@/lib/redis/kv'
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

    // Get game state from Redis
    const gameStateKey = `game:${gameId}:state`
    const gameState = await redis.hgetall(gameStateKey)

    if (!gameState || Object.keys(gameState).length === 0) {
      return NextResponse.json({
        phase: 'waiting',
        timestamp: Date.now(),
      })
    }

    return NextResponse.json(gameState)
  } catch (error) {
    console.error('Get game state error:', error)
    return NextResponse.json(
      { error: 'Failed to get game state' },
      { status: 500 }
    )
  }
}