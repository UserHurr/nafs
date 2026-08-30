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
  /** Tombstones (id -> deleted-at) so a deletion made on one device sticks
   * instead of being re-added by the other device's next sync. */
  deletedIds: Record<string, string>
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

function unionById<T extends { id: string }>(remote: T[], local: T[], deletedIds: Record<string, string>): T[] {
  const byId = new Map(remote.map((item) => [item.id, item]))
  for (const item of local) {
    if (!byId.has(item.id)) byId.set(item.id, item)
  }
  return [...byId.values()].filter((item) => !(item.id in deletedIds))
}

/**
 * Merges local and remote payloads — used both when a device (re)connects to
 * a code and on every ongoing sync cycle. Items are unioned by id, except
 * those with a tombstone in deletedIds (populated by the remove* store
 * actions): a deletion made on either side sticks instead of being silently
 * re-added by the other device's copy.
 */
export function mergePayloads(local: SyncPayload, remote: SyncPayload): SyncPayload {
  const deletedIds = { ...remote.deletedIds, ...local.deletedIds }
  return {
    deletedIds,
    members: unionById(remote.members, local.members, deletedIds),
    categories: unionById(remote.categories, local.categories, deletedIds),
    tasks: unionById(remote.tasks, local.tasks, deletedIds),
    todos: unionById(remote.todos, local.todos, deletedIds),
    routines: {
      morning: unionById(remote.routines.morning, local.routines.morning, deletedIds),
      evening: unionById(remote.routines.evening, local.routines.evening, deletedIds),
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
