'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { ImageUpload } from '@/components/ui/image-upload'
import { useMutation } from '@tanstack/react-query'
import type { GameConfig } from '@/types/game'
import { Upload, FileJson, Download, ChevronDown, ChevronUp } from 'lucide-react'

interface QuizBuilderProps {
  onGameCreated: (gameId: string) => void
}

const POINT_VALUES = [10, 20, 30, 40, 50]

export function QuizBuilder({ onGameCreated }: QuizBuilderProps) {
  const [password, setPassword] = useState('')
  const [buzzTimeout, setBuzzTimeout] = useState('')
  const [answerTimeout, setAnswerTimeout] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const [expandedQuestions, setExpandedQuestions] = useState<Record<string, boolean>>({})
  const [boards, setBoards] = useState<GameConfig['boards']>({
    board1: {
      categories: Array(5).fill(null).map(() => ({
        name: '',
        questions: Array(5).fill(null).map(() => ({
          questionText: '',
          correctAnswer: '',
          explanation: '',
          questionImage: '',
          answerImage: '',
        })),
      })),
    },
    board2: {
      categories: Array(5).fill(null).map(() => ({
        name: '',
        questions: Array(5).fill(null).map(() => ({
          questionText: '',
          correctAnswer: '',
          explanation: '',
          questionImage: '',
          answerImage: '',
        })),
      })),
    },
  })

  const createGameMutation = useMutation({
    mutationFn: async (config: GameConfig) => {
      const res = await fetch('/api/game/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })
      if (!res.ok) throw new Error('Failed to create game')
      return res.json()
    },
    onSuccess: (data) => {
      onGameCreated(data.gameId)
    },
  })

  const updateCategory = (
    boardNum: 1 | 2,
    categoryIndex: number,
    name: string
  ) => {
    setBoards((prev) => ({
      ...prev,
      [`board${boardNum}`]: {
        categories: prev[`board${boardNum}`].categories.map((cat, i) =>
          i === categoryIndex ? { ...cat, name } : cat
        ),
      },
    }))
  }

  const updateQuestion = (
    boardNum: 1 | 2,
    categoryIndex: number,
    questionIndex: number,
    field: 'questionText' | 'correctAnswer' | 'explanation' | 'questionImage' | 'answerImage',
    value: string
  ) => {
    setBoards((prev) => ({
      ...prev,
      [`board${boardNum}`]: {
        categories: prev[`board${boardNum}`].categories.map((cat, i) =>
          i === categoryIndex
            ? {
                ...cat,
                questions: cat.questions.map((q, j) =>
                  j === questionIndex ? { ...q, [field]: value } : q
                ),
              }
            : cat
        ),
      },
    }))
  }

  const isValid = () => {
    if (!password) return false
    
    for (const boardKey of ['board1', 'board2'] as const) {
      const board = boards[boardKey]
      for (const category of board.categories) {
        if (!category.name) return false
        for (const question of category.questions) {
          if (!question.questionText || !question.correctAnswer) return false
        }
      }
    }
    
    return true
  }

  const handleSubmit = () => {
    const config: GameConfig = {
      password,
      buzzTimeout: buzzTimeout ? parseInt(buzzTimeout) : undefined,
      answerTimeout: answerTimeout ? parseInt(answerTimeout) : undefined,
      boards,
    }
    createGameMutation.mutate(config)
  }

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setImportError(null)
    
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      
      // Send to import API for validation and transformation
      const response = await fetch('/api/game/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Import failed')
      }

      const result = await response.json()
      const importedData = result.data

      // Update form with imported data
      setPassword(importedData.password || '')
      setBoards({
        board1: importedData.board1,
        board2: importedData.board2,
      })

      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      console.error('Import error:', error)
      setImportError(error instanceof Error ? error.message : 'Failed to import file')
    }
  }

  const handleDownloadTemplate = () => {
    const template = {
      password: "example123",
      boards: [
        {
          boardNumber: 1,
          categories: Array(5).fill(null).map((_, catIndex) => ({
            name: `Category ${catIndex + 1}`,
            position: catIndex,
            questions: Array(5).fill(null).map((_, qIndex) => ({
              value: POINT_VALUES[qIndex],
              question: `Question text for ${POINT_VALUES[qIndex]} points`,
              answer: `Answer for ${POINT_VALUES[qIndex]} points`,
              explanation: "Optional explanation",
              questionImage: "",
              answerImage: "",
            })),
          })),
        },
        {
          boardNumber: 2,
          categories: Array(5).fill(null).map((_, catIndex) => ({
            name: `Category ${catIndex + 6}`,
            position: catIndex,
            questions: Array(5).fill(null).map((_, qIndex) => ({
              value: POINT_VALUES[qIndex],
              question: `Question text for ${POINT_VALUES[qIndex]} points`,
              answer: `Answer for ${POINT_VALUES[qIndex]} points`,
              explanation: "Optional explanation",
              questionImage: "",
              answerImage: "",
            })),
          })),
        },
      ],
    }

    const blob = new Blob([JSON.stringify(template, null, 2)], {
      type: 'application/json',
    })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'quizarva-template.json'
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  return (
    <div className="space-y-8">
      {/* Import/Export Options */}
      <div className="bg-surface rounded-lg p-6 border border-border">
        <h2 className="text-xl font-semibold mb-4">Import/Export</h2>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
              id="import-file"
            />
            <Button 
              variant="secondary" 
              className="w-full cursor-pointer" 
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-4 w-4" />
              Import Game from JSON
            </Button>
          </div>
          <Button
            variant="secondary"
            onClick={handleDownloadTemplate}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Download Template
          </Button>
        </div>
        {importError && (
          <div className="mt-2 text-sm text-error dark:text-error-dark">
            Error: {importError}
          </div>
        )}
        <p className="text-xs text-text-secondary mt-2">
          Import a previously exported game or use the template to get started
        </p>
      </div>

      {/* Game Settings */}
      <div className="bg-surface rounded-lg p-6 border border-border">
        <h2 className="text-xl font-semibold mb-4">Game Settings</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="block text-sm font-medium mb-2">
              Game Password *
            </label>
            <input
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2"
              placeholder="Enter password"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Buzz Timeout (seconds)
            </label>
            <input
              type="number"
              value={buzzTimeout}
              onChange={(e) => setBuzzTimeout(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2"
              placeholder="Optional"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Answer Timeout (seconds)
            </label>
            <input
              type="number"
              value={answerTimeout}
              onChange={(e) => setAnswerTimeout(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2"
              placeholder="Optional"
            />
          </div>
        </div>
      </div>

      {/* Boards */}
      {([1, 2] as const).map((boardNum) => (
        <div key={boardNum} className="space-y-4">
          <h2 className="text-2xl font-bold">Board {boardNum}</h2>
          <div className="grid gap-4 lg:grid-cols-5">
            {boards[`board${boardNum}`].categories.map((category, catIndex) => (
              <div
                key={catIndex}
                className="bg-surface rounded-lg p-4 border border-border"
              >
                <input
                  type="text"
                  value={category.name}
                  onChange={(e) =>
                    updateCategory(boardNum, catIndex, e.target.value)
                  }
                  className="w-full rounded-md border border-border bg-background px-3 py-2 mb-4 font-semibold"
                  placeholder={`Category ${catIndex + 1}`}
                />
                <div className="space-y-3">
                  {category.questions.map((question, qIndex) => (
                    <div key={qIndex} className="space-y-2">
                      <div className="text-sm font-medium text-primary">
                        ${POINT_VALUES[qIndex]}
                      </div>
                      <textarea
                        value={question.questionText}
                        onChange={(e) =>
                          updateQuestion(
                            boardNum,
                            catIndex,
                            qIndex,
                            'questionText',
                            e.target.value
                          )
                        }
                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm h-20 resize-none"
                        placeholder="Question..."
                      />
                      <input
                        type="text"
                        value={question.correctAnswer}
                        onChange={(e) =>
                          updateQuestion(
                            boardNum,
                            catIndex,
                            qIndex,
                            'correctAnswer',
                            e.target.value
                          )
                        }
                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                        placeholder="Answer..."
                      />
                      
                      {/* Expandable section for images and explanation */}
                      <button
                        type="button"
                        onClick={() => {
                          const key = `${boardNum}-${catIndex}-${qIndex}`
                          setExpandedQuestions(prev => ({
                            ...prev,
                            [key]: !prev[key]
                          }))
                        }}
                        className="flex items-center justify-between w-full text-sm text-text-secondary hover:text-primary-light dark:hover:text-primary-dark transition-colors py-1"
                      >
                        <span>More options</span>
                        {expandedQuestions[`${boardNum}-${catIndex}-${qIndex}`] ? (
                          <ChevronUp className="h-3 w-3" />
                        ) : (
                          <ChevronDown className="h-3 w-3" />
                        )}
                      </button>
                      
                      {expandedQuestions[`${boardNum}-${catIndex}-${qIndex}`] && (
                        <div className="space-y-2 pt-2 border-t border-border">
                          <div>
                            <label className="text-xs font-medium text-text-secondary">Question Image</label>
                            <ImageUpload
                              value={question.questionImage || ''}
                              onChange={(url) =>
                                updateQuestion(
                                  boardNum,
                                  catIndex,
                                  qIndex,
                                  'questionImage',
                                  url
                                )
                              }
                              placeholder="Upload question image"
                              className="mt-1"
                            />
                          </div>
                          
                          <div>
                            <label className="text-xs font-medium text-text-secondary">Answer Image</label>
                            <ImageUpload
                              value={question.answerImage || ''}
                              onChange={(url) =>
                                updateQuestion(
                                  boardNum,
                                  catIndex,
                                  qIndex,
                                  'answerImage',
                                  url
                                )
                              }
                              placeholder="Upload answer image"
                              className="mt-1"
                            />
                          </div>
                          
                          <div>
                            <label className="text-xs font-medium text-text-secondary">Explanation (optional)</label>
                            <textarea
                              value={question.explanation || ''}
                              onChange={(e) =>
                                updateQuestion(
                                  boardNum,
                                  catIndex,
                                  qIndex,
                                  'explanation',
                                  e.target.value
                                )
                              }
                              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm h-16 resize-none mt-1"
                              placeholder="Additional explanation for the answer..."
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Submit Button */}
      <div className="flex justify-center pt-8">
        <Button
          size="lg"
          onClick={handleSubmit}
          disabled={!isValid() || createGameMutation.isPending}
        >
          {createGameMutation.isPending ? 'Creating Game...' : 'Create Game'}
        </Button>
      </div>
    </div>
  )
}