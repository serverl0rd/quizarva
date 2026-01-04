'use client'

interface BuzzQueueItem {
  id: string
  playerId: string
  playerName: string
  position: number
  isActive: boolean
}

interface BuzzQueueProps {
  queue: BuzzQueueItem[]
  currentPlayerId?: string
}

export function BuzzQueue({ queue, currentPlayerId }: BuzzQueueProps) {
  if (queue.length === 0) return null

  return (
    <div className="bg-surface-light dark:bg-surface-dark rounded-lg shadow-md p-4 border border-border-light dark:border-border-dark">
      <h3 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark mb-3">
        Buzz Order
      </h3>
      <div className="space-y-2">
        {queue.map((item, index) => (
          <div
            key={item.id}
            className={`
              flex items-center justify-between p-3 rounded-md transition-all
              ${item.isActive
                ? 'bg-primary-light dark:bg-primary-dark text-white'
                : item.playerId === currentPlayerId
                ? 'bg-primary-light/20 dark:bg-primary-dark/20 text-text-primary-light dark:text-text-primary-dark'
                : 'bg-gray-100 dark:bg-gray-800 text-text-secondary-light dark:text-text-secondary-dark'
              }
              ${item.isActive ? 'animate-pulse-glow' : ''}
            `}
          >
            <div className="flex items-center space-x-3">
              <span className={`
                text-2xl font-bold
                ${item.isActive ? 'text-white' : 'text-text-secondary-light dark:text-text-secondary-dark'}
              `}>
                {item.position}
              </span>
              <span className="font-medium">
                {item.playerName}
                {item.playerId === currentPlayerId && ' (You)'}
              </span>
            </div>
            {item.isActive && (
              <span className="text-sm font-medium">
                Answering...
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}