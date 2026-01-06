'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'

export default function PlayerPage() {
  const router = useRouter()
  const [gameId, setGameId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const joinGameMutation = useMutation({
    mutationFn: async ({ gameId, password }: { gameId: string; password: string }) => {
      const res = await fetch('/api/game/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId, password }),
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to join game')
      }
      
      return data
    },
    onSuccess: (data) => {
      router.push(`/player/game/${data.gameId}`)
    },
    onError: (err: Error) => {
      setError(err.message)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (!gameId || !password) {
      setError('Please enter both Game ID and password')
      return
    }
    
    joinGameMutation.mutate({ gameId, password })
  }

  return (
    <div className="flex-1 bg-bg-light dark:bg-bg-dark flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-text-primary-light dark:text-text-primary-dark">Join a Game</h1>
          <p className="text-text-secondary-light dark:text-text-secondary-dark mt-2">
            Enter the Game ID and password from your host
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="gameId" className="block text-sm font-medium mb-2">
              Game ID
            </label>
            <input
              id="gameId"
              type="text"
              value={gameId}
              onChange={(e) => setGameId(e.target.value.toUpperCase())}
              className="w-full rounded-md border border-border-light dark:border-border-dark bg-bg-light dark:bg-bg-dark px-3 py-2 text-text-primary-light dark:text-text-primary-dark uppercase font-mono text-lg"
              placeholder="Enter Game ID"
              disabled={joinGameMutation.isPending}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-border-light dark:border-border-dark bg-bg-light dark:bg-bg-dark px-3 py-2 text-text-primary-light dark:text-text-primary-dark"
              placeholder="Enter password"
              disabled={joinGameMutation.isPending}
            />
          </div>

          {error && (
            <div className="rounded-md bg-error/10 border border-error/20 p-3">
              <p className="text-sm text-error">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={joinGameMutation.isPending}
          >
            {joinGameMutation.isPending ? 'Joining...' : 'Join Game'}
          </Button>
        </form>

        <div className="mt-8 text-center">
          <Button
            variant="ghost"
            onClick={() => router.push('/')}
            className="text-text-secondary-light dark:text-text-secondary-dark"
          >
            ← Back to Home
          </Button>
        </div>
      </div>
    </div>
  )
}