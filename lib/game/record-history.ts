import { prisma } from '@/lib/db/prisma'
import { GameStatus } from '@prisma/client'

export async function recordGameHistory(gameId: string) {
  try {
    // Get game with all players and audit logs
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: {
        players: {
          include: {
            user: true,
            buzzQueueEntries: true
          }
        },
        host: true,
        auditLogs: true,
        boards: {
          include: {
            categories: {
              include: {
                questions: true
              }
            }
          }
        }
      }
    })

    if (!game || game.status !== GameStatus.COMPLETED) {
      return
    }

    const gameName = game.name || `Game ${game.id.slice(0, 8)}`
    const duration = game.startedAt && game.completedAt 
      ? Math.round((game.completedAt.getTime() - game.startedAt.getTime()) / (1000 * 60))
      : null

    // Sort players by total score to determine positions
    const sortedPlayers = [...game.players].sort((a, b) => b.totalScore - a.totalScore)
    const totalPlayers = game.players.length

    // Record history for each player
    for (let i = 0; i < sortedPlayers.length; i++) {
      const player = sortedPlayers[i]
      const position = i + 1
      const isWinner = player.userId === game.winnerId

      // Calculate player stats from audit logs
      const playerLogs = game.auditLogs.filter(log => 
        log.userId === player.userId && log.reason.includes('answered')
      )
      
      const correctAnswers = playerLogs.filter(log => log.pointDelta > 0).length
      const incorrectAnswers = playerLogs.filter(log => log.pointDelta < 0).length
      const questionsAnswered = correctAnswers + incorrectAnswers

      // Count buzzes
      const buzzesWon = player.buzzQueueEntries.filter(buzz => 
        playerLogs.some(log => 
          log.questionId === buzz.questionId && log.pointDelta > 0
        )
      ).length

      const buzzesLost = player.buzzQueueEntries.filter(buzz => 
        playerLogs.some(log => 
          log.questionId === buzz.questionId && log.pointDelta < 0
        )
      ).length

      await prisma.gameHistory.create({
        data: {
          userId: player.userId,
          gameId: game.id,
          gameName,
          role: 'player',
          board1Score: player.board1Score,
          board2Score: player.board2Score,
          totalScore: player.totalScore,
          position,
          totalPlayers,
          questionsAnswered,
          correctAnswers,
          incorrectAnswers,
          buzzesWon,
          buzzesLost,
          playedAt: game.completedAt || game.createdAt,
          duration,
          isWinner
        }
      })
    }

    // Record history for the host
    await prisma.gameHistory.create({
      data: {
        userId: game.hostId,
        gameId: game.id,
        gameName,
        role: 'host',
        board1Score: 0,
        board2Score: 0,
        totalScore: 0,
        position: 0,
        totalPlayers: totalPlayers + 1,
        questionsAnswered: 0,
        correctAnswers: 0,
        incorrectAnswers: 0,
        buzzesWon: 0,
        buzzesLost: 0,
        playedAt: game.completedAt || game.createdAt,
        duration,
        isWinner: false
      }
    })

    console.log(`Game history recorded for game ${gameId}`)
  } catch (error) {
    console.error('Error recording game history:', error)
  }
}