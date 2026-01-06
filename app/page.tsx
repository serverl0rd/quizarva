'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { LandingPage } from '@/components/landing/LandingPage'
import { Header } from '@/components/ui/header'

export default function HomePage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-light dark:bg-bg-dark">
        <div className="animate-pulse text-2xl text-text-primary-light dark:text-text-primary-dark">Loading...</div>
      </div>
    )
  }

  // Show landing page for non-authenticated users
  if (status === 'unauthenticated') {
    return <LandingPage />
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-bg-light dark:bg-bg-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-5xl font-bold text-text-primary-light dark:text-text-primary-dark mb-4">QuizArva</h1>
            <p className="text-xl text-text-secondary-light dark:text-text-secondary-dark mb-12">
              Real-time multiplayer quiz game
            </p>
            
            <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
              <button
                onClick={() => router.push('/host')}
                className="p-8 bg-primary-light dark:bg-primary-dark text-white rounded-lg hover:bg-primary-light-hover dark:hover:bg-primary-dark-hover transition-colors"
              >
                <h2 className="text-2xl font-semibold mb-2">Host a Game</h2>
                <p>Create and manage a quiz session</p>
              </button>
              
              <button
                onClick={() => router.push('/player')}
                className="p-8 bg-surface-light dark:bg-surface-dark border-2 border-border-light dark:border-border-dark text-text-primary-light dark:text-text-primary-dark rounded-lg hover:border-primary-light dark:hover:border-primary-dark transition-colors"
              >
                <h2 className="text-2xl font-semibold mb-2">Join as Player</h2>
                <p>Enter a game with Game ID</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}