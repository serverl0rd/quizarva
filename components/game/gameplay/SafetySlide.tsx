'use client'

import { useEffect, useState } from 'react'

interface SafetySlideProps {
  isVisible: boolean
  hostName?: string
  currentQuestion?: {
    category: string
    value: number
  }
  onContinue?: () => void
  isHost?: boolean
}

export function SafetySlide({
  isVisible,
  hostName = 'Host',
  currentQuestion,
  onContinue,
  isHost = false,
}: SafetySlideProps) {
  const [dots, setDots] = useState('.')

  useEffect(() => {
    if (!isVisible) return

    // Animate dots for "waiting" effect
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '.' : prev + '.')
    }, 500)

    return () => clearInterval(interval)
  }, [isVisible])

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 bg-bg-light dark:bg-bg-dark z-50 flex items-center justify-center">
      <div className="max-w-2xl w-full mx-auto px-8 text-center">
        <h1 className="text-6xl font-bold mb-8 text-primary-light dark:text-primary-dark">
          QuizArva
        </h1>
        
        {currentQuestion && (
          <div className="mb-12">
            <p className="text-2xl text-text-secondary-light dark:text-text-secondary-dark mb-2">
              Category: {currentQuestion.category}
            </p>
            <p className="text-4xl font-bold text-text-primary-light dark:text-text-primary-dark">
              {currentQuestion.value} Points
            </p>
          </div>
        )}
        
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-surface-light dark:bg-surface-dark shadow-lg mb-6">
            <div className="w-16 h-16 rounded-full bg-primary-light dark:bg-primary-dark animate-pulse" />
          </div>
          
          <p className="text-xl text-text-secondary-light dark:text-text-secondary-dark">
            {isHost ? (
              'Prepare to reveal the answer'
            ) : (
              <>Waiting for {hostName} to continue{dots}</>
            )}
          </p>
        </div>
        
        {isHost && (
          <button
            onClick={onContinue}
            className="px-8 py-4 bg-primary-light dark:bg-primary-dark text-white rounded-lg font-semibold text-lg hover:brightness-110 transition-all"
          >
            Continue to Answer
          </button>
        )}
        
        {!isHost && (
          <div className="flex justify-center space-x-2 mt-8">
            <div className="w-3 h-3 rounded-full bg-primary-light dark:bg-primary-dark animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-3 h-3 rounded-full bg-primary-light dark:bg-primary-dark animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-3 h-3 rounded-full bg-primary-light dark:bg-primary-dark animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        )}
      </div>
    </div>
  )
}