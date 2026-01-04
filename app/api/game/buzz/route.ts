import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'
import { redis, getGameState, updateGameState, attemptBuzz } from '@/lib/redis/kv'
import { notifyBuzzEvent } from '@/lib/sse/broadcast'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const buzzSchema = z.object({
  gameId: z.string(),
})

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body = await req.json()
    const { gameId } = buzzSchema.parse(body)

    // Check if player is in the game
    const player = await prisma.player.findFirst({
      where: {
        gameId,
        userId: user.id,
      },
    })

    if (!player) {
      return NextResponse.json(
        { error: 'You are not in this game' },
        { status: 403 }
      )
    }

    // Get current game state from Redis
    const gameState = await getGameState(gameId)

    if (!gameState || (gameState.currentPhase !== 'buzz' && gameState.currentPhase !== 'tiebreaker')) {
      return NextResponse.json(
        { error: 'Cannot buzz at this time' },
        { status: 400 }
      )
    }

    // Check if question is already locked (someone already buzzed)
    const buzzLockKey = `game:${gameId}:buzzLock`
    const isLocked = await redis.get(buzzLockKey)

    if (isLocked) {
      // Add to buzz queue instead
      const buzzQueueKey = `game:${gameId}:buzzQueue`
      const timestamp = Date.now()
      
      // Add to Redis sorted set (score is timestamp for ordering)
      await redis.zadd(buzzQueueKey, {
        score: timestamp,
        member: player.id,
      })

      // Also add to PostgreSQL for persistence
      const position = await prisma.buzzQueue.count({
        where: { gameId },
      })

      await prisma.buzzQueue.create({
        data: {
          gameId,
          playerId: player.id,
          order: position + 1,
          buzzedAt: new Date(timestamp),
          questionId: gameState.currentQuestion?.questionId || '',
        },
      })

      return NextResponse.json({
        success: true,
        queued: true,
        position: position + 1,
      })
    }

    // First buzzer - lock the question
    const lockAcquired = await redis.set(buzzLockKey, player.id, {
      nx: true, // Only set if not exists
      ex: 30, // Expire after 30 seconds
    })

    if (!lockAcquired) {
      // Race condition - someone else just buzzed
      return NextResponse.json(
        { error: 'Another player buzzed first' },
        { status: 409 }
      )
    }

    // Update game state
    await updateGameState(gameId, {
      buzzState: {
        locked: true,
        activePlayer: player.id,
        queue: [],
        startTime: Date.now(),
      }
    })

    // Record buzz in database
    await prisma.buzzQueue.create({
      data: {
        gameId,
        playerId: player.id,
        order: 1,
        buzzedAt: new Date(),
        questionId: gameState.currentQuestion?.questionId || '',
        isActive: true,
      },
    })

    // During tiebreaker, check if player is eligible
    if (gameState.currentPhase === 'tiebreaker') {
      // For now, allow all players in tiebreaker
      const tiedPlayers: string[] = []
      if (!tiedPlayers.includes(player.id)) {
        // Release the lock
        await redis.del(buzzLockKey)
        return NextResponse.json(
          { error: 'Only tied players can buzz during tiebreaker' },
          { status: 403 }
        )
      }
    }

    // Notify all clients via SSE
    await notifyBuzzEvent(gameId, player.id)

    return NextResponse.json({
      success: true,
      firstBuzz: true,
      timestamp: Date.now(),
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      )
    }
    console.error('Buzz error:', error)
    return NextResponse.json(
      { error: 'Failed to process buzz' },
      { status: 500 }
    )
  }
}