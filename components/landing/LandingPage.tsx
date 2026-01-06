'use client'

import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useState } from 'react'

export function LandingPage() {
  const [isHovered, setIsHovered] = useState<number | null>(null)

  const features = [
    {
      title: 'Real-time Multiplayer',
      description: 'Play with up to 3 friends in real-time quiz battles',
      icon: '🎮',
    },
    {
      title: 'Jeopardy Style',
      description: 'Classic quiz format with categories and point values',
      icon: '🎯',
    },
    {
      title: 'Quick Buzzer System',
      description: 'Fast-paced buzzer rounds with instant feedback',
      icon: '⚡',
    },
    {
      title: 'Custom Quizzes',
      description: 'Create and host your own quiz games',
      icon: '✏️',
    },
    {
      title: 'Live Scoring',
      description: 'Track scores in real-time with detailed statistics',
      icon: '📊',
    },
    {
      title: 'Game History',
      description: 'View your performance and track your progress',
      icon: '📈',
    },
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 sm:py-32">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-primary-light to-orange-600 dark:from-primary-dark dark:to-purple-400 bg-clip-text text-transparent">
              QuizArva
            </h1>
            <p className="text-xl sm:text-2xl text-text-secondary-light dark:text-text-secondary-dark mb-8">
              The ultimate real-time multiplayer quiz experience
            </p>
            <p className="text-lg text-text-secondary-light dark:text-text-secondary-dark mb-10 max-w-2xl mx-auto">
              Challenge your friends, test your knowledge, and compete in exciting quiz battles. 
              Create custom quizzes or join games instantly!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/login">
                <Button size="lg" className="w-full sm:w-auto text-lg px-8">
                  Get Started
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="secondary" className="w-full sm:w-auto text-lg px-8">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-1/2 left-10 -translate-y-1/2 text-6xl opacity-10">🎯</div>
        <div className="absolute top-1/3 right-10 text-6xl opacity-10">🏆</div>
        <div className="absolute bottom-1/3 left-1/4 text-6xl opacity-10">💡</div>
        <div className="absolute bottom-1/4 right-1/3 text-6xl opacity-10">🎲</div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-surface-light dark:bg-surface-dark">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12">
            Everything you need for the perfect quiz game
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                onMouseEnter={() => setIsHovered(index)}
                onMouseLeave={() => setIsHovered(null)}
                className="bg-bg-light dark:bg-bg-dark p-6 rounded-xl border border-border-light dark:border-border-dark hover:border-primary-light dark:hover:border-primary-dark transition-all duration-300 hover:shadow-lg"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-text-secondary-light dark:text-text-secondary-dark">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12">
            How it works
          </h2>
          <div className="max-w-4xl mx-auto">
            <div className="space-y-8">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-primary-light dark:bg-primary-dark text-white rounded-full flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Create or Join a Game</h3>
                  <p className="text-text-secondary-light dark:text-text-secondary-dark">
                    Start a new quiz game as a host or join an existing game with a password
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-primary-light dark:bg-primary-dark text-white rounded-full flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Build Your Quiz</h3>
                  <p className="text-text-secondary-light dark:text-text-secondary-dark">
                    Create categories and questions, or import from existing templates
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-primary-light dark:bg-primary-dark text-white rounded-full flex items-center justify-center font-bold">
                  3
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Play and Compete</h3>
                  <p className="text-text-secondary-light dark:text-text-secondary-dark">
                    Players buzz in, answer questions, and compete for the highest score
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-primary-light dark:bg-primary-dark text-white rounded-full flex items-center justify-center font-bold">
                  4
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Track Your Progress</h3>
                  <p className="text-text-secondary-light dark:text-text-secondary-dark">
                    View detailed statistics, game history, and improve your performance
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-surface-light dark:bg-surface-dark">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Ready to start your quiz journey?
          </h2>
          <p className="text-lg text-text-secondary-light dark:text-text-secondary-dark mb-8">
            Join thousands of quiz enthusiasts and start playing today
          </p>
          <Link href="/login">
            <Button size="lg" className="text-lg px-8">
              Create Your First Quiz
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}