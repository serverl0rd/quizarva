'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'

interface Question {
  id: string
  value: number
  hasBeenAsked: boolean
  questionText?: string
  questionImageUrl?: string
}

interface Category {
  id: string
  name: string
  questions: Question[]
}

interface Board {
  id: string
  boardNumber: number
  categories: Category[]
}

interface QuestionSelectionProps {
  gameId: string
  boards: Board[]
  currentBoard: number
  isCurrentSelector: boolean
  currentSelectorName?: string
  onQuestionSelect?: (categoryId: string, questionId: string) => void
}

export function QuestionSelection({
  gameId,
  boards,
  currentBoard,
  isCurrentSelector,
  currentSelectorName = 'Host',
  onQuestionSelect,
}: QuestionSelectionProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const selectQuestionMutation = useMutation({
    mutationFn: async ({ categoryId, questionId }: { categoryId: string; questionId: string }) => {
      const response = await fetch('/api/game/question/select', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId, categoryId, questionId }),
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to select question')
      }
      
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['game', gameId] })
      setSelectedCategory(null)
      onQuestionSelect?.(selectedCategory!, '')
    },
  })

  const handleCategoryClick = (categoryId: string) => {
    if (!isCurrentSelector) return
    setSelectedCategory(categoryId === selectedCategory ? null : categoryId)
  }

  const handleQuestionClick = (categoryId: string, questionId: string, hasBeenAsked: boolean) => {
    if (!isCurrentSelector || hasBeenAsked) return
    selectQuestionMutation.mutate({ categoryId, questionId })
  }

  const currentBoardData = boards.find(b => b.boardNumber === currentBoard)
  if (!currentBoardData) return null

  return (
    <div className="w-full max-w-7xl mx-auto p-4">
      <div className="mb-6 text-center">
        <h2 className="text-3xl font-bold text-text-primary-light dark:text-text-primary-dark mb-2">
          Board {currentBoard}
        </h2>
        <p className="text-lg text-text-secondary-light dark:text-text-secondary-dark">
          {isCurrentSelector ? (
            'Select a question'
          ) : (
            <>Waiting for <span className="font-semibold animate-pulse-glow">{currentSelectorName}</span> to select</>
          )}
        </p>
      </div>

      <div className="grid grid-cols-5 gap-4">
        {currentBoardData.categories.map((category) => (
          <div key={category.id} className="flex flex-col gap-2">
            <button
              onClick={() => handleCategoryClick(category.id)}
              disabled={!isCurrentSelector}
              className={`
                p-4 rounded-lg font-bold text-center transition-all
                ${selectedCategory === category.id
                  ? 'bg-primary-light dark:bg-primary-dark text-white'
                  : 'bg-surface-light dark:bg-surface-dark text-text-primary-light dark:text-text-primary-dark'
                }
                ${isCurrentSelector ? 'hover:brightness-110 cursor-pointer' : 'cursor-not-allowed opacity-75'}
                border-2 ${selectedCategory === category.id 
                  ? 'border-primary-light dark:border-primary-dark' 
                  : 'border-border-light dark:border-border-dark'
                }
              `}
            >
              {category.name}
            </button>

            <div className="flex flex-col gap-2">
              {category.questions.map((question) => (
                <button
                  key={question.id}
                  onClick={() => handleQuestionClick(category.id, question.id, question.hasBeenAsked)}
                  disabled={!isCurrentSelector || question.hasBeenAsked || selectedCategory !== category.id}
                  className={`
                    p-4 rounded-lg font-bold text-2xl transition-all
                    ${question.hasBeenAsked
                      ? 'bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                      : selectedCategory === category.id && isCurrentSelector
                        ? 'bg-primary-light dark:bg-primary-dark text-white hover:brightness-110 cursor-pointer'
                        : 'bg-surface-light dark:bg-surface-dark text-text-primary-light dark:text-text-primary-dark'
                    }
                    ${!isCurrentSelector && !question.hasBeenAsked ? 'cursor-not-allowed opacity-75' : ''}
                    border-2 ${question.hasBeenAsked 
                      ? 'border-gray-300 dark:border-gray-700' 
                      : 'border-border-light dark:border-border-dark'
                    }
                    ${selectedCategory === category.id && !question.hasBeenAsked ? 'shadow-lg transform hover:scale-105' : ''}
                  `}
                >
                  {question.hasBeenAsked ? '✓' : `$${question.value}`}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {selectQuestionMutation.isPending && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-lg">
            <p className="text-lg font-semibold">Selecting question...</p>
          </div>
        </div>
      )}
    </div>
  )
}