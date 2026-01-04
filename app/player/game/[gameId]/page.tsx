'use client'

import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { usePlayerGameSSE } from '@/hooks/useGameSSE'
import { LiveScoreboard } from '@/components/game/gameplay/LiveScoreboard'
import { BuzzButton } from '@/components/game/gameplay/BuzzButton'
import { QuestionSelection } from '@/components/game/gameplay/QuestionSelection'
import { QuestionDisplay } from '@/components/game/gameplay/QuestionDisplay'
import { SafetySlide } from '@/components/game/gameplay/SafetySlide'
import { BuzzQueue } from '@/components/game/gameplay/BuzzQueue'
import { AnswerSubmission } from '@/components/game/gameplay/AnswerSubmission'
import { Button } from '@/components/ui/button'
import { useState, useEffect } from 'react'

export default function PlayerGamePage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { data: session } = useSession()
  const gameId = params.gameId as string
  
  const [gamePhase, setGamePhase] = useState<string>('waiting')
  const [currentQuestion, setCurrentQuestion] = useState<any>(null)
  const [showAnswer, setShowAnswer] = useState(false)
  const [canBuzz, setCanBuzz] = useState(false)
  const [isCurrentSelector, setIsCurrentSelector] = useState(false)
  const [isFirstBuzzer, setIsFirstBuzzer] = useState(false)

  // SSE connection for real-time updates
  const { isConnected } = usePlayerGameSSE(gameId)

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

  // Fetch current player data
  const { data: currentPlayer } = useQuery({
    queryKey: ['currentPlayer', gameId],
    queryFn: async () => {
      if (!game || !session?.user?.email) return null
      return game.players.find((p: any) => p.user?.email === session.user?.email)
    },
    enabled: !!game && !!session,
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

  useEffect(() => {
    if (gameState?.phase) {
      setGamePhase(gameState.phase)
      
      // Enable buzzing only during buzzing phase and if not in tiebreaker
      if (gameState.phase === 'buzzing') {
        if (gameState.isTiebreaker) {
          // During tiebreaker, only tied players can buzz
          const tiedPlayers = gameState.tiedPlayers || []
          setCanBuzz(tiedPlayers.includes(currentPlayer?.id))
        } else {
          setCanBuzz(true)
        }
      } else {
        setCanBuzz(false)
      }
      
      // Check if this player is the first buzzer
      if (buzzQueue && buzzQueue.length > 0 && buzzQueue[0].playerId === currentPlayer?.id) {
        setIsFirstBuzzer(true)
      } else {
        setIsFirstBuzzer(false)
      }
    }
    
    if (gameState?.currentQuestion) {
      setCurrentQuestion(gameState.currentQuestion)
    }
    
    // Check if current player is the selector
    setIsCurrentSelector(game?.currentSelector === currentPlayer?.id)
  }, [gameState, game, currentPlayer, buzzQueue])

  const handleExitGame = () => {
    router.push('/player')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-light dark:bg-bg-dark flex items-center justify-center">
        <p className="text-xl">Loading game...</p>
      </div>
    )
  }

  if (!game) {
    return (
      <div className="min-h-screen bg-bg-light dark:bg-bg-dark flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl mb-4">Game not found</p>
          <Button onClick={handleExitGame}>Back to Join</Button>
        </div>
      </div>
    )
  }

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

  const isInTiebreaker = gameState?.isTiebreaker || false
  const isEligibleForTiebreaker = isInTiebreaker && (gameState?.tiedPlayers || []).includes(currentPlayer?.id)

  return (
    <div className="min-h-screen bg-bg-light dark:bg-bg-dark portrait:block landscape:hidden">
      {/* Force portrait orientation message for landscape */}
      <div className="hidden landscape:flex min-h-screen items-center justify-center p-8">
        <div className="text-center">
          <p className="text-2xl font-bold mb-4">Please rotate your device</p>
          <p className="text-text-secondary-light dark:text-text-secondary-dark">QuizArva is best played in portrait mode</p>
        </div>
      </div>

      {/* Main game interface (portrait only) */}
      <div className="portrait:block">
        {/* Header */}
        <div className="bg-surface-light dark:bg-surface-dark border-b border-border-light dark:border-border-dark p-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">QuizArva</h1>
            <div className="text-right">
              <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
              </p>
              <p className="text-sm font-mono">{gameId}</p>
            </div>
          </div>
        </div>

        {/* Game Status */}
        {game.status === 'WAITING' && (
          <div className="flex flex-col items-center justify-center min-h-[80vh] p-8">
            <h2 className="text-2xl font-bold mb-4">Waiting for game to start...</h2>
            <p className="text-text-secondary-light dark:text-text-secondary-dark mb-8">
              Players joined: {game.players.length}/3
            </p>
            <div className="space-y-2 w-full max-w-xs">
              {game.players.map((p: any) => (
                <div key={p.id} className="bg-surface-light dark:bg-surface-dark rounded-lg p-3 border border-border-light dark:border-border-dark">
                  <p className="font-medium">
                    {p.user?.name || p.username}
                    {p.userId === currentPlayer?.userId && ' (You)'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Active Game */}
        {game.status === 'IN_PROGRESS' && (
          <>
            {/* Scoreboard */}
            <div className="p-4">
              <LiveScoreboard
                players={scoreboardPlayers}
                currentPlayerId={currentPlayer?.userId}
                showAnimations={true}
              />
            </div>

            {/* Tiebreaker Banner */}
            {isInTiebreaker && (
              <div className="bg-warning text-white p-3 text-center font-bold">
                SUDDEN DEATH TIEBREAKER
                {!isEligibleForTiebreaker && ' - You are not in the tiebreaker'}
              </div>
            )}

            {/* Game Content */}
            <div className="flex-1 p-4">
              {/* Question Selection (when current selector) */}
              {gamePhase === 'selection' && isCurrentSelector && (
                <QuestionSelection
                  gameId={gameId}
                  boards={game.boards || []}
                  currentBoard={game.currentBoard || 1}
                  isCurrentSelector={true}
                  currentSelectorName="You"
                />
              )}

              {/* Waiting for selection (when not current selector) */}
              {gamePhase === 'selection' && !isCurrentSelector && (
                <div className="flex items-center justify-center min-h-[50vh]">
                  <div className="text-center">
                    <p className="text-xl mb-2">Waiting for question selection...</p>
                    <p className="text-text-secondary-light dark:text-text-secondary-dark">
                      {scoreboardPlayers.find((p: any) => p.isCurrentSelector)?.username || 'Host'} is selecting
                    </p>
                  </div>
                </div>
              )}

              {/* Question Display */}
              {(gamePhase === 'question' || gamePhase === 'buzzing') && currentQuestion && (
                <div className="mb-4">
                  <QuestionDisplay
                    category={currentQuestion.categoryName}
                    value={currentQuestion.value}
                    questionText={currentQuestion.questionText}
                    questionImageUrl={currentQuestion.questionImageUrl}
                    showAnswer={false}
                  />
                </div>
              )}

              {/* Buzz Button or Answer Submission */}
              {gamePhase === 'buzzing' && (
                <>
                  {isFirstBuzzer ? (
                    <AnswerSubmission
                      gameId={gameId}
                      playerId={currentPlayer?.id}
                      questionValue={currentQuestion?.value || 0}
                    />
                  ) : (
                    <>
                      <BuzzButton
                        gameId={gameId}
                        playerId={currentPlayer?.id}
                        isEnabled={canBuzz}
                        isTiebreaker={isInTiebreaker}
                        isEligibleForTiebreaker={isEligibleForTiebreaker}
                      />
                      {buzzQueue && buzzQueue.length > 0 && (
                        <div className="mt-4">
                          <BuzzQueue queue={buzzQueue} currentPlayerId={currentPlayer?.id} />
                        </div>
                      )}
                    </>
                  )}
                </>
              )}

              {/* Safety Slide */}
              {gamePhase === 'safety' && (
                <>
                  {isFirstBuzzer ? (
                    <AnswerSubmission
                      gameId={gameId}
                      playerId={currentPlayer?.id}
                      questionValue={currentQuestion?.value || 0}
                    />
                  ) : (
                    <SafetySlide
                      isVisible={true}
                      hostName={game.host?.name}
                      currentQuestion={currentQuestion ? {
                        category: currentQuestion.categoryName,
                        value: currentQuestion.value,
                      } : undefined}
                      isHost={false}
                    />
                  )}
                </>
              )}

              {/* Answer Display */}
              {gamePhase === 'answer' && currentQuestion && (
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
              )}
            </div>

            {/* Exit Button */}
            <div className="p-4">
              <Button
                variant="secondary"
                onClick={handleExitGame}
                className="w-full"
              >
                Exit Game
              </Button>
            </div>
          </>
        )}

        {/* Game Completed */}
        {game.status === 'COMPLETED' && (
          <div className="flex flex-col items-center justify-center min-h-[80vh] p-8">
            <h2 className="text-3xl font-bold mb-4">Game Over!</h2>
            {game.winnerId && (
              <p className="text-xl mb-8">
                Winner: {scoreboardPlayers.find((p: any) => p.id === game.winnerId)?.username || 'Unknown'}
              </p>
            )}
            <LiveScoreboard
              players={scoreboardPlayers}
              currentPlayerId={currentPlayer?.userId}
              showAnimations={false}
            />
            <Button onClick={handleExitGame} className="mt-8">
              Back to Join
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}