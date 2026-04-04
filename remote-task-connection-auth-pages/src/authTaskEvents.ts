import type { ConnectionAuthTaskDetail } from './facade'

export type ConnectionAuthTaskTerminalEventType = 'succeeded' | 'failed' | 'expired'

export interface ConnectionAuthTaskTerminalEvent {
  type: ConnectionAuthTaskTerminalEventType
  taskId: string
  connectionId?: string
}

export function authTaskChannelName(taskId: string) {
  return `connection-auth-task:${taskId}`
}

export function emitAuthTaskTerminalEvent(event: ConnectionAuthTaskTerminalEvent) {
  if (typeof window === 'undefined') return

  if (typeof BroadcastChannel !== 'undefined') {
    const channel = new BroadcastChannel(authTaskChannelName(event.taskId))
    channel.postMessage(event)
    channel.close()
  }

  if (window.opener && typeof window.opener.postMessage === 'function') {
    window.opener.postMessage(
      {
        type: `connection-auth-task.${event.type}`,
        taskId: event.taskId,
        connectionId: event.connectionId,
      },
      '*',
    )
  }
}

export function terminalEventFromDetail(detail: ConnectionAuthTaskDetail): ConnectionAuthTaskTerminalEvent | null {
  const taskId = String(detail.task_id ?? '').trim()
  if (!taskId) return null
  const status = String(detail.status ?? '').trim().toLowerCase()
  if (status !== 'succeeded' && status !== 'failed' && status !== 'expired') return null
  return {
    type: status,
    taskId,
    connectionId: detail.connection_id ? String(detail.connection_id) : undefined,
  }
}
