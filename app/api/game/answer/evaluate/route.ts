import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'
import { redis, getGameState, updateGameState } from '@/lib/redis/kv'
import { notifyScoreUpdate, notifyPhaseChange } from '@/lib/sse/broadcast'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const evaluateAnswerSchema = z.object({
  gameId: z.string(),
  playerId: z.string(),
  isCorrect: z.boolean(),
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
    const { gameId, playerId, isCorrect } = evaluateAnswerSchema.parse(body)

    // Verify user is the host
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      select: { 
        hostId: true,
        status: true,
        currentSelector: true,
      },
    })

    if (!game || game.hostId !== user.id) {
      return NextResponse.json(
        { error: 'Only the host can evaluate answers' },
        { status: 403 }
      )
    }

    if (game.status !== 'IN_PROGRESS') {
      return NextResponse.json(
        { error: 'Game is not in progress' },
        { status: 400 }
      )
    }

    // Get current question from Redis
    const gameState = await getGameState(gameId)
    
    if (!gameState || !gameState.currentQuestion) {
      return NextResponse.json(
        { error: 'No active question to evaluate' },
        { status: 400 }
      )
    }

    // Verify player is the active buzzer
    const buzzLockKey = `game:${gameId}:buzzLock`
    const activeBuzzer = await redis.get(buzzLockKey)
    
    if (activeBuzzer !== playerId) {
      return NextResponse.json(
        { error: 'Player is not the active responder' },
        { status: 400 }
      )
    }

    const currentQuestion = gameState.currentQuestion
    const questionValue = currentQuestion.value

    // Get board number for the question
    const question = await prisma.question.findUnique({
      where: { id: currentQuestion.questionId },
      include: {
        category: {
          include: {
            board: true
          }
        }
      }
    })

    if (!question) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      )
    }

    const boardNumber = question.category.board.boardNumber

    // Get player details
    const player = await prisma.player.findUnique({
      where: { id: playerId },
      include: { user: true },
    })

    if (!player || player.gameId !== gameId) {
      return NextResponse.json(
        { error: 'Player not found in this game' },
        { status: 404 }
      )
    }

    // Calculate score change
    const scoreChange = isCorrect ? questionValue : -questionValue
    const boardScoreField = boardNumber === 1 ? 'board1Score' : 'board2Score'

    // Update player scores
    const updatedPlayer = await prisma.player.update({
      where: { id: playerId },
      data: {
        [boardScoreField]: {
          increment: scoreChange,
        },
        totalScore: {
          increment: scoreChange,
        },
      },
    })

    // If correct, set player as current selector
    if (isCorrect) {
      await prisma.game.update({
        where: { id: gameId },
        data: { currentSelector: playerId },
      })
      
      // Clear the buzz lock since question is done
      await redis.del(buzzLockKey)
    } else {
      // If incorrect, advance to next buzzer in queue
      const buzzQueueKey = `game:${gameId}:buzzQueue`
      const nextBuzzers = await redis.zrange(buzzQueueKey, 0, 0)
      
      if (nextBuzzers && nextBuzzers.length > 0) {
        // Set next buzzer as active
        const nextBuzzer = nextBuzzers[0] as string
        await redis.set(buzzLockKey, nextBuzzer, { ex: 30 })
        await redis.zrem(buzzQueueKey, nextBuzzer)
        
        // Update buzz queue in database
        await prisma.buzzQueue.updateMany({
          where: { gameId, isActive: true },
          data: { isActive: false },
        })
        
        await prisma.buzzQueue.updateMany({
          where: { gameId, playerId: nextBuzzer },
          data: { isActive: true },
        })
      } else {
        // No more buzzers, clear the lock
        await redis.del(buzzLockKey)
      }
    }

    // Create audit log entry
    await prisma.auditLog.create({
      data: {
        gameId,
        userId: player.userId,
        boardNumber,
        category: question.category.name,
        questionId: question.id,
        pointDelta: scoreChange,
        reason: isCorrect ? 'Correct answer' : 'Incorrect answer',
      },
    })

    // Update game phase to safety slide
    await updateGameState(gameId, {
      currentPhase: 'safety',
    })

    // Notify all clients
    await notifyScoreUpdate(gameId, playerId, scoreChange)
    await notifyPhaseChange(gameId, 'safety')

    return NextResponse.json({
      success: true,
      evaluation: {
        playerId,
        isCorrect,
        scoreChange,
        newScores: {
          board1Score: updatedPlayer.board1Score,
          board2Score: updatedPlayer.board2Score,
          totalScore: updatedPlayer.totalScore,
        },
        currentSelector: isCorrect ? playerId : game.currentSelector,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      )
    }
    console.error('Evaluate answer error:', error)
    return NextResponse.json(
      { error: 'Failed to evaluate answer' },
      { status: 500 }
    )
  }
}