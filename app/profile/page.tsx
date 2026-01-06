'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ImageUpload } from '@/components/ui/image-upload'

interface ProfileData {
  id: string
  email: string
  name: string | null
  username: string | null
  profilePhoto: string | null
  bio: string | null
  createdAt: string
  _count: {
    hostedGames: number
    playerGames: number
  }
}

interface GameHistoryItem {
  id: string
  gameName: string | null
  role: string
  board1Score: number
  board2Score: number
  totalScore: number
  position: number
  totalPlayers: number
  questionsAnswered: number
  correctAnswers: number
  incorrectAnswers: number
  buzzesWon: number
  buzzesLost: number
  playedAt: string
  duration: number | null
  isWinner: boolean
}

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [gameHistory, setGameHistory] = useState<GameHistoryItem[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    name: '',
    username: '',
    bio: '',
    profilePhoto: ''
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      redirect('/login')
    }
    fetchProfile()
    fetchGameHistory()
  }, [session, status])

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/auth/profile')
      if (response.ok) {
        const data = await response.json()
        setProfile(data)
        setEditForm({
          name: data.name || '',
          username: data.username || '',
          bio: data.bio || '',
          profilePhoto: data.profilePhoto || ''
        })
      } else {
        const error = await response.json()
        console.error('Profile fetch failed:', error)
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchGameHistory = async () => {
    try {
      const response = await fetch('/api/game/history')
      if (response.ok) {
        const data = await response.json()
        setGameHistory(data)
      }
    } catch (error) {
      console.error('Error fetching game history:', error)
    }
  }

  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      })
      
      if (response.ok) {
        const updatedProfile = await response.json()
        setProfile(updatedProfile)
        setIsEditing(false)
      } else {
        alert('Failed to update profile')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Error updating profile')
    } finally {
      setSaving(false)
    }
  }

  const handleImageUpload = (url: string) => {
    setEditForm(prev => ({ ...prev, profilePhoto: url }))
  }

  if (loading) {
    return (
      <div className="flex-1 bg-white dark:bg-black flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">Loading profile...</div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex-1 bg-white dark:bg-black flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">Profile not found</div>
      </div>
    )
  }

  const stats = {
    totalGames: gameHistory.length,
    gamesWon: gameHistory.filter(g => g.isWinner).length,
    avgScore: gameHistory.length > 0 
      ? Math.round(gameHistory.reduce((sum, g) => sum + g.totalScore, 0) / gameHistory.length)
      : 0,
    totalQuestions: gameHistory.reduce((sum, g) => sum + g.questionsAnswered, 0),
    accuracy: gameHistory.reduce((sum, g) => sum + g.questionsAnswered, 0) > 0
      ? Math.round((gameHistory.reduce((sum, g) => sum + g.correctAnswers, 0) / 
          gameHistory.reduce((sum, g) => sum + g.questionsAnswered, 0)) * 100)
      : 0
  }

  return (
    <div className="flex-1 bg-white dark:bg-black py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Profile Header */}
        <Card className="p-8 mb-8">
          <div className="flex flex-col md:flex-row items-start gap-8">
            {/* Profile Photo */}
            <div className="relative">
              {isEditing ? (
                <ImageUpload
                  value={editForm.profilePhoto}
                  onChange={handleImageUpload}
                  currentImage={profile.profilePhoto || ''}
                  variant="circle"
                  className="w-32 h-32"
                  placeholder="Upload photo"
                />
              ) : (
                <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-800">
                  {profile.profilePhoto ? (
                    <Image
                      src={profile.profilePhoto}
                      alt={profile.name || 'Profile'}
                      width={128}
                      height={128}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl text-gray-500">
                      {profile.name?.charAt(0).toUpperCase() || '?'}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1 w-full">
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Name</label>
                    <Input
                      value={editForm.name}
                      onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Username</label>
                    <Input
                      value={editForm.username}
                      onChange={(e) => setEditForm(prev => ({ ...prev, username: e.target.value }))}
                      placeholder="Choose a unique username"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Bio</label>
                    <textarea
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-md bg-white dark:bg-black"
                      rows={3}
                      value={editForm.bio}
                      onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                      placeholder="Tell us about yourself..."
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleSaveProfile} disabled={saving}>
                      {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button 
                      variant="secondary" 
                      onClick={() => {
                        setIsEditing(false)
                        setEditForm({
                          name: profile.name || '',
                          username: profile.username || '',
                          bio: profile.bio || '',
                          profilePhoto: profile.profilePhoto || ''
                        })
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h1 className="text-3xl font-bold">{profile.name || 'Unnamed User'}</h1>
                      {profile.username && (
                        <p className="text-gray-600 dark:text-gray-400">@{profile.username}</p>
                      )}
                      <p className="text-sm text-gray-500 mt-1">{profile.email}</p>
                    </div>
                    <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
                  </div>
                  {profile.bio && (
                    <p className="text-gray-700 dark:text-gray-300 mb-4">{profile.bio}</p>
                  )}
                  <div className="text-sm text-gray-500">
                    Member since {new Date(profile.createdAt).toLocaleDateString()}
                  </div>
                </>
              )}
            </div>
          </div>
        </Card>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold">{stats.totalGames}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Games</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold">{stats.gamesWon}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Games Won</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold">{stats.avgScore}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Avg Score</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold">{stats.totalQuestions}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Questions</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold">{stats.accuracy}%</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Accuracy</div>
          </Card>
        </div>

        {/* Game History */}
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-6">Game History</h2>
          {gameHistory.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400 text-center py-8">
              No games played yet. Join or host a game to get started!
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b dark:border-gray-800">
                    <th className="text-left py-3 px-2">Game</th>
                    <th className="text-center py-3 px-2">Role</th>
                    <th className="text-center py-3 px-2">Score</th>
                    <th className="text-center py-3 px-2">Position</th>
                    <th className="text-center py-3 px-2">Accuracy</th>
                    <th className="text-center py-3 px-2">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {gameHistory.map((game) => (
                    <tr key={game.id} className="border-b dark:border-gray-800">
                      <td className="py-3 px-2">
                        <div>
                          <div className="font-medium">{game.gameName || 'Untitled Game'}</div>
                          <div className="text-sm text-gray-500">
                            {game.duration ? `${game.duration} min` : 'Quick game'}
                          </div>
                        </div>
                      </td>
                      <td className="text-center py-3 px-2">
                        <span className={`inline-flex px-2 py-1 rounded text-sm ${
                          game.role === 'host' 
                            ? 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300'
                            : 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                        }`}>
                          {game.role}
                        </span>
                      </td>
                      <td className="text-center py-3 px-2">
                        <div className="font-medium">{game.totalScore}</div>
                        <div className="text-xs text-gray-500">
                          B1: {game.board1Score} | B2: {game.board2Score}
                        </div>
                      </td>
                      <td className="text-center py-3 px-2">
                        <div className="flex items-center justify-center">
                          {game.isWinner && '🏆'}
                          <span className="ml-1">
                            {game.position}/{game.totalPlayers}
                          </span>
                        </div>
                      </td>
                      <td className="text-center py-3 px-2">
                        {game.questionsAnswered > 0 
                          ? `${Math.round((game.correctAnswers / game.questionsAnswered) * 100)}%`
                          : '-'
                        }
                      </td>
                      <td className="text-center py-3 px-2">
                        {new Date(game.playedAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}