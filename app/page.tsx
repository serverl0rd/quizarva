'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function HomePage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-2xl text-text-primary">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-text-primary mb-4">QuizArva</h1>
          <p className="text-xl text-text-secondary mb-12">
            Real-time multiplayer quiz game
          </p>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
            <button
              onClick={() => router.push('/host')}
              className="p-8 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
            >
              <h2 className="text-2xl font-semibold mb-2">Host a Game</h2>
              <p>Create and manage a quiz session</p>
            </button>
            
            <button
              onClick={() => router.push('/player')}
              className="p-8 bg-surface border-2 border-border text-text-primary rounded-lg hover:border-primary transition-colors"
            >
              <h2 className="text-2xl font-semibold mb-2">Join as Player</h2>
              <p>Enter a game with Game ID</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}