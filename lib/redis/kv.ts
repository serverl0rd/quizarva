import { kv } from '@vercel/kv'

// Export kv as redis for compatibility
export { kv as redis }
export { kv }

// Game state keys
export const GAME_STATE_KEY = (gameId: string) => `game:${gameId}:state`
export const GAME_BUZZ_KEY = (gameId: string) => `game:${gameId}:buzz`
export const GAME_SSE_KEY = (gameId: string) => `game:${gameId}:sse`
export const GAME_LOCK_KEY = (gameId: string) => `game:${gameId}:lock`

// TTL values
export const GAME_STATE_TTL = 24 * 60 * 60 // 24 hours
export const BUZZ_LOCK_TTL = 300 // 5 minutes
export const SSE_EVENT_TTL = 60 // 1 minute

export interface GameState {
  currentPhase: 'waiting' | 'question' | 'buzz' | 'answer' | 'safety' | 'reveal' | 'score' | 'select' | 'tiebreaker'
  currentQuestion?: {
    boardNumber: number
    categoryId: string
    value: number
    questionId: string
  }
  currentSelector?: string
  buzzState?: {
    locked: boolean
    activePlayer?: string
    queue: string[]
    startTime?: number
  }
  lastUpdate: number
}

export interface BuzzAttempt {
  playerId: string
  timestamp: number
}

// Atomic buzz operation
export async function attemptBuzz(gameId: string, playerId: string): Promise<{ success: boolean; position: number }> {
  const buzzKey = GAME_BUZZ_KEY(gameId)
  const lockKey = GAME_LOCK_KEY(gameId)
  
  // Try to acquire lock atomically
  const acquired = await kv.set(lockKey, playerId, {
    nx: true, // Only set if not exists
    ex: BUZZ_LOCK_TTL,
  })
  
  if (acquired === 'OK') {
    // First buzz!
    await kv.lpush(buzzKey, playerId)
    return { success: true, position: 1 }
  }
  
  // Already locked, add to queue
  const position = await kv.lpush(buzzKey, playerId)
  return { success: false, position: position as number }
}

// Get current game state
export async function getGameState(gameId: string): Promise<GameState | null> {
  const state = await kv.get<GameState>(GAME_STATE_KEY(gameId))
  return state
}

// Update game state
export async function updateGameState(gameId: string, state: Partial<GameState>): Promise<void> {
  const currentState = await getGameState(gameId) || {
    currentPhase: 'waiting',
    lastUpdate: Date.now(),
  }
  
  const newState: GameState = {
    ...currentState,
    ...state,
    lastUpdate: Date.now(),
  }
  
  await kv.set(GAME_STATE_KEY(gameId), newState, {
    ex: GAME_STATE_TTL,
  })
}

// SSE event publishing
export async function publishGameEvent(gameId: string, event: any): Promise<void> {
  const eventKey = GAME_SSE_KEY(gameId)
  await kv.lpush(eventKey, JSON.stringify({
    ...event,
    timestamp: Date.now(),
  }))
  await kv.expire(eventKey, SSE_EVENT_TTL)
}

// Get recent events for SSE
export async function getRecentEvents(gameId: string, since: number = 0): Promise<any[]> {
  const eventKey = GAME_SSE_KEY(gameId)
  const events = await kv.lrange(eventKey, 0, -1)
  
  return events
    .map(e => JSON.parse(e as string))
    .filter(e => e.timestamp > since)
    .reverse()
}