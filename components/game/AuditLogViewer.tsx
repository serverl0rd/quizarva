'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  User, 
  Award, 
  Edit3, 
  SkipForward, 
  CheckCircle, 
  XCircle,
  Filter,
  Clock,
  Activity
} from 'lucide-react'

interface AuditLogViewerProps {
  gameId: string
}

interface AuditLog {
  id: string
  gameId: string
  userId: string | null
  boardNumber: number | null
  category: string | null
  questionId: string | null
  pointDelta: number
  reason: string
  createdAt: string
  createdBy: string
}

export function AuditLogViewer({ gameId }: AuditLogViewerProps) {
  const [filter, setFilter] = useState<string>('all')
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set())

  const { data: logs, isLoading } = useQuery({
    queryKey: ['auditLogs', gameId],
    queryFn: async () => {
      const res = await fetch(`/api/game/${gameId}/audit-logs`)
      if (!res.ok) throw new Error('Failed to fetch audit logs')
      return res.json()
    },
  })

  const toggleExpanded = (logId: string) => {
    setExpandedLogs((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(logId)) {
        newSet.delete(logId)
      } else {
        newSet.add(logId)
      }
      return newSet
    })
  }

  const filteredLogs = logs?.filter((log: AuditLog) => 
    filter === 'all' || log.reason === filter
  ) || []

  const uniqueReasons = [...new Set(logs?.map((log: AuditLog) => log.reason) || [])] as string[]

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-800 rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Audit Log
          </h3>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-text-secondary-light dark:text-text-secondary-dark" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="rounded-md border border-border-light dark:border-border-dark bg-bg-light dark:bg-bg-dark px-3 py-1 text-sm"
            >
              <option value="all">All Actions</option>
              {uniqueReasons.map((reason) => (
                <option key={reason} value={reason}>
                  {reason}
                </option>
              ))}
            </select>
          </div>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="text-center py-8 text-text-secondary-light dark:text-text-secondary-dark">
            <p>No audit logs found</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredLogs.map((log: AuditLog) => {
              const Icon = Activity
              const colorClass = log.pointDelta > 0 ? 'text-green-600' : log.pointDelta < 0 ? 'text-red-600' : 'text-text-primary-light dark:text-text-primary-dark'
              const isExpanded = expandedLogs.has(log.id)

              return (
                <div
                  key={log.id}
                  className="border border-border-light dark:border-border-dark rounded-lg p-3 hover:bg-surface-alt dark:hover:bg-surface-alt-dark transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <Icon className={`h-4 w-4 mt-0.5 ${colorClass}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium">
                          {log.reason}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-text-secondary-light dark:text-text-secondary-dark">
                          <Clock className="h-3 w-3" />
                          {new Date(log.createdAt).toLocaleTimeString()}
                        </div>
                      </div>
                      
                      <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-1">
                        By {log.createdBy || 'System'}
                      </p>

                      {log.pointDelta !== 0 && (
                        <div className="mt-1 text-sm font-medium">
                          Points: {log.pointDelta > 0 ? '+' : ''}{log.pointDelta}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}