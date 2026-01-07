'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function ProfileError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to console in development
    console.error('Profile page error:', error)
  }, [error])

  return (
    <div className="flex-1 bg-white dark:bg-black flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <h2 className="text-2xl font-bold mb-4">Something went wrong!</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          We couldn't load your profile. This might be a temporary issue.
        </p>
        <div className="space-y-3">
          <Button onClick={reset} className="w-full">
            Try again
          </Button>
          <Button 
            variant="secondary" 
            onClick={() => window.location.href = '/'}
            className="w-full"
          >
            Go to Home
          </Button>
        </div>
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-6 text-left">
            <summary className="cursor-pointer text-sm text-gray-500">
              Error details (development only)
            </summary>
            <pre className="mt-2 text-xs bg-gray-100 dark:bg-gray-900 p-3 rounded overflow-auto">
              {error.message}
            </pre>
          </details>
        )}
      </div>
    </div>
  )
}