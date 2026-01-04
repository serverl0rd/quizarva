import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'
import { redis, getGameState, updateGameState } from '@/lib/redis/kv'
import { notifyPhaseChange } from '@/lib/sse/broadcast'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const skipQuestionSchema = z.object({
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
    const { gameId } = skipQuestionSchema.parse(body)

    // Verify user is the host
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      select: { hostId: true },
    })

    if (!game || game.hostId !== user.id) {
      return NextResponse.json(
        { error: 'Only the host can skip questions' },
        { status: 403 }
      )
    }

    // Get current question from Redis
    const gameState = await getGameState(gameId)
    
    if (!gameState || !gameState.currentQuestion) {
      return NextResponse.json(
        { error: 'No active question to skip' },
        { status: 400 }
      )
    }

    const currentQuestion = gameState.currentQuestion

    // Create audit log entry for skip
    await prisma.auditLog.create({
      data: {
        gameId,
        userId: null, // No specific player for skips
        boardNumber: await prisma.question.findUnique({
          where: { id: currentQuestion.questionId },
          include: {
            category: {
              include: {
                board: true
              }
            }
          }
        }).then(q => q?.category.board.boardNumber || 1),
        category: currentQuestion.categoryId,
        questionId: currentQuestion.questionId,
        pointDelta: 0,
        reason: 'Question skipped',
              },
    })

    // Clear current question and move to question selection phase
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

    // Notify all clients
    await notifyPhaseChange(gameId, 'selection')

    return NextResponse.json({
      success: true,
      message: 'Question skipped successfully',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      )
    }
    console.error('Skip question error:', error)
    return NextResponse.json(
      { error: 'Failed to skip question' },
      { status: 500 }
    )
  }
}