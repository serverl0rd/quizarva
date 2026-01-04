import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'
import { notifyScoreUpdate } from '@/lib/sse/broadcast'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const adjustScoreSchema = z.object({
  gameId: z.string(),
  playerId: z.string(),
  pointsDelta: z.number(),
  boardNumber: z.number().min(1).max(2),
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
    const { gameId, playerId, pointsDelta, boardNumber } = adjustScoreSchema.parse(body)

    // Verify user is the host
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      select: { hostId: true },
    })

    if (!game || game.hostId !== user.id) {
      return NextResponse.json(
        { error: 'Only the host can adjust scores' },
        { status: 403 }
      )
    }

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

    // Update player scores
    const boardScoreField = boardNumber === 1 ? 'board1Score' : 'board2Score'
    
    const updatedPlayer = await prisma.player.update({
      where: { id: playerId },
      data: {
        [boardScoreField]: {
          increment: pointsDelta,
        },
        totalScore: {
          increment: pointsDelta,
        },
      },
    })

    // Create audit log entry
    await prisma.auditLog.create({
      data: {
        gameId,
        userId: player.userId,
        boardNumber,
        category: 'Manual Adjustment',
        questionId: null,
        pointDelta: pointsDelta,
        reason: 'Manual score adjustment',
      },
    })

    // Notify all clients
    await notifyScoreUpdate(gameId, playerId, pointsDelta)

    return NextResponse.json({
      success: true,
      playerId,
      pointsDelta,
      boardNumber,
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
    console.error('Adjust score error:', error)
    return NextResponse.json(
      { error: 'Failed to adjust score' },
      { status: 500 }
    )
  }
}