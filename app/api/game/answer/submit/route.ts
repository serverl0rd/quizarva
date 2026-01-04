import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { prisma as db } from '@/lib/db/prisma'
import { redis, getGameState } from '@/lib/redis/kv'
import { notifyGameUpdate } from '@/lib/sse/broadcast'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { gameId, playerId, answer } = await req.json()

    if (!gameId || !playerId || !answer) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify the player is part of the game
    const player = await db.player.findUnique({
      where: { id: playerId },
      include: { game: true, user: true },
    })

    if (!player || player.gameId !== gameId) {
      return NextResponse.json({ error: 'Invalid player' }, { status: 400 })
    }

    if (player.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current game state
    const gameState = await getGameState(gameId)
    if (!gameState) {
      return NextResponse.json({ error: 'Game state not found' }, { status: 400 })
    }

    // Verify we're in a phase where answers can be submitted
    if (gameState.currentPhase !== 'buzz' && gameState.currentPhase !== 'safety') {
      return NextResponse.json({ error: 'Cannot submit answer in current phase' }, { status: 400 })
    }

    // Store the player's answer
    await redis.set(
      `game:${gameId}:player:${playerId}:answer`,
      JSON.stringify({
        answer,
        submittedAt: new Date().toISOString(),
        questionId: gameState.currentQuestion?.questionId,
      }),
      { ex: 300 } // Expire after 5 minutes
    )

    // Broadcast that an answer was submitted
    await notifyGameUpdate(gameId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Submit answer error:', error)
    return NextResponse.json(
      { error: 'Failed to submit answer' },
      { status: 500 }
    )
  }
}