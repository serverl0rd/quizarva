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

    const { searchParams } = new URL(req.url)
    const format = searchParams.get('format') || 'json'

    // Fetch complete game data
    const game = await db.game.findUnique({
      where: { id: params.gameId },
      include: {
        host: true,
        players: {
          include: { user: true },
          orderBy: { totalScore: 'desc' },
        },
        boards: {
          include: {
            categories: {
              include: {
                questions: {
                  orderBy: { value: 'asc' },
                },
              },
              orderBy: { order: 'asc' },
            },
          },
          orderBy: { boardNumber: 'asc' },
        },
        auditLogs: {
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 })
    }

    // Only host can export game data
    if (game.hostId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized - host only' }, { status: 401 })
    }

    if (format === 'csv') {
      // Generate CSV format
      const csv = generateCSV(game)
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="quizarva-game-${params.gameId}.csv"`,
        },
      })
    } else {
      // Generate JSON format
      const exportData = {
        gameId: game.id,
        exportedAt: new Date().toISOString(),
        password: game.password,
        status: game.status,
        startedAt: game.startedAt,
        completedAt: game.completedAt,
        winner: game.winnerId ? game.players.find(p => p.id === game.winnerId) : null,
        host: {
          name: game.host.name,
          email: game.host.email,
        },
        players: game.players.map(p => ({
          username: p.user?.name || p.user?.username || 'Unknown',
          board1Score: p.board1Score,
          board2Score: p.board2Score,
          totalScore: p.totalScore,
          isWinner: p.id === game.winnerId,
        })),
        boards: game.boards.map(board => ({
          boardNumber: board.boardNumber,
          categories: board.categories.map(cat => ({
            name: cat.name,
            order: cat.order,
            questions: cat.questions.map(q => ({
              value: q.value,
              question: q.questionText,
              answer: q.correctAnswer,
              explanation: q.explanation,
              hasBeenAsked: q.isAnswered,
              questionImageUrl: q.questionImage,
              answerImageUrl: q.answerImage,
            })),
          })),
        })),
        auditLogs: game.auditLogs.map(log => ({
          boardNumber: log.boardNumber,
          category: log.category,
          questionId: log.questionId,
          pointDelta: log.pointDelta,
          reason: log.reason,
          createdAt: log.createdAt,
          userId: log.userId,
        })),
      }

      return NextResponse.json(exportData)
    }
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json(
      { error: 'Failed to export game data' },
      { status: 500 }
    )
  }
}

function generateCSV(game: any): string {
  const lines: string[] = []
  
  // Game Info
  lines.push('Game Information')
  lines.push(`Game ID,${game.id}`)
  lines.push(`Password,${game.password}`)
  lines.push(`Status,${game.status}`)
  lines.push(`Started,${game.startedAt || 'N/A'}`)
  lines.push(`Ended,${game.completedAt || 'N/A'}`)
  lines.push('')

  // Players and Scores
  lines.push('Players and Scores')
  lines.push('Player,Board 1 Score,Board 2 Score,Total Score,Winner')
  game.players.forEach((p: any) => {
    lines.push(
      `"${p.user?.name || p.username || 'Unknown'}",${p.board1Score},${p.board2Score},${p.totalScore},${p.id === game.winnerId ? 'Yes' : 'No'}`
    )
  })
  lines.push('')

  // Questions and Answers
  lines.push('Questions and Answers')
  lines.push('Board,Category,Value,Question,Answer,Asked')
  game.boards.forEach((board: any) => {
    board.categories.forEach((cat: any) => {
      cat.questions.forEach((q: any) => {
        lines.push(
          `${board.boardNumber},"${cat.name}",${q.value},"${q.questionText.replace(/"/g, '""')}","${q.answer.replace(/"/g, '""')}",${q.hasBeenAsked ? 'Yes' : 'No'}`
        )
      })
    })
  })

  return lines.join('\n')
}