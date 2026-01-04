import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'
import { publishGameEvent } from '@/lib/redis/kv'
import { notifyPlayerJoined } from '@/lib/sse/broadcast'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const joinGameSchema = z.object({
  gameId: z.string(),
  password: z.string(),
})

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user?.username) {
      return NextResponse.json(
        { error: 'Please set up your profile first' },
        { status: 400 }
      )
    }

    const body = await req.json()
    const { gameId, password } = joinGameSchema.parse(body)

    // Find the game
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: {
        players: true,
      },
    })

    if (!game) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      )
    }

    // Check password
    if (game.password !== password) {
      return NextResponse.json(
        { error: 'Incorrect password' },
        { status: 400 }
      )
    }

    // Check if game is full
    if (game.players.length >= 3) {
      return NextResponse.json(
        { error: 'Game is full (3/3 players)' },
        { status: 400 }
      )
    }

    // Check if user is already in game
    const existingPlayer = game.players.find((p) => p.userId === user.id)
    if (existingPlayer) {
      return NextResponse.json({ gameId, success: true })
    }

    // Check if user is the host
    if (game.hostId === user.id) {
      return NextResponse.json(
        { error: 'Host cannot join as player' },
        { status: 400 }
      )
    }

    // Add player to game
    await prisma.player.create({
      data: {
        userId: user.id,
        gameId: game.id,
      },
    })

    // Check if game is now full and update status
    const updatedGame = await prisma.game.findUnique({
      where: { id: gameId },
      include: { players: true },
    })

    if (updatedGame && updatedGame.players.length === 3) {
      await prisma.game.update({
        where: { id: gameId },
        data: { status: 'READY' },
      })
    }

    // Publish event for real-time updates
    await publishGameEvent(gameId, {
      type: 'playerJoined',
      playerId: user.id,
      username: user.username,
    })
    
    // Trigger SSE broadcast
    await notifyPlayerJoined(gameId, user.id)

    return NextResponse.json({ gameId, success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      )
    }
    console.error('Join game error:', error)
    return NextResponse.json(
      { error: 'Failed to join game' },
      { status: 500 }
    )
  }
}