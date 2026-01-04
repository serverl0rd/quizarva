'use client'

import Image from 'next/image'

interface QuestionDisplayProps {
  category: string
  value: number
  questionText?: string
  questionImageUrl?: string
  showAnswer?: boolean
  answer?: string
  answerImageUrl?: string
  explanation?: string
}

export function QuestionDisplay({
  category,
  value,
  questionText,
  questionImageUrl,
  showAnswer = false,
  answer,
  answerImageUrl,
  explanation,
}: QuestionDisplayProps) {
  return (
    <div className="w-full max-w-4xl mx-auto p-8">
      {/* Question Header */}
      <div className="text-center mb-8">
        <h3 className="text-2xl font-semibold text-text-secondary-light dark:text-text-secondary-dark mb-2">
          {category}
        </h3>
        <div className="text-5xl font-bold text-primary-light dark:text-primary-dark">
          ${value}
        </div>
      </div>

      {/* Question Content */}
      {!showAnswer && (
        <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-lg p-8 border-2 border-border-light dark:border-border-dark">
          {questionText && (
            <p className="text-3xl text-center font-medium text-text-primary-light dark:text-text-primary-dark mb-6">
              {questionText}
            </p>
          )}
          
          {questionImageUrl && (
            <div className="relative w-full h-96 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
              <Image
                src={questionImageUrl}
                alt="Question"
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                priority
              />
            </div>
          )}
        </div>
      )}

      {/* Answer Content */}
      {showAnswer && (
        <div className="space-y-6">
          <div className="bg-success dark:bg-success-dark rounded-xl shadow-lg p-8 border-2 border-success dark:border-success-dark">
            <h4 className="text-2xl font-bold text-white mb-4">Answer:</h4>
            {answer && (
              <p className="text-3xl text-center font-medium text-white">
                {answer}
              </p>
            )}
            
            {answerImageUrl && (
              <div className="relative w-full h-96 bg-white/10 rounded-lg overflow-hidden mt-6">
                <Image
                  src={answerImageUrl}
                  alt="Answer"
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              </div>
            )}
          </div>

          {explanation && (
            <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-lg p-6 border-2 border-border-light dark:border-border-dark">
              <h5 className="text-lg font-semibold text-text-secondary-light dark:text-text-secondary-dark mb-2">
                Explanation:
              </h5>
              <p className="text-text-primary-light dark:text-text-primary-dark">
                {explanation}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}