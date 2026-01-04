import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'
import { NextResponse } from 'next/server'

export async function GET(
  req: Request,
  { params }: { params: { gameId: string } }
) {
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

    const game = await prisma.game.findUnique({
      where: { id: params.gameId },
      include: {
        players: {
          include: {
            user: {
              select: {
                username: true,
                name: true,
              },
            },
          },
        },
        boards: {
          include: {
            categories: {
              include: {
                questions: true,
              },
              orderBy: {
                order: 'asc',
              },
            },
          },
          orderBy: {
            boardNumber: 'asc',
          },
        },
      },
    })

    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 })
    }

    // Check if user is host or player
    const isHost = game.hostId === user.id
    const isPlayer = game.players.some((p) => p.userId === user.id)

    if (!isHost && !isPlayer) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Format response
    const formattedGame = {
      id: game.id,
      status: game.status,
      currentBoard: game.currentBoard,
      password: isHost ? game.password : undefined,
      players: game.players.map((p) => ({
        id: p.id,
        username: p.user.username,
        board1Score: p.board1Score,
        board2Score: p.board2Score,
        totalScore: p.totalScore,
        isActive: p.isActive,
      })),
      boards: isHost ? game.boards : undefined, // Only host sees full board data
    }

    return NextResponse.json(formattedGame)
  } catch (error) {
    console.error('Game fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch game' },
      { status: 500 }
    )
  }
}