'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { useState, useEffect } from 'react'
import { GamePlayer } from '@/types/game'
import { useGameSSE } from '@/hooks/useGameSSE'
import { LiveScoreboard } from './gameplay/LiveScoreboard'
import { QuestionSelection } from './gameplay/QuestionSelection'
import { QuestionDisplay } from './gameplay/QuestionDisplay'
import { SafetySlide } from './gameplay/SafetySlide'
import { HostOverridePanel } from './gameplay/HostOverridePanel'
import { BuzzQueue } from './gameplay/BuzzQueue'
import { AnswerEvaluation } from './gameplay/AnswerEvaluation'
import { TiebreakerQuestionSelect } from './gameplay/TiebreakerQuestionSelect'
import { AuditLogViewer } from './AuditLogViewer'

interface GameDashboardProps {
  gameId: string
  onExit: () => void
}

export function GameDashboard({ gameId, onExit }: GameDashboardProps) {
  const queryClient = useQueryClient()
  const [readyCheck, setReadyCheck] = useState(false)
  const [gamePhase, setGamePhase] = useState<string>('waiting')
  const [currentQuestion, setCurrentQuestion] = useState<any>(null)
  const [showAnswer, setShowAnswer] = useState(false)
  const [showAnswerEvaluation, setShowAnswerEvaluation] = useState(false)
  const [isTiebreaker, setIsTiebreaker] = useState(false)
  const [tiedPlayers, setTiedPlayers] = useState<any[]>([])

  // SSE connection for real-time updates
  const { isConnected } = useGameSSE({
    gameId,
    onEvent: (event) => {
      if (event.type === 'game-update') {
        queryClient.invalidateQueries({ queryKey: ['game', gameId] })
      } else if (event.type === 'phase-change') {
        setGamePhase(event.data?.phase || 'waiting')
        if (event.data?.phase === 'selection') {
          setCurrentQuestion(null)
          setShowAnswer(false)
          setShowAnswerEvaluation(false)
        } else if (event.data?.phase === 'safety') {
          setShowAnswerEvaluation(true)
        }
      } else if (event.type === 'question-selected') {
        queryClient.invalidateQueries({ queryKey: ['game', gameId] })
      } else if (event.type === 'answer-submitted') {
        // Refresh buzz queue to get latest answer status
        queryClient.invalidateQueries({ queryKey: ['buzzQueue', gameId] })
      } else if (event.type === 'game-end') {
        // Game has ended - refresh to show winner
        queryClient.invalidateQueries({ queryKey: ['game', gameId] })
        setGamePhase('completed')
      } else if (event.type === 'tiebreaker-start') {
        // Tiebreaker mode activated
        setIsTiebreaker(true)
        setGamePhase('tiebreaker')
        setTiedPlayers(event.data?.tiedPlayers || [])
        queryClient.invalidateQueries({ queryKey: ['unaskedQuestions', gameId] })
      }
    },
  })

  // Fetch game details
  const { data: game, isLoading } = useQuery({
    queryKey: ['game', gameId],
    queryFn: async () => {
      const res = await fetch(`/api/game/${gameId}`)
      if (!res.ok) throw new Error('Failed to fetch game')
      return res.json()
    },
    refetchInterval: gamePhase === 'waiting' ? 2000 : false,
  })

  // Fetch game state from Redis
  const { data: gameState } = useQuery({
    queryKey: ['gameState', gameId],
    queryFn: async () => {
      const res = await fetch(`/api/game/${gameId}/state`)
      if (!res.ok) return null
      return res.json()
    },
    enabled: game?.status === 'IN_PROGRESS',
    refetchInterval: 1000,
  })

  // Fetch buzz queue
  const { data: buzzQueue } = useQuery({
    queryKey: ['buzzQueue', gameId],
    queryFn: async () => {
      const res = await fetch(`/api/game/${gameId}/buzz-queue`)
      if (!res.ok) return []
      return res.json()
    },
    enabled: gamePhase === 'buzzing',
  })

  // Fetch unasked questions for tiebreaker
  const { data: unaskedQuestions } = useQuery({
    queryKey: ['unaskedQuestions', gameId],
    queryFn: async () => {
      const res = await fetch(`/api/game/${gameId}/unasked-questions`)
      if (!res.ok) return { questions: [] }
      return res.json()
    },
    enabled: isTiebreaker,
  })

  // Phase transition mutation
  const phaseTransitionMutation = useMutation({
    mutationFn: async (toPhase: string) => {
      const res = await fetch('/api/game/phase/transition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId, toPhase }),
      })
      if (!res.ok) throw new Error('Failed to transition phase')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['game', gameId] })
    },
  })

  // Start game mutation
  const startGameMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/game/${gameId}/start`, {
        method: 'POST',
      })
      if (!res.ok) throw new Error('Failed to start game')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['game', gameId] })
      setGamePhase('selection')
    },
  })

  useEffect(() => {
    if (gameState?.phase) {
      setGamePhase(gameState.phase)
    }
    if (gameState?.currentQuestion) {
      setCurrentQuestion(gameState.currentQuestion)
    }
  }, [gameState])

  const handleStartGame = async () => {
    await startGameMutation.mutateAsync()
  }

  const handleContinueFromSafety = () => {
    phaseTransitionMutation.mutate('answer')
    setShowAnswer(true)
  }

  const handleContinueFromAnswer = () => {
    phaseTransitionMutation.mutate('selection')
  }

  const handleQuestionSelected = () => {
    phaseTransitionMutation.mutate('question')
    setTimeout(() => {
      phaseTransitionMutation.mutate('buzzing')
    }, 5000) // Show question for 5 seconds before allowing buzzes
  }

  const handleExport = async (format: 'csv' | 'json') => {
    try {
      const response = await fetch(`/api/game/export/${gameId}?format=${format}`)
      if (!response.ok) throw new Error('Export failed')
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `quizarva-game-${gameId}.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Export error:', error)
    }
  }

  if (isLoading) {
    return <div className="p-8 text-center">Loading game...</div>
  }

  if (!game) {
    return <div className="p-8 text-center">Game not found</div>
  }

  const isGameFull = game.players.length === 3
  const allPlayersReady = readyCheck && game.players.every((p: GamePlayer) => p.isActive)

  // Transform players for scoreboard
  const scoreboardPlayers = game.players.map((p: any) => ({
    id: p.id,
    userId: p.userId,
    username: p.user?.name || p.username || 'Unknown',
    board1Score: p.board1Score || 0,
    board2Score: p.board2Score || 0,
    totalScore: p.totalScore || 0,
    isCurrentSelector: p.id === game.currentSelector,
  }))

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Game Info Header */}
        <div className="mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-text-primary">
                QuizArva Host Dashboard
              </h1>
              <p className="text-sm text-text-secondary mt-1">
                {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-text-secondary">Game ID</p>
              <p className="text-2xl font-mono font-bold text-primary">{gameId}</p>
              <p className="text-sm text-text-secondary mt-1">Password: {game.password}</p>
            </div>
          </div>
        </div>

        {/* Waiting Room */}
        {game.status === 'WAITING' && (
          <>
            <div className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Players ({game.players.length}/3)</h2>
              <div className="grid md:grid-cols-3 gap-4">
                {[...Array(3)].map((_, index) => {
                  const player = game.players[index]
                  return (
                    <div
                      key={index}
                      className={`bg-surface rounded-lg p-6 border-2 ${
                        player ? 'border-success' : 'border-border border-dashed'
                      }`}
                    >
                      {player ? (
                        <>
                          <p className="font-semibold text-lg">{player.user?.name || player.username}</p>
                          <p className="text-sm text-text-secondary">
                            Status: {player.isActive ? 'Connected' : 'Disconnected'}
                          </p>
                        </>
                      ) : (
                        <p className="text-text-secondary">Waiting for player...</p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="space-y-4">
              {isGameFull && (
                <Button 
                  onClick={handleStartGame} 
                  size="lg" 
                  className="w-full"
                  disabled={startGameMutation.isPending}
                >
                  {startGameMutation.isPending ? 'Starting...' : 'Start Game'}
                </Button>
              )}
              
              {!isGameFull && (
                <div className="bg-surface border border-border rounded-lg p-4 text-center">
                  Waiting for {3 - game.players.length} more player{3 - game.players.length > 1 ? 's' : ''}...
                </div>
              )}
            </div>
          </>
        )}

        {/* Active Game */}
        {game.status === 'IN_PROGRESS' && (
          <div className="space-y-6">
            {/* Live Scoreboard */}
            <LiveScoreboard
              players={scoreboardPlayers}
              hostName={game.host?.name}
              showAnimations={true}
            />

            {/* Game Content Area */}
            <div className="bg-surface rounded-lg p-6 border border-border min-h-[400px]">
              {gamePhase === 'tiebreaker' && (
                <TiebreakerQuestionSelect
                  gameId={gameId}
                  tiedPlayers={scoreboardPlayers
                    .filter((p: any) => tiedPlayers.includes(p.id))
                    .map((p: any) => ({ 
                      id: p.id, 
                      username: p.username, 
                      totalScore: p.totalScore 
                    }))}
                  remainingQuestions={unaskedQuestions?.questions || []}
                  onQuestionSelected={() => {
                    setGamePhase('question')
                    queryClient.invalidateQueries({ queryKey: ['game', gameId] })
                  }}
                />
              )}
              
              {gamePhase === 'selection' && (
                <QuestionSelection
                  gameId={gameId}
                  boards={game.boards || []}
                  currentBoard={game.currentBoard || 1}
                  isCurrentSelector={!game.currentSelector} // Host can select if no current selector
                  currentSelectorName={
                    scoreboardPlayers.find((p: any) => p.isCurrentSelector)?.username || 'Host'
                  }
                  onQuestionSelect={handleQuestionSelected}
                />
              )}

              {(gamePhase === 'question' || gamePhase === 'buzzing') && currentQuestion && (
                <>
                  <QuestionDisplay
                    category={currentQuestion.categoryName}
                    value={currentQuestion.value}
                    questionText={currentQuestion.questionText}
                    questionImageUrl={currentQuestion.questionImageUrl}
                    showAnswer={false}
                  />
                  {gamePhase === 'buzzing' && buzzQueue && buzzQueue.length > 0 && (
                    <div className="mt-4 max-w-md mx-auto">
                      <BuzzQueue queue={buzzQueue} />
                    </div>
                  )}
                </>
              )}

              {gamePhase === 'safety' && (
                <>
                  {buzzQueue && buzzQueue.length > 0 && !showAnswerEvaluation ? (
                    <>
                      <AnswerEvaluation
                        gameId={gameId}
                        currentQuestion={currentQuestion}
                        buzzedPlayer={{
                          id: buzzQueue[0].playerId,
                          name: buzzQueue[0].playerName || 'Unknown',
                        }}
                        onEvaluated={(correct) => {
                          setShowAnswerEvaluation(false)
                          // The evaluate endpoint handles phase transition
                        }}
                      />
                      <div className="mt-4">
                        <Button
                          onClick={() => phaseTransitionMutation.mutate('answer')}
                          variant="secondary"
                          className="w-full"
                        >
                          Skip to Answer Reveal
                        </Button>
                      </div>
                    </>
                  ) : (
                    <SafetySlide
                      isVisible={true}
                      hostName={game.host?.name}
                      currentQuestion={currentQuestion ? {
                        category: currentQuestion.categoryName,
                        value: currentQuestion.value,
                      } : undefined}
                      onContinue={handleContinueFromSafety}
                      isHost={true}
                    />
                  )}
                </>
              )}

              {(gamePhase === 'answer' || showAnswer) && currentQuestion && (
                <>
                  <QuestionDisplay
                    category={currentQuestion.categoryName}
                    value={currentQuestion.value}
                    questionText={currentQuestion.questionText}
                    questionImageUrl={currentQuestion.questionImageUrl}
                    showAnswer={true}
                    answer={currentQuestion.answer}
                    answerImageUrl={currentQuestion.answerImageUrl}
                    explanation={currentQuestion.explanation}
                  />
                  <div className="mt-6 text-center">
                    <Button
                      onClick={handleContinueFromAnswer}
                      size="lg"
                    >
                      Continue to Next Question
                    </Button>
                  </div>
                </>
              )}
            </div>

            {/* Host Override Panel */}
            {(gamePhase === 'buzzing' || gamePhase === 'safety') && (
              <HostOverridePanel
                gameId={gameId}
                players={scoreboardPlayers}
                currentQuestionValue={currentQuestion?.value}
              />
            )}
            
            {/* Audit Log Viewer */}
            <AuditLogViewer gameId={gameId} />
          </div>
        )}

        {/* Game Completed */}
        {game.status === 'COMPLETED' && (
          <div className="space-y-6">
            <div className="bg-surface rounded-lg p-8 border border-border text-center">
              <h2 className="text-3xl font-bold mb-4">Game Over!</h2>
              {game.winnerId && (
                <>
                  <p className="text-xl mb-2">Winner</p>
                  <p className="text-3xl font-bold text-primary-light dark:text-primary-dark mb-6">
                    {scoreboardPlayers.find((p: any) => p.id === game.winnerId)?.username || 'Unknown'}
                  </p>
                </>
              )}
              
              {/* Final Scoreboard */}
              <div className="mt-8 mb-8">
                <h3 className="text-lg font-semibold mb-4">Final Scores</h3>
                <LiveScoreboard
                  players={scoreboardPlayers}
                  hostName={game.host?.name}
                  showAnimations={false}
                />
              </div>

              {/* Export Options */}
              <div className="flex gap-4 justify-center mt-6">
                <Button 
                  variant="secondary" 
                  className="flex items-center gap-2"
                  onClick={() => handleExport('csv')}
                >
                  <span>📊</span> Export as CSV
                </Button>
                <Button 
                  variant="secondary" 
                  className="flex items-center gap-2"
                  onClick={() => handleExport('json')}
                >
                  <span>📋</span> Export as JSON
                </Button>
                <Button 
                  variant="secondary" 
                  className="flex items-center gap-2"
                  onClick={() => window.print()}
                >
                  <span>🖨️</span> Print Results
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Exit Button */}
        <div className="mt-8">
          <Button variant="secondary" onClick={onExit} className="w-full">
            {game.status === 'COMPLETED' ? 'Back to Host Dashboard' : 'Exit Dashboard'}
          </Button>
        </div>
      </div>
    </div>
  )
}