import { supabase } from './supabase'
import type { Category, Member, RoutineItem, RoutineType, Task, Todo } from '../types'

export interface SyncPayload {
  categories: Category[]
  members: Member[]
  tasks: Task[]
  todos: Todo[]
  routines: Record<RoutineType, RoutineItem[]>
  taskCompletions: Record<string, boolean>
  routineCompletions: Record<string, boolean>
}

export interface RemoteRow {
  data: SyncPayload
  updated_at: string
}

export function generateSyncCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(15))
  return btoa(String.fromCharCode(...bytes)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 20)
}

export async function pullState(code: string): Promise<RemoteRow | null> {
  if (!supabase) throw new Error('Supabase non configuré')
  const { data, error } = await supabase
    .from('app_state')
    .select('data, updated_at')
    .eq('sync_id', code)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  return { data: data.data as SyncPayload, updated_at: data.updated_at as string }
}

function unionById<T extends { id: string }>(remote: T[], local: T[]): T[] {
  const byId = new Map(remote.map((item) => [item.id, item]))
  for (const item of local) {
    if (!byId.has(item.id)) byId.set(item.id, item)
  }
  return [...byId.values()]
}

/**
 * Merges local-only data into the remote payload when a device connects to a
 * code for the first time (or reconnects after being offline). Deletions
 * made on one side while disconnected aren't propagated — items are only
 * ever unioned, never dropped — which is an accepted trade-off for a simple
 * two-person sync without a real backend.
 */
export function mergePayloads(local: SyncPayload, remote: SyncPayload): SyncPayload {
  return {
    members: unionById(remote.members, local.members),
    categories: unionById(remote.categories, local.categories),
    tasks: unionById(remote.tasks, local.tasks),
    todos: unionById(remote.todos, local.todos),
    routines: {
      morning: unionById(remote.routines.morning, local.routines.morning),
      evening: unionById(remote.routines.evening, local.routines.evening),
    },
    taskCompletions: { ...remote.taskCompletions, ...local.taskCompletions },
    routineCompletions: { ...remote.routineCompletions, ...local.routineCompletions },
  }
}

export async function pushState(code: string, payload: SyncPayload): Promise<void> {
  if (!supabase) throw new Error('Supabase non configuré')
  const { error } = await supabase
    .from('app_state')
    .upsert({ sync_id: code, data: payload, updated_at: new Date().toISOString() }, { onConflict: 'sync_id' })
  if (error) throw error
}
