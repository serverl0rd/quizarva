import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { prisma as db } from '@/lib/db/prisma'
import { kv as redis } from '@/lib/redis/kv'

export async function GET(
  req: NextRequest,
  { params }: { params: { playerId: string } }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const gameId = searchParams.get('gameId')
    
    if (!gameId) {
      return NextResponse.json({ error: 'Game ID required' }, { status: 400 })
    }

    // Verify the requester is the host of the game
    const game = await db.game.findUnique({
      where: { id: gameId },
      select: { hostId: true },
    })

    if (!game || game.hostId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized - host only' }, { status: 401 })
    }

    // Get the player's submitted answer from Redis
    const answerKey = `game:${gameId}:player:${params.playerId}:answer`
    const answerData = await redis.get(answerKey)
    
    if (!answerData) {
      return NextResponse.json({ answer: null })
    }

    // Vercel KV automatically deserializes JSON
    return NextResponse.json(answerData)
  } catch (error) {
    console.error('Get player answer error:', error)
    return NextResponse.json(
      { error: 'Failed to get player answer' },
      { status: 500 }
    )
  }
}