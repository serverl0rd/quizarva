'use client'

import { useEffect, useState } from 'react'

interface PlayerScore {
  id: string
  userId: string
  username: string
  board1Score: number
  board2Score: number
  totalScore: number
  isCurrentSelector?: boolean
  isHost?: boolean
}

interface LiveScoreboardProps {
  players: PlayerScore[]
  hostName?: string
  currentPlayerId?: string
  showAnimations?: boolean
}

export function LiveScoreboard({
  players,
  hostName,
  currentPlayerId,
  showAnimations = true,
}: LiveScoreboardProps) {
  const [previousScores, setPreviousScores] = useState<Record<string, PlayerScore>>({})
  const [scoreChanges, setScoreChanges] = useState<Record<string, number>>({})

  useEffect(() => {
    // Detect score changes for animations
    const changes: Record<string, number> = {}
    
    players.forEach(player => {
      const prevScore = previousScores[player.id]
      if (prevScore && prevScore.totalScore !== player.totalScore) {
        changes[player.id] = player.totalScore - prevScore.totalScore
      }
    })
    
    if (Object.keys(changes).length > 0) {
      setScoreChanges(changes)
      // Clear changes after animation
      setTimeout(() => setScoreChanges({}), 1000)
    }
    
    // Update previous scores
    const newScores: Record<string, PlayerScore> = {}
    players.forEach(p => {
      newScores[p.id] = { ...p }
    })
    setPreviousScores(newScores)
  }, [players, previousScores])

  // Sort players by their original join order (not by score)
  const sortedPlayers = [...players]

  return (
    <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-lg p-6 border-2 border-border-light dark:border-border-dark">
      <h2 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark mb-6 text-center">
        Live Scores
      </h2>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-border-light dark:border-border-dark">
              <th className="text-left p-3 font-semibold text-text-secondary-light dark:text-text-secondary-dark">
                Player
              </th>
              <th className="text-center p-3 font-semibold text-text-secondary-light dark:text-text-secondary-dark">
                Board 1
              </th>
              <th className="text-center p-3 font-semibold text-text-secondary-light dark:text-text-secondary-dark">
                Board 2
              </th>
              <th className="text-center p-3 font-semibold text-text-secondary-light dark:text-text-secondary-dark">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedPlayers.map((player) => {
              const isCurrentPlayer = player.userId === currentPlayerId
              const scoreChange = scoreChanges[player.id]
              const hasPositiveChange = scoreChange && scoreChange > 0
              const hasNegativeChange = scoreChange && scoreChange < 0
              
              return (
                <tr
                  key={player.id}
                  className={`
                    border-b border-border-light dark:border-border-dark
                    ${isCurrentPlayer ? 'bg-primary-light/10 dark:bg-primary-dark/10' : ''}
                    transition-all duration-300
                  `}
                >
                  <td className="p-3">
                    <div className="flex items-center space-x-2">
                      <span className={`
                        font-medium
                        ${isCurrentPlayer ? 'text-primary-light dark:text-primary-dark' : 'text-text-primary-light dark:text-text-primary-dark'}
                      `}>
                        {player.username}
                        {isCurrentPlayer && ' (You)'}
                      </span>
                      {player.isCurrentSelector && (
                        <span className="px-2 py-1 text-xs font-semibold bg-primary-light dark:bg-primary-dark text-white rounded animate-pulse-glow">
                          Selecting
                        </span>
                      )}
                    </div>
                  </td>
                  <td className={`
                    p-3 text-center font-mono text-lg
                    ${showAnimations && scoreChange && player.board1Score !== previousScores[player.id]?.board1Score
                      ? 'animate-score-update'
                      : ''
                    }
                  `}>
                    <span className={getScoreColor(player.board1Score)}>
                      {formatScore(player.board1Score)}
                    </span>
                  </td>
                  <td className={`
                    p-3 text-center font-mono text-lg
                    ${showAnimations && scoreChange && player.board2Score !== previousScores[player.id]?.board2Score
                      ? 'animate-score-update'
                      : ''
                    }
                  `}>
                    <span className={getScoreColor(player.board2Score)}>
                      {formatScore(player.board2Score)}
                    </span>
                  </td>
                  <td className={`
                    p-3 text-center font-mono text-xl font-bold relative
                    ${showAnimations && scoreChange ? 'animate-score-update' : ''}
                  `}>
                    <span className={getScoreColor(player.totalScore)}>
                      {formatScore(player.totalScore)}
                    </span>
                    {showAnimations && scoreChange && (
                      <span className={`
                        absolute -right-8 top-1/2 -translate-y-1/2
                        text-sm font-bold animate-fade-out
                        ${hasPositiveChange ? 'text-success dark:text-success-dark' : 'text-error dark:text-error-dark'}
                      `}>
                        {hasPositiveChange ? '+' : ''}{scoreChange}
                      </span>
                    )}
                  </td>
                </tr>
              )
            })}
            
            {hostName && (
              <tr className="border-t-2 border-border-light dark:border-border-dark">
                <td colSpan={4} className="p-3 text-center text-text-secondary-light dark:text-text-secondary-dark text-sm">
                  Host: {hostName}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function getScoreColor(score: number): string {
  if (score > 0) return 'text-success dark:text-success-dark'
  if (score < 0) return 'text-error dark:text-error-dark'
  return 'text-text-primary-light dark:text-text-primary-dark'
}

function formatScore(score: number): string {
  // Display negative scores with minus sign (not parentheses)
  return score.toString()
}