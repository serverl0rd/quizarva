import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'
import { redis } from '@/lib/redis/kv'

export const dynamic = 'force-dynamic'

interface GameStateSubscriber {
  id: string
  controller: ReadableStreamDefaultController
}

// Store active SSE connections per game
const gameSubscribers = new Map<string, Set<GameStateSubscriber>>()

// Cleanup function to remove disconnected subscribers
function removeSubscriber(gameId: string, subscriberId: string) {
  const subscribers = gameSubscribers.get(gameId)
  if (subscribers) {
    subscribers.forEach(sub => {
      if (sub.id === subscriberId) {
        subscribers.delete(sub)
      }
    })
    if (subscribers.size === 0) {
      gameSubscribers.delete(gameId)
    }
  }
}

// Broadcast game state updates to all subscribers
async function broadcastGameUpdate(gameId: string) {
  const subscribers = gameSubscribers.get(gameId)
  if (!subscribers || subscribers.size === 0) return

  try {
    // Get fresh game state from Redis
    const gameState = await redis.get(`game:${gameId}`)
    if (!gameState) return

    // Get additional data from PostgreSQL
    const gameData = await prisma.game.findUnique({
      where: { id: gameId },
      include: {
        players: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              }
            }
          }
        },
        boards: {
          include: {
            categories: {
              include: {
                questions: {
                  orderBy: { value: 'asc' }
                }
              },
              orderBy: { order: 'asc' }
            }
          },
          orderBy: { boardNumber: 'asc' }
        },
        buzzQueue: {
          orderBy: { order: 'asc' },
          include: {
            player: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                  }
                }
              }
            }
          }
        },
      }
    })

    const message = JSON.stringify({
      type: 'game-update',
      data: {
        ...gameState,
        ...gameData,
        timestamp: new Date().toISOString(),
      }
    })

    // Send update to all subscribers
    const encoder = new TextEncoder()
    const data = encoder.encode(`data: ${message}\n\n`)
    
    subscribers.forEach(subscriber => {
      try {
        subscriber.controller.enqueue(data)
      } catch (error) {
        // Remove failed subscriber
        subscribers.delete(subscriber)
      }
    })
  } catch (error) {
    console.error('Error broadcasting game update:', error)
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { gameId: string } }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { gameId } = params

  // Verify user is part of this game
  const player = await prisma.player.findFirst({
    where: {
      gameId,
      userId: session.user.id,
    },
  })

  const game = await prisma.game.findUnique({
    where: { id: gameId },
    select: { hostId: true },
  })

  if (!player && game?.hostId !== session.user.id) {
    return new Response('Not authorized for this game', { status: 403 })
  }

  // Create SSE stream
  const encoder = new TextEncoder()
  const subscriberId = `${session.user.id}-${Date.now()}`

  const stream = new ReadableStream({
    start(controller) {
      // Add this connection to subscribers
      if (!gameSubscribers.has(gameId)) {
        gameSubscribers.set(gameId, new Set())
      }
      
      const subscriber: GameStateSubscriber = {
        id: subscriberId,
        controller,
      }
      
      gameSubscribers.get(gameId)!.add(subscriber)

      // Send initial connection message
      const data = encoder.encode(
        `data: ${JSON.stringify({ type: 'connected', gameId })}\n\n`
      )
      controller.enqueue(data)

      // Send heartbeat every 30 seconds to keep connection alive
      const interval = setInterval(() => {
        try {
          const heartbeat = encoder.encode(':heartbeat\n\n')
          controller.enqueue(heartbeat)
        } catch (error) {
          clearInterval(interval)
          removeSubscriber(gameId, subscriberId)
        }
      }, 30000)

      // Send initial game state
      broadcastGameUpdate(gameId)

      // Cleanup on close
      request.signal.addEventListener('abort', () => {
        clearInterval(interval)
        removeSubscriber(gameId, subscriberId)
        controller.close()
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}