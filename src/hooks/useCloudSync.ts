import { useCallback, useEffect, useRef } from 'react'
import { useStore } from '../store'
import { useSyncStore } from '../syncStore'
import { generateSyncCode, mergePayloads, pullState, pushState, type SyncPayload } from '../lib/sync'
import { supabaseConfigured } from '../lib/supabase'

const PULL_INTERVAL_MS = 20_000
const PUSH_DEBOUNCE_MS = 1500

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  if (err && typeof err === 'object' && 'message' in err) return String((err as { message: unknown }).message)
  return String(err)
}

function extractPayload(): SyncPayload {
  const s = useStore.getState()
  return {
    categories: s.categories,
    members: s.members,
    tasks: s.tasks,
    todos: s.todos,
    routines: s.routines,
    taskCompletions: s.taskCompletions,
    routineCompletions: s.routineCompletions,
    deletedIds: s.deletedIds,
  }
}

function applyPayload(payload: SyncPayload) {
  useStore.setState(payload)
}

export function useCloudSync() {
  const code = useSyncStore((s) => s.code)
  const setStatus = useSyncStore((s) => s.setStatus)
  const setLastSyncedAt = useSyncStore((s) => s.setLastSyncedAt)
  const setError = useSyncStore((s) => s.setError)

  const applyingRemote = useRef(false)
  const pushTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastRemoteUpdatedAt = useRef<string | null>(null)

  // Both push and pull merge against the latest remote copy (tombstone-aware,
  // see mergePayloads) rather than blindly overwriting either side — this is
  // what makes a deletion made on one device stick instead of being silently
  // re-added by the other device's next sync.
  const push = useCallback(
    async (activeCode: string) => {
      try {
        const remote = await pullState(activeCode)
        const merged = remote ? mergePayloads(extractPayload(), remote.data) : extractPayload()
        if (remote) {
          applyingRemote.current = true
          applyPayload(merged)
          applyingRemote.current = false
        }
        await pushState(activeCode, merged)
        lastRemoteUpdatedAt.current = new Date().toISOString()
        setLastSyncedAt(new Date().toISOString())
        setStatus('connected')
        setError(null)
      } catch (err) {
        setStatus('error')
        setError(errorMessage(err))
      }
    },
    [setStatus, setLastSyncedAt, setError],
  )

  const pull = useCallback(
    async (activeCode: string) => {
      try {
        const remote = await pullState(activeCode)
        if (remote && remote.updated_at !== lastRemoteUpdatedAt.current) {
          lastRemoteUpdatedAt.current = remote.updated_at
          const merged = mergePayloads(extractPayload(), remote.data)
          applyingRemote.current = true
          applyPayload(merged)
          applyingRemote.current = false
          setLastSyncedAt(remote.updated_at)
        }
        setStatus('connected')
        setError(null)
        return remote
      } catch (err) {
        setStatus('error')
        setError(errorMessage(err))
        return null
      }
    },
    [setStatus, setLastSyncedAt, setError],
  )

  useEffect(() => {
    if (!code || !supabaseConfigured) return
    let cancelled = false
    setStatus('connecting')

    // On (re)connecting, merge local-only data into the remote copy instead
    // of blindly overwriting either side — protects a partner's existing
    // solo data the first time the two devices pair up.
    ;(async () => {
      try {
        const remote = await pullState(code)
        if (cancelled) return
        if (remote) {
          const merged = mergePayloads(extractPayload(), remote.data)
          applyingRemote.current = true
          applyPayload(merged)
          applyingRemote.current = false
        }
        await push(code)
      } catch (err) {
        if (cancelled) return
        setStatus('error')
        setError(errorMessage(err))
      }
    })()

    const interval = setInterval(() => pull(code), PULL_INTERVAL_MS)

    const unsubscribe = useStore.subscribe(() => {
      if (applyingRemote.current) return
      if (pushTimer.current) clearTimeout(pushTimer.current)
      pushTimer.current = setTimeout(() => push(code), PUSH_DEBOUNCE_MS)
    })

    return () => {
      cancelled = true
      clearInterval(interval)
      unsubscribe()
      if (pushTimer.current) clearTimeout(pushTimer.current)
    }
  }, [code, pull, push, setStatus, setError])
}

export { generateSyncCode }
