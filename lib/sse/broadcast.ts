import { redis } from '@/lib/redis/kv'

// Central function to trigger SSE updates
export async function notifyGameUpdate(gameId: string) {
  try {
    // SSE updates are handled by polling in the SSE route
    // This function is a placeholder for future enhancements
    console.log(`Game update notification for game: ${gameId}`)
  } catch (error) {
    console.error('Failed to broadcast game update:', error)
  }
}

// Specific event notifications
export async function notifyPlayerJoined(gameId: string, playerId: string) {
  // You can add specific event data to Redis before broadcasting
  const eventKey = `game:${gameId}:event`
  await redis.set(eventKey, {
    type: 'player-joined',
    playerId,
    timestamp: new Date().toISOString()
  }, { ex: 5 }) // Expire after 5 seconds
  
  await notifyGameUpdate(gameId)
}

export async function notifyBuzzEvent(gameId: string, playerId: string) {
  const eventKey = `game:${gameId}:event`
  await redis.set(eventKey, {
    type: 'player-buzzed',
    playerId,
    timestamp: new Date().toISOString()
  }, { ex: 5 })
  
  await notifyGameUpdate(gameId)
}

export async function notifyScoreUpdate(gameId: string, playerId: string, scoreChange: number) {
  const eventKey = `game:${gameId}:event`
  await redis.set(eventKey, {
    type: 'score-update',
    playerId,
    scoreChange,
    timestamp: new Date().toISOString()
  }, { ex: 5 })
  
  await notifyGameUpdate(gameId)
}

export async function notifyPhaseChange(gameId: string, newPhase: string) {
  const eventKey = `game:${gameId}:event`
  await redis.set(eventKey, {
    type: 'phase-change',
    phase: newPhase,
    timestamp: new Date().toISOString()
  }, { ex: 5 })
  
  await notifyGameUpdate(gameId)
}

export async function notifyQuestionSelected(gameId: string, categoryId: string, questionId: string) {
  const eventKey = `game:${gameId}:event`
  await redis.set(eventKey, {
    type: 'question-selected',
    categoryId,
    questionId,
    timestamp: new Date().toISOString()
  }, { ex: 5 })
  
  await notifyGameUpdate(gameId)
}

export async function notifyTiebreakerStart(gameId: string, tiedPlayers: string[]) {
  const eventKey = `game:${gameId}:event`
  await redis.set(eventKey, {
    type: 'tiebreaker-start',
    tiedPlayers,
    timestamp: new Date().toISOString()
  }, { ex: 5 })
  
  await notifyGameUpdate(gameId)
}

export async function notifyGameEnd(gameId: string, winnerId: string) {
  const eventKey = `game:${gameId}:event`
  await redis.set(eventKey, {
    type: 'game-end',
    winnerId,
    timestamp: new Date().toISOString()
  }, { ex: 5 })
  
  await notifyGameUpdate(gameId)
}