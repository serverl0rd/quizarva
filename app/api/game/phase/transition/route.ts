import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'
import { redis, getGameState, updateGameState } from '@/lib/redis/kv'
import { notifyPhaseChange } from '@/lib/sse/broadcast'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const phaseTransitionSchema = z.object({
  gameId: z.string(),
  toPhase: z.enum(['select', 'question', 'buzz', 'safety', 'answer', 'reveal', 'score']),
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
    const { gameId, toPhase } = phaseTransitionSchema.parse(body)

    // Verify user is the host
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      select: { 
        hostId: true,
        status: true,
        currentSelector: true,
      },
    })

    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 })
    }

    // Only host can control safety slide transitions
    if (game.hostId !== user.id) {
      return NextResponse.json(
        { error: 'Only the host can control phase transitions' },
        { status: 403 }
      )
    }

    if (game.status !== 'IN_PROGRESS') {
      return NextResponse.json(
        { error: 'Game is not in progress' },
        { status: 400 }
      )
    }

    // Get current game state
    const gameState = await getGameState(gameId)
    const currentPhase = gameState?.currentPhase || 'select'

    // Validate phase transitions
    const validTransitions: Record<string, string[]> = {
      select: ['question'], // After selecting a question
      question: ['buzz'], // After displaying question
      buzz: ['safety'], // After someone buzzes and answer is evaluated
      safety: ['answer'], // Host continues from safety slide
      answer: ['reveal'], // After showing answer
      reveal: ['select'], // After reveal, back to selection
    }

    const allowedTransitions = validTransitions[currentPhase] || []
    
    // Special case: Allow transition to selection from any phase (for skips/resets)
    if (toPhase === 'select' || allowedTransitions.includes(toPhase)) {
      // Valid transition
    } else {
      return NextResponse.json(
        { error: `Invalid phase transition from ${currentPhase} to ${toPhase}` },
        { status: 400 }
      )
    }

    // Special handling for different phase transitions
    switch (toPhase) {
      case 'buzz':
        // Enable buzzing when transitioning from question to buzzing
        await updateGameState(gameId, {
          currentPhase: 'buzz',
        })
        break

      case 'select':
        // Clear current question when going back to selection
        await updateGameState(gameId, {
          currentPhase: 'select',
          currentQuestion: undefined,
        })
        
        // Clear any buzz state
        const buzzLockKey = `game:${gameId}:buzzLock`
        const buzzQueueKey = `game:${gameId}:buzzQueue`
        await redis.del(buzzLockKey)
        await redis.del(buzzQueueKey)
        
        // Clear buzz queue in database
        await prisma.buzzQueue.deleteMany({
          where: { gameId },
        })
        break

      case 'answer':
        // When transitioning to answer phase, mark that answer is being shown
        await updateGameState(gameId, {
          currentPhase: 'answer',
        })
        break

      default:
        // Simple phase update for other transitions
        await updateGameState(gameId, {
          currentPhase: toPhase as any,
        })
    }

    // Check for game completion
    if (toPhase === 'select') {
      // Check if all questions have been asked
      const remainingQuestions = await prisma.question.count({
        where: {
          category: {
            board: {
              gameId,
            },
          },
          isAnswered: false,
        },
      })

      if (remainingQuestions === 0) {
        // All questions asked - check for ties and handle game end
        await handleGameEnd(gameId)
      }
    }

    // Notify all clients
    await notifyPhaseChange(gameId, toPhase)

    return NextResponse.json({
      success: true,
      fromPhase: currentPhase,
      toPhase,
      timestamp: Date.now(),
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      )
    }
    console.error('Phase transition error:', error)
    return NextResponse.json(
      { error: 'Failed to transition phase' },
      { status: 500 }
    )
  }
}

async function handleGameEnd(gameId: string) {
  // Get all players with their total scores
  const players = await prisma.player.findMany({
    where: { gameId },
    orderBy: { totalScore: 'desc' },
    include: { user: true },
  })

  if (players.length === 0) return

  const highestScore = players[0].totalScore
  const tiedPlayers = players.filter(p => p.totalScore === highestScore)

  if (tiedPlayers.length > 1) {
    // Initiate tiebreaker
    await updateGameState(gameId, {
      currentPhase: 'tiebreaker',
    })

    // Notify about tiebreaker
    const { notifyTiebreakerStart } = await import('@/lib/sse/broadcast')
    await notifyTiebreakerStart(gameId, tiedPlayers.map(p => p.id))
  } else {
    // Single winner - end game
    await prisma.game.update({
      where: { id: gameId },
      data: {
        status: 'COMPLETED',
        winnerId: players[0].id,
        completedAt: new Date(),
      },
    })

    // Notify game end
    const { notifyGameEnd } = await import('@/lib/sse/broadcast')
    await notifyGameEnd(gameId, players[0].id)
    
    // Record game history
    const { recordGameHistory } = await import('@/lib/game/record-history')
    await recordGameHistory(gameId)
  }
}