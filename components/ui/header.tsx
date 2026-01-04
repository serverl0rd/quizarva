'use client'

import { useSession, signOut } from 'next-auth/react'
import { useTheme } from 'next-themes'
import { Button } from './button'
import Link from 'next/link'

export function Header() {
  const { data: session } = useSession()
  const { theme, setTheme } = useTheme()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border-light dark:border-border-dark bg-bg-light/95 dark:bg-bg-dark/95 backdrop-blur supports-[backdrop-filter]:bg-bg-light/60 dark:supports-[backdrop-filter]:bg-bg-dark/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center space-x-2">
          <h1 className="text-2xl font-bold text-primary-light dark:text-primary-dark">QuizArva</h1>
        </Link>

        <nav className="flex items-center space-x-4">
          {session && (
            <>
              <span className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                {session.user?.name || session.user?.email}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? '☀️' : '🌙'}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => signOut()}
              >
                Sign Out
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}