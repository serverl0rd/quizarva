'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'

interface Player {
  id: string
  userId: string
  username: string
  board1Score: number
  board2Score: number
  totalScore: number
}

interface HostOverridePanelProps {
  gameId: string
  players: Player[]
  currentQuestionValue?: number
  onOverride?: () => void
}

export function HostOverridePanel({
  gameId,
  players,
  currentQuestionValue,
  onOverride,
}: HostOverridePanelProps) {
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null)
  const [scoreAdjustment, setScoreAdjustment] = useState<string>('')
  const [isAddScore, setIsAddScore] = useState(true)
  const [showSkipConfirm, setShowSkipConfirm] = useState(false)
  const queryClient = useQueryClient()

  const overrideAnswerMutation = useMutation({
    mutationFn: async ({ playerId, isCorrect }: { playerId: string; isCorrect: boolean }) => {
      const response = await fetch('/api/game/host/override/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId, playerId, isCorrect }),
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to override answer')
      }
      
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['game', gameId] })
      onOverride?.()
    },
  })

  const adjustScoreMutation = useMutation({
    mutationFn: async ({ playerId, pointsDelta, boardNumber }: { 
      playerId: string; 
      pointsDelta: number; 
      boardNumber: number 
    }) => {
      const response = await fetch('/api/game/host/override/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId, playerId, pointsDelta, boardNumber }),
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to adjust score')
      }
      
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['game', gameId] })
      setScoreAdjustment('')
      setSelectedPlayer(null)
      onOverride?.()
    },
  })

  const skipQuestionMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/game/host/override/skip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId }),
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to skip question')
      }
      
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['game', gameId] })
      setShowSkipConfirm(false)
      onOverride?.()
    },
  })

  const handleScoreAdjustment = (boardNumber: number) => {
    if (!selectedPlayer || !scoreAdjustment) return
    
    const points = parseInt(scoreAdjustment)
    if (isNaN(points)) return
    
    const pointsDelta = isAddScore ? points : -points
    adjustScoreMutation.mutate({ 
      playerId: selectedPlayer, 
      pointsDelta, 
      boardNumber 
    })
  }

  return (
    <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-lg p-6 border-2 border-warning">
      <h3 className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark mb-4 flex items-center">
        <span className="mr-2">⚡</span> Host Override Panel
      </h3>
      
      {/* Answer Override Section */}
      {currentQuestionValue && (
        <div className="mb-6">
          <h4 className="text-lg font-semibold mb-3">Override Answer</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {players.map((player) => (
              <div key={player.id} className="flex flex-col gap-2">
                <span className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">
                  {player.username}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => overrideAnswerMutation.mutate({ 
                      playerId: player.id, 
                      isCorrect: true 
                    })}
                    disabled={overrideAnswerMutation.isPending}
                    className="flex-1 px-3 py-2 bg-success dark:bg-success-dark text-white rounded-md hover:brightness-110 disabled:opacity-50 font-medium text-sm"
                  >
                    ✓ Correct
                  </button>
                  <button
                    onClick={() => overrideAnswerMutation.mutate({ 
                      playerId: player.id, 
                      isCorrect: false 
                    })}
                    disabled={overrideAnswerMutation.isPending}
                    className="flex-1 px-3 py-2 bg-error dark:bg-error-dark text-white rounded-md hover:brightness-110 disabled:opacity-50 font-medium text-sm"
                  >
                    ✗ Wrong
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Score Adjustment Section */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold mb-3">Manual Score Adjustment</h4>
        <div className="space-y-3">
          <select
            value={selectedPlayer || ''}
            onChange={(e) => setSelectedPlayer(e.target.value)}
            className="w-full px-4 py-2 rounded-md border border-border-light dark:border-border-dark bg-white dark:bg-gray-900 text-text-primary-light dark:text-text-primary-dark"
          >
            <option value="">Select a player</option>
            {players.map((player) => (
              <option key={player.id} value={player.id}>
                {player.username} (B1: {player.board1Score}, B2: {player.board2Score}, Total: {player.totalScore})
              </option>
            ))}
          </select>
          
          {selectedPlayer && (
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={scoreAdjustment}
                onChange={(e) => setScoreAdjustment(e.target.value)}
                placeholder="Points"
                className="w-24 px-3 py-2 rounded-md border border-border-light dark:border-border-dark bg-white dark:bg-gray-900 text-text-primary-light dark:text-text-primary-dark"
              />
              
              <div className="flex items-center bg-surface-light dark:bg-surface-dark rounded-md border border-border-light dark:border-border-dark">
                <button
                  onClick={() => setIsAddScore(true)}
                  className={`px-4 py-2 rounded-l-md transition-colors ${
                    isAddScore 
                      ? 'bg-success dark:bg-success-dark text-white' 
                      : 'text-text-primary-light dark:text-text-primary-dark'
                  }`}
                >
                  +
                </button>
                <button
                  onClick={() => setIsAddScore(false)}
                  className={`px-4 py-2 rounded-r-md transition-colors ${
                    !isAddScore 
                      ? 'bg-error dark:bg-error-dark text-white' 
                      : 'text-text-primary-light dark:text-text-primary-dark'
                  }`}
                >
                  −
                </button>
              </div>
              
              <button
                onClick={() => handleScoreAdjustment(1)}
                disabled={!scoreAdjustment || adjustScoreMutation.isPending}
                className="px-4 py-2 bg-primary-light dark:bg-primary-dark text-white rounded-md hover:brightness-110 disabled:opacity-50 font-medium"
              >
                Apply to Board 1
              </button>
              
              <button
                onClick={() => handleScoreAdjustment(2)}
                disabled={!scoreAdjustment || adjustScoreMutation.isPending}
                className="px-4 py-2 bg-primary-light dark:bg-primary-dark text-white rounded-md hover:brightness-110 disabled:opacity-50 font-medium"
              >
                Apply to Board 2
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Skip Question Section */}
      <div>
        <h4 className="text-lg font-semibold mb-3">Skip Question</h4>
        {!showSkipConfirm ? (
          <button
            onClick={() => setShowSkipConfirm(true)}
            className="px-6 py-2 bg-warning text-white rounded-md hover:brightness-110 font-medium"
          >
            Skip Current Question
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <span className="text-text-secondary-light dark:text-text-secondary-dark">
              Are you sure you want to skip this question?
            </span>
            <button
              onClick={() => skipQuestionMutation.mutate()}
              disabled={skipQuestionMutation.isPending}
              className="px-4 py-2 bg-error dark:bg-error-dark text-white rounded-md hover:brightness-110 disabled:opacity-50 font-medium"
            >
              Yes, Skip
            </button>
            <button
              onClick={() => setShowSkipConfirm(false)}
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:brightness-110 font-medium"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  )
}