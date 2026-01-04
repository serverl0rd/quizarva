import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'QuizArva - Multiplayer Quiz Game',
  description: 'Real-time multiplayer quiz game with Jeopardy-style gameplay',
  manifest: '/manifest.json',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-bg-light dark:bg-bg-dark text-text-primary-light dark:text-text-primary-dark`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}