import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'
import { redis, getGameState, updateGameState } from '@/lib/redis/kv'
import { notifyQuestionSelected } from '@/lib/sse/broadcast'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const selectQuestionSchema = z.object({
  gameId: z.string(),
  categoryId: z.string(),
  questionId: z.string(),
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
    const { gameId, categoryId, questionId } = selectQuestionSchema.parse(body)

    // Get game state from Redis
    const gameState = await getGameState(gameId)

    if (!gameState) {
      return NextResponse.json(
        { error: 'Game state not found' },
        { status: 404 }
      )
    }

    // Verify user is the current selector
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      select: { 
        hostId: true,
        currentSelector: true,
      },
    })

    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 })
    }

    // Check if user is authorized to select (either host or current selector)
    const player = await prisma.player.findFirst({
      where: {
        gameId,
        userId: user.id,
      },
    })

    const isHost = game.hostId === user.id
    const isCurrentSelector = game.currentSelector === player?.id

    // Only current selector or host (if no current selector) can select questions
    if (!isCurrentSelector && !(isHost && !game.currentSelector)) {
      return NextResponse.json(
        { error: 'You are not authorized to select questions' },
        { status: 403 }
      )
    }

    // Verify question exists and hasn't been asked
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: {
        category: {
          include: {
            board: {
              select: {
                boardNumber: true,
              },
            },
          },
        },
      },
    })

    if (!question) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      )
    }

    if (question.categoryId !== categoryId) {
      return NextResponse.json(
        { error: 'Question does not belong to this category' },
        { status: 400 }
      )
    }

    if (question.isAnswered) {
      return NextResponse.json(
        { error: 'This question has already been asked' },
        { status: 400 }
      )
    }

    // Update question as asked
    await prisma.question.update({
      where: { id: questionId },
      data: { isAnswered: true },
    })

    // Update game state in Redis
    await updateGameState(gameId, {
      currentPhase: 'question',
      currentQuestion: {
        boardNumber: question.category.board.boardNumber,
        categoryId: question.categoryId,
        value: question.value,
        questionId: question.id,
      },
    })

    // Clear any existing buzz state
    const buzzLockKey = `game:${gameId}:buzzLock`
    const buzzQueueKey = `game:${gameId}:buzzQueue`
    await redis.del(buzzLockKey)
    await redis.del(buzzQueueKey)

    // Clear buzz queue in database
    await prisma.buzzQueue.deleteMany({
      where: { gameId },
    })

    // Notify all clients
    await notifyQuestionSelected(gameId, categoryId, questionId)

    return NextResponse.json({
      success: true,
      question: {
        id: question.id,
        value: question.value,
        category: question.category.name,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      )
    }
    console.error('Select question error:', error)
    return NextResponse.json(
      { error: 'Failed to select question' },
      { status: 500 }
    )
  }
}