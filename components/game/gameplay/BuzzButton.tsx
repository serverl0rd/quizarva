'use client'

import { useState, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'

interface BuzzButtonProps {
  gameId: string
  playerId: string
  isEnabled: boolean
  isTiebreaker?: boolean
  isEligibleForTiebreaker?: boolean
  onBuzz?: () => void
}

export function BuzzButton({
  gameId,
  playerId,
  isEnabled,
  isTiebreaker = false,
  isEligibleForTiebreaker = true,
  onBuzz,
}: BuzzButtonProps) {
  const [isPressed, setIsPressed] = useState(false)
  const [buzzFeedback, setBuzzFeedback] = useState<string | null>(null)

  const buzzMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/game/buzz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId }),
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to buzz')
      }
      
      return response.json()
    },
    onSuccess: (data) => {
      if (data.firstBuzz) {
        setBuzzFeedback('You buzzed first!')
        // Haptic feedback for mobile
        if ('vibrate' in navigator) {
          navigator.vibrate(200)
        }
      } else if (data.queued) {
        setBuzzFeedback(`Queued at position ${data.position}`)
      }
      onBuzz?.()
    },
    onError: (error: Error) => {
      setBuzzFeedback(error.message)
      setIsPressed(false)
    },
  })

  const handleBuzz = () => {
    if (!isEnabled || buzzMutation.isPending) return
    
    // During tiebreaker, only eligible players can buzz
    if (isTiebreaker && !isEligibleForTiebreaker) {
      setBuzzFeedback('Only tied players can buzz during tiebreaker')
      return
    }
    
    setIsPressed(true)
    buzzMutation.mutate()
  }

  const handleRelease = () => {
    setIsPressed(false)
  }

  useEffect(() => {
    // Clear feedback after 3 seconds
    if (buzzFeedback) {
      const timer = setTimeout(() => setBuzzFeedback(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [buzzFeedback])

  const isDisabled = !isEnabled || buzzMutation.isPending || (isTiebreaker && !isEligibleForTiebreaker)

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <button
        onTouchStart={handleBuzz}
        onTouchEnd={handleRelease}
        onMouseDown={handleBuzz}
        onMouseUp={handleRelease}
        onMouseLeave={handleRelease}
        disabled={isDisabled}
        className={`
          w-full max-w-sm aspect-square rounded-full
          text-6xl font-bold uppercase tracking-wider
          transition-all duration-100 select-none
          ${isPressed ? 'scale-95 animate-buzz' : 'scale-100'}
          ${isDisabled 
            ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed' 
            : 'bg-primary-light dark:bg-primary-dark text-white cursor-pointer hover:brightness-110 active:brightness-90'
          }
          ${isTiebreaker && !isEligibleForTiebreaker ? 'opacity-50' : ''}
          shadow-lg
        `}
        style={{
          minHeight: '50vh', // Takes up 50% of mobile screen height as per spec
        }}
      >
        {isDisabled && isTiebreaker && !isEligibleForTiebreaker 
          ? 'Not Eligible' 
          : 'BUZZ'
        }
      </button>
      
      {buzzFeedback && (
        <div className={`
          mt-4 px-6 py-3 rounded-lg text-center font-medium
          ${buzzFeedback.includes('first') 
            ? 'bg-success dark:bg-success-dark text-white' 
            : buzzFeedback.includes('Queued')
            ? 'bg-warning text-white'
            : 'bg-error dark:bg-error-dark text-white'
          }
          animate-fade-in
        `}>
          {buzzFeedback}
        </div>
      )}
    </div>
  )
}