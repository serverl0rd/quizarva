'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useMutation } from '@tanstack/react-query'

interface ProfileSetupModalProps {
  isOpen: boolean
  onComplete: () => void
}

export function ProfileSetupModal({ isOpen, onComplete }: ProfileSetupModalProps) {
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')

  const mutation = useMutation({
    mutationFn: async (username: string) => {
      const res = await fetch('/api/auth/setup-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to set username')
      }
      return res.json()
    },
    onSuccess: () => {
      onComplete()
    },
    onError: (err: Error) => {
      setError(err.message)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (username.trim().length < 3) {
      setError('Username must be at least 3 characters')
      return
    }
    mutation.mutate(username)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg bg-surface-light dark:bg-surface-dark p-6 shadow-lg">
        <h2 className="mb-4 text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">
          Welcome to QuizArva!
        </h2>
        <p className="mb-6 text-text-secondary-light dark:text-text-secondary-dark">
          Please choose a username to get started.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="username"
              className="mb-2 block text-sm font-medium text-text-primary-light dark:text-text-primary-dark"
            >
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value)
                setError('')
              }}
              className="w-full rounded-md border border-border-light dark:border-border-dark bg-bg-light dark:bg-bg-dark px-3 py-2 text-text-primary-light dark:text-text-primary-dark placeholder-text-text-secondary-light dark:placeholder-text-text-secondary-dark focus:border-primary-light dark:focus:border-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-light/20 dark:focus:ring-primary-dark/20"
              placeholder="Enter your username"
              disabled={mutation.isPending}
            />
            {error && (
              <p className="mt-2 text-sm text-error">{error}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? 'Setting up...' : 'Continue'}
          </Button>
        </form>
      </div>
    </div>
  )
}