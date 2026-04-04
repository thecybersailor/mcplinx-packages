import type { ConnectionAuthTaskDetail, ConnectionAuthTaskFacade } from '../../remote-task-connection-auth-pages/src/facade'
import { authTaskChannelName } from '../../remote-task-connection-auth-pages/src/authTaskEvents'

export interface AuthTaskWindowController {
  taskId: string
  popupBlocked: boolean
  cleanup: () => void
}

interface StartAuthTaskWindowOptions {
  authUrl: string
  authTaskFacade: ConnectionAuthTaskFacade
  taskId?: string
  pollIntervalMs?: number
  onTerminal?: (detail: ConnectionAuthTaskDetail) => void | Promise<void>
}

const TERMINAL_STATUSES = new Set(['succeeded', 'failed', 'expired'])

export function extractTaskIdFromAuthUrl(authUrl: string) {
  try {
    const url = new URL(authUrl, typeof window !== 'undefined' ? window.location.origin : 'http://localhost')
    const matched = url.pathname.match(/\/auth\/connection-tasks\/([^/]+)/)
    return matched?.[1] ?? ''
  } catch {
    return ''
  }
}

export function openAuthTaskWindow(options: StartAuthTaskWindowOptions): AuthTaskWindowController {
  const taskId = (options.taskId || extractTaskIdFromAuthUrl(options.authUrl)).trim()
  const popup = typeof window !== 'undefined'
    ? window.open(options.authUrl, '_blank', 'popup=yes,width=520,height=720')
    : null
  const popupBlocked = !popup

  let stopped = false
  let pollTimer: number | undefined
  let channel: BroadcastChannel | null = null

  const cleanup = () => {
    if (stopped) return
    stopped = true
    if (pollTimer != null && typeof window !== 'undefined') window.clearInterval(pollTimer)
    if (channel) {
      channel.close()
      channel = null
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('message', handleMessage)
    }
  }

  const syncTask = async () => {
    if (!taskId || stopped) return
    const detail = await options.authTaskFacade.getTask(taskId)
    if (TERMINAL_STATUSES.has(String(detail.status ?? '').toLowerCase())) {
      cleanup()
      await options.onTerminal?.(detail)
    }
  }

  const handleMessage = (event: MessageEvent) => {
    if (typeof window !== 'undefined' && event.origin !== window.location.origin) return
    const data = event.data as { type?: string; taskId?: string } | null
    if (!data || data.taskId !== taskId) return
    if (!String(data.type ?? '').startsWith('connection-auth-task.')) return
    void syncTask()
  }

  if (typeof window !== 'undefined' && taskId) {
    if (typeof BroadcastChannel !== 'undefined') {
      channel = new BroadcastChannel(authTaskChannelName(taskId))
      channel.onmessage = () => {
        void syncTask()
      }
    }
    window.addEventListener('message', handleMessage)
    pollTimer = window.setInterval(() => {
      void syncTask()
    }, options.pollIntervalMs ?? 1000)
  }

  return {
    taskId,
    popupBlocked,
    cleanup,
  }
}
