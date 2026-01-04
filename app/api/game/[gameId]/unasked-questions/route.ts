import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { prisma as db } from '@/lib/db/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: { gameId: string } }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify the requester is the host of the game
    const game = await db.game.findUnique({
      where: { id: params.gameId },
      select: { hostId: true },
    })

    if (!game || game.hostId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized - host only' }, { status: 401 })
    }

    // Fetch all unasked questions
    const unaskedQuestions = await db.question.findMany({
      where: {
        category: {
          board: {
            gameId: params.gameId,
          },
        },
        isAnswered: false,
      },
      select: {
        id: true,
        value: true,
        questionText: true,
        category: {
          select: {
            name: true,
            board: {
              select: {
                boardNumber: true,
              },
            },
          },
        },
      },
      orderBy: [
        { value: 'desc' }, // Higher value questions first for tiebreaker
        { category: { order: 'asc' } },
      ],
    })

    // Transform the data
    const questions = unaskedQuestions.map(q => ({
      id: q.id,
      categoryName: q.category.name,
      boardNumber: q.category.board.boardNumber,
      value: q.value,
      questionText: q.questionText,
    }))

    return NextResponse.json({ questions })
  } catch (error) {
    console.error('Get unasked questions error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch unasked questions' },
      { status: 500 }
    )
  }
}