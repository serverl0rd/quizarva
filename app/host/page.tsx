'use client'

import { useState } from 'react'
import { QuizBuilder } from '@/components/game/QuizBuilder'
import { GameDashboard } from '@/components/game/GameDashboard'
import { useQuery } from '@tanstack/react-query'

export default function HostPage() {
  const [activeGameId, setActiveGameId] = useState<string | null>(null)

  // Check for active games
  const { data: activeGames } = useQuery({
    queryKey: ['activeHostGames'],
    queryFn: async () => {
      const res = await fetch('/api/game/host/active')
      if (!res.ok) throw new Error('Failed to fetch active games')
      return res.json()
    },
  })

  if (activeGameId || (activeGames?.length > 0 && !activeGameId)) {
    return (
      <GameDashboard
        gameId={activeGameId || activeGames[0].id}
        onExit={() => setActiveGameId(null)}
      />
    )
  }

  return (
    <div className="min-h-screen bg-bg-light dark:bg-bg-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-text-primary-light dark:text-text-primary-dark mb-8">
          Create a New Game
        </h1>
        <QuizBuilder onGameCreated={setActiveGameId} />
      </div>
    </div>
  )
}