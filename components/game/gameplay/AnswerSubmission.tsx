'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useMutation } from '@tanstack/react-query'

interface AnswerSubmissionProps {
  gameId: string
  playerId: string
  questionValue: number
  onSubmit?: () => void
}

export function AnswerSubmission({
  gameId,
  playerId,
  questionValue,
  onSubmit,
}: AnswerSubmissionProps) {
  const [answer, setAnswer] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(30)

  const submitAnswerMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/game/answer/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId, playerId, answer }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to submit answer')
      }
      
      return response.json()
    },
    onSuccess: () => {
      setSubmitted(true)
      onSubmit?.()
    },
  })

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          if (!submitted && answer.trim()) {
            submitAnswerMutation.mutate()
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [submitted, answer, submitAnswerMutation])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (answer.trim() && !submitted) {
      submitAnswerMutation.mutate()
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] p-4">
        <div className="text-center space-y-4">
          <div className="text-6xl">✓</div>
          <h2 className="text-2xl font-bold">Answer Submitted</h2>
          <p className="text-text-secondary">Waiting for host evaluation...</p>
          <div className="bg-surface rounded-lg p-4 mt-4 max-w-md">
            <p className="text-sm text-text-secondary mb-1">Your answer:</p>
            <p className="text-lg font-medium">{answer}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[50vh] p-4">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">What is your answer?</h2>
        <p className="text-lg text-primary-light dark:text-primary-dark">
          ${questionValue} Question
        </p>
        <p className="text-sm text-text-secondary mt-2">
          Time remaining: {timeRemaining}s
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 flex flex-col max-w-md mx-auto w-full">
        <Input
          type="text"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Type your answer..."
          className="text-lg p-6 mb-4"
          autoFocus
          disabled={submitAnswerMutation.isPending}
          maxLength={200}
        />
        
        <Button
          type="submit"
          size="lg"
          disabled={!answer.trim() || submitAnswerMutation.isPending}
          className="w-full h-16 text-lg"
        >
          {submitAnswerMutation.isPending ? 'Submitting...' : 'Submit Answer'}
        </Button>

        <p className="text-xs text-text-secondary text-center mt-4">
          Your answer will auto-submit when time runs out
        </p>
      </form>
    </div>
  )
}