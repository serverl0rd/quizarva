import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Try to connect to database
    try {
      await prisma.$connect()
    } catch (dbError) {
      console.error('Database connection failed:', dbError)
      // Return empty game history when DB is unavailable
      return NextResponse.json([])
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    })

    if (!user) {
      // Return empty array instead of error for new users
      return NextResponse.json([])
    }

    const gameHistory = await prisma.gameHistory.findMany({
      where: { userId: user.id },
      orderBy: { playedAt: 'desc' },
      take: 50 // Limit to last 50 games
    })

    return NextResponse.json(gameHistory)
  } catch (error) {
    console.error('Game history fetch error:', error)
    // Return empty array instead of error
    return NextResponse.json([])
  }
}