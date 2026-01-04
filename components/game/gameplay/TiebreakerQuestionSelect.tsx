'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useMutation } from '@tanstack/react-query'

interface TiebreakerQuestionSelectProps {
  gameId: string
  tiedPlayers: Array<{
    id: string
    username: string
    totalScore: number
  }>
  remainingQuestions?: Array<{
    id: string
    categoryName: string
    value: number
    questionText: string
  }>
  onQuestionSelected?: () => void
}

export function TiebreakerQuestionSelect({
  gameId,
  tiedPlayers,
  remainingQuestions = [],
  onQuestionSelected,
}: TiebreakerQuestionSelectProps) {
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null)

  const selectQuestionMutation = useMutation({
    mutationFn: async (questionId: string) => {
      const response = await fetch('/api/game/question/select', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId, questionId }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to select question')
      }
      
      return response.json()
    },
    onSuccess: () => {
      onQuestionSelected?.()
    },
  })

  const handleSelectQuestion = (questionId: string) => {
    setSelectedQuestionId(questionId)
    selectQuestionMutation.mutate(questionId)
  }

  return (
    <div className="space-y-6">
      {/* Tiebreaker Header */}
      <Card className="p-6 bg-warning/10 border-warning">
        <h2 className="text-2xl font-bold text-center mb-4">
          🏆 SUDDEN DEATH TIEBREAKER 🏆
        </h2>
        <div className="text-center space-y-2">
          <p className="text-lg font-semibold">Tied Players ({tiedPlayers.length})</p>
          <div className="flex justify-center gap-4 flex-wrap">
            {tiedPlayers.map((player) => (
              <div key={player.id} className="bg-surface rounded-lg px-4 py-2">
                <p className="font-medium">{player.username}</p>
                <p className="text-sm text-text-secondary">{player.totalScore} points</p>
              </div>
            ))}
          </div>
        </div>
        <p className="text-center mt-4 text-sm text-text-secondary">
          Select a question for the tiebreaker. First correct answer wins!
        </p>
      </Card>

      {/* Question Selection */}
      {remainingQuestions.length > 0 ? (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Select Tiebreaker Question</h3>
          <div className="grid gap-3 md:grid-cols-2">
            {remainingQuestions.map((question) => (
              <Card
                key={question.id}
                className={`p-4 cursor-pointer transition-all hover:shadow-lg ${
                  selectedQuestionId === question.id
                    ? 'border-primary-light dark:border-primary-dark bg-primary-light/10 dark:bg-primary-dark/10'
                    : 'hover:border-primary-light/50 dark:hover:border-primary-dark/50'
                }`}
                onClick={() => handleSelectQuestion(question.id)}
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <p className="text-sm font-medium text-primary-light dark:text-primary-dark">
                      {question.categoryName}
                    </p>
                    <p className="text-lg font-bold">${question.value}</p>
                  </div>
                  <p className="text-sm line-clamp-2">{question.questionText}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <Card className="p-8 text-center">
          <p className="text-lg font-semibold mb-4">No Unasked Questions Available</p>
          <p className="text-text-secondary mb-6">
            All questions have been asked. You can either:
          </p>
          <div className="space-y-3">
            <Button variant="secondary" className="w-full">
              Create Custom Tiebreaker Question
            </Button>
            <Button variant="secondary" className="w-full">
              Use Random Trivia Question
            </Button>
            <Button variant="secondary" className="w-full">
              Declare Co-Winners
            </Button>
          </div>
        </Card>
      )}

      {/* Loading State */}
      {selectQuestionMutation.isPending && (
        <div className="text-center py-4">
          <p className="text-text-secondary">Selecting question...</p>
        </div>
      )}
    </div>
  )
}