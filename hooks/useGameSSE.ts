import { useEffect, useRef, useCallback, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'

export interface GameEvent {
  type: string
  data?: any
  timestamp?: string
}

interface UseGameSSEOptions {
  gameId: string | null
  onEvent?: (event: GameEvent) => void
  onConnect?: () => void
  onDisconnect?: () => void
  enabled?: boolean
}

export function useGameSSE({
  gameId,
  onEvent,
  onConnect,
  onDisconnect,
  enabled = true
}: UseGameSSEOptions) {
  const [isConnected, setIsConnected] = useState(false)
  const [lastEvent, setLastEvent] = useState<GameEvent | null>(null)
  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const queryClient = useQueryClient()

  const cleanup = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    setIsConnected(false)
  }, [])

  const connect = useCallback(() => {
    if (!gameId || !enabled || eventSourceRef.current) return

    try {
      const eventSource = new EventSource(`/api/sse/game/${gameId}`)
      eventSourceRef.current = eventSource

      eventSource.onopen = () => {
        setIsConnected(true)
        reconnectAttemptsRef.current = 0
        onConnect?.()
      }

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          setLastEvent(data)
          
          // Handle different event types
          switch (data.type) {
            case 'connected':
              console.log('SSE connected to game:', gameId)
              break
              
            case 'game-update':
              // Invalidate relevant queries to refresh data
              queryClient.invalidateQueries({ queryKey: ['game', gameId] })
              queryClient.invalidateQueries({ queryKey: ['players', gameId] })
              queryClient.invalidateQueries({ queryKey: ['scores', gameId] })
              queryClient.invalidateQueries({ queryKey: ['buzz-state', gameId] })
              break
              
            case 'player-joined':
            case 'player-buzzed':
            case 'score-update':
            case 'phase-change':
            case 'question-selected':
            case 'tiebreaker-start':
            case 'game-end':
            case 'answer-submitted':
              // These events trigger specific UI updates
              onEvent?.(data)
              break
              
            default:
              console.log('Unknown SSE event type:', data.type)
          }
          
          onEvent?.(data)
        } catch (error) {
          console.error('Error parsing SSE message:', error)
        }
      }

      eventSource.onerror = () => {
        setIsConnected(false)
        onDisconnect?.()
        cleanup()

        // Implement exponential backoff for reconnection
        if (reconnectAttemptsRef.current < 5) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000)
          reconnectAttemptsRef.current++
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect()
          }, delay)
        }
      }
    } catch (error) {
      console.error('Error creating EventSource:', error)
      cleanup()
    }
  }, [gameId, enabled, onConnect, onDisconnect, onEvent, cleanup, queryClient])

  useEffect(() => {
    connect()
    return cleanup
  }, [connect, cleanup])

  return {
    isConnected,
    lastEvent,
    reconnect: connect,
    disconnect: cleanup
  }
}

// Hook for host-specific SSE events
export function useHostGameSSE(gameId: string | null) {
  const queryClient = useQueryClient()
  
  return useGameSSE({
    gameId,
    onEvent: (event) => {
      // Host-specific event handling
      if (event.type === 'player-joined') {
        // Show notification
        console.log('Player joined:', event.data)
      } else if (event.type === 'player-buzzed') {
        // Update buzz queue UI
        queryClient.invalidateQueries({ queryKey: ['buzz-queue', gameId] })
      }
    }
  })
}

// Hook for player-specific SSE events  
export function usePlayerGameSSE(gameId: string | null) {
  const [canBuzz, setCanBuzz] = useState(false)
  const [isCurrentSelector, setIsCurrentSelector] = useState(false)
  
  return useGameSSE({
    gameId,
    onEvent: (event) => {
      // Player-specific event handling
      if (event.type === 'phase-change') {
        if (event.data?.phase === 'buzzing') {
          setCanBuzz(true)
        } else {
          setCanBuzz(false)
        }
      } else if (event.type === 'game-update' && event.data?.currentSelector) {
        // Check if this player is the current selector
        setIsCurrentSelector(event.data.currentSelector === event.data.playerId)
      }
    }
  })
}