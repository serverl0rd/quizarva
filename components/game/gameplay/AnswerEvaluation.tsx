'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useMutation, useQuery } from '@tanstack/react-query'
import { CheckCircle2, XCircle } from 'lucide-react'

interface AnswerEvaluationProps {
  gameId: string
  currentQuestion: {
    id: string
    answer: string
    value: number
    categoryName: string
  }
  buzzedPlayer?: {
    id: string
    name: string
  }
  onEvaluated?: (correct: boolean) => void
}

export function AnswerEvaluation({
  gameId,
  currentQuestion,
  buzzedPlayer,
  onEvaluated,
}: AnswerEvaluationProps) {
  const [evaluating, setEvaluating] = useState(false)
  const [countdown, setCountdown] = useState(5)

  // Fetch submitted answer
  const { data: submittedAnswer, isLoading } = useQuery({
    queryKey: ['playerAnswer', gameId, buzzedPlayer?.id],
    queryFn: async () => {
      if (!buzzedPlayer?.id) return null
      
      const res = await fetch(`/api/game/player/${buzzedPlayer.id}/answer?gameId=${gameId}`)
      if (!res.ok) return null
      return res.json()
    },
    enabled: !!buzzedPlayer?.id,
    refetchInterval: 1000, // Poll for answer
  })

  const evaluateMutation = useMutation({
    mutationFn: async ({ correct }: { correct: boolean }) => {
      const res = await fetch('/api/game/answer/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId,
          playerId: buzzedPlayer?.id,
          correct,
        }),
      })
      
      if (!res.ok) throw new Error('Failed to evaluate answer')
      return res.json()
    },
    onSuccess: (data, variables) => {
      setEvaluating(false)
      onEvaluated?.(variables.correct)
    },
  })

  // Countdown timer for auto-reveal
  useEffect(() => {
    if (!submittedAnswer?.answer) return
    
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [submittedAnswer])

  const handleEvaluate = (correct: boolean) => {
    setEvaluating(true)
    evaluateMutation.mutate({ correct })
  }

  if (!buzzedPlayer) {
    return (
      <Card className="p-6 text-center">
        <p className="text-text-secondary">Waiting for a player to buzz in...</p>
      </Card>
    )
  }

  if (isLoading || !submittedAnswer?.answer) {
    return (
      <Card className="p-6">
        <div className="text-center space-y-4">
          <h3 className="text-xl font-semibold">
            Waiting for {buzzedPlayer.name} to submit their answer...
          </h3>
          <div className="animate-pulse flex justify-center">
            <div className="h-2 w-24 bg-gray-300 dark:bg-gray-600 rounded"></div>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6 space-y-6">
      <div>
        <h3 className="text-xl font-semibold mb-4">Evaluate Answer</h3>
        
        <div className="grid gap-4">
          <div>
            <p className="text-sm text-text-secondary mb-1">Question</p>
            <p className="font-medium">{currentQuestion.categoryName} for ${currentQuestion.value}</p>
          </div>

          <div>
            <p className="text-sm text-text-secondary mb-1">Correct Answer</p>
            <p className="font-medium text-success dark:text-success-dark">
              {currentQuestion.answer}
            </p>
          </div>

          <div>
            <p className="text-sm text-text-secondary mb-1">
              {buzzedPlayer.name}'s Answer
            </p>
            <p className="text-lg font-semibold bg-surface-alt dark:bg-surface-alt-dark rounded-lg p-4">
              {submittedAnswer.answer}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex gap-3">
          <Button
            onClick={() => handleEvaluate(true)}
            disabled={evaluating}
            className="flex-1"
            variant="primary"
            size="lg"
          >
            <CheckCircle2 className="mr-2 h-5 w-5" />
            Correct
          </Button>
          
          <Button
            onClick={() => handleEvaluate(false)}
            disabled={evaluating}
            variant="danger"
            size="lg"
            className="flex-1"
          >
            <XCircle className="mr-2 h-5 w-5" />
            Incorrect
          </Button>
        </div>

        {countdown > 0 && (
          <p className="text-center text-sm text-text-secondary">
            Auto-revealing answer in {countdown} seconds...
          </p>
        )}
      </div>
    </Card>
  )
}