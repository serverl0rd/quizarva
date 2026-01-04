import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'
import { redis, getGameState } from '@/lib/redis/kv'
import { notifyScoreUpdate } from '@/lib/sse/broadcast'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const overrideAnswerSchema = z.object({
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
    const { gameId, playerId, isCorrect } = overrideAnswerSchema.parse(body)

    // Verify user is the host
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      select: { hostId: true },
    })

    if (!game || game.hostId !== user.id) {
      return NextResponse.json(
        { error: 'Only the host can override answers' },
        { status: 403 }
      )
    }

    // Get current question from Redis
    const gameState = await getGameState(gameId)
    
    if (!gameState || !gameState.currentQuestion) {
      return NextResponse.json(
        { error: 'No active question' },
        { status: 400 }
      )
    }

    const currentQuestion = gameState.currentQuestion
    const questionValue = currentQuestion.value
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
    }

    // Create audit log entry
    await prisma.auditLog.create({
      data: {
        gameId,
        boardNumber,
        userId: player.userId,
        category: question.category.name,
        questionId: currentQuestion.questionId,
        pointDelta: scoreChange,
        reason: `Host override - ${isCorrect ? 'Correct' : 'Incorrect'}`,
      },
    })

    // Notify all clients
    await notifyScoreUpdate(gameId, playerId, scoreChange)

    return NextResponse.json({
      success: true,
      playerId,
      scoreChange,
      newScores: {
        board1Score: updatedPlayer.board1Score,
        board2Score: updatedPlayer.board2Score,
        totalScore: updatedPlayer.totalScore,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      )
    }
    console.error('Override answer error:', error)
    return NextResponse.json(
      { error: 'Failed to override answer' },
      { status: 500 }
    )
  }
}