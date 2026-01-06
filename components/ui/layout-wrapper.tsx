'use client'

import { useSession } from 'next-auth/react'
import { Header } from './header'
import { ProfileSetupModal } from '@/components/auth/ProfileSetupModal'
import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const [showProfileSetup, setShowProfileSetup] = useState(false)

  const { data: userProfile } = useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      const res = await fetch('/api/auth/profile')
      if (!res.ok) return null
      return res.json()
    },
    enabled: !!session?.user,
  })

  useEffect(() => {
    if (status === 'authenticated' && userProfile && !userProfile.username) {
      setShowProfileSetup(true)
    }
  }, [status, userProfile])

  if (status === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-pulse text-2xl">Loading...</div>
      </div>
    )
  }

  return (
    <>
      {session && <Header />}
      {children}
      <ProfileSetupModal
        isOpen={showProfileSetup}
        onComplete={() => {
          setShowProfileSetup(false)
          window.location.reload()
        }}
      />
    </>
  )
}