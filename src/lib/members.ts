import { SHARED_OWNER, type Habit, type Member, type RoutineItem, type Task, type Todo } from '../types'

export const isShared = (ownerId: string) => ownerId === SHARED_OWNER

export const isVisible = (ownerId: string, myId: string) => ownerId === myId || isShared(ownerId)

export type OwnershipFilter = 'all' | 'mine' | 'shared'

const matchesFilter = (ownerId: string, myId: string, filter: OwnershipFilter) => {
  if (filter === 'mine') return ownerId === myId
  if (filter === 'shared') return isShared(ownerId)
  return isVisible(ownerId, myId)
}

export function visibleTasks(tasks: Task[], myId: string, filter: OwnershipFilter = 'all'): Task[] {
  return tasks.filter((t) => matchesFilter(t.ownerId, myId, filter))
}

export function visibleTodos(todos: Todo[], myId: string, filter: OwnershipFilter = 'all'): Todo[] {
  return todos.filter((t) => matchesFilter(t.ownerId, myId, filter))
}

export function visibleRoutineItems(items: RoutineItem[], myId: string, filter: OwnershipFilter = 'all'): RoutineItem[] {
  return items.filter((i) => matchesFilter(i.ownerId, myId, filter))
}

export function visibleHabits(habits: Habit[], myId: string, filter: OwnershipFilter = 'all'): Habit[] {
  return habits.filter((h) => matchesFilter(h.ownerId, myId, filter))
}

export const taskCompletionKey = (taskId: string, dateIso: string, memberId: string) =>
  `${taskId}_${dateIso}_${memberId}`

/**
 * Splits any leftover shared-owner ("Nous") task into one real copy per
 * member. The derived id (`${task.id}::${member.id}`) is deterministic so
 * that if two devices both encounter the same shared task independently
 * (e.g. a device still on the old build pushes one up mid-sync), they
 * converge on the same split instead of producing duplicate copies.
 */
export function splitSharedOwner(
  tasks: Task[],
  members: Member[],
  taskCompletions: Record<string, boolean>,
): { tasks: Task[]; taskCompletions: Record<string, boolean> } {
  const sharedTasks = tasks.filter((t) => isShared(t.ownerId))
  if (sharedTasks.length === 0 || members.length === 0) return { tasks, taskCompletions }

  const sharedIds = new Set(sharedTasks.map((t) => t.id))
  const splitId = (taskId: string, memberId: string) => `${taskId}::${memberId}`

  const splitTasks = sharedTasks.flatMap((task) =>
    members.map((member) => ({ ...task, id: splitId(task.id, member.id), ownerId: member.id })),
  )

  const nextCompletions: Record<string, boolean> = {}
  for (const [key, value] of Object.entries(taskCompletions)) {
    const [taskId, dateIso, memberId] = key.split('_')
    nextCompletions[sharedIds.has(taskId) ? `${splitId(taskId, memberId)}_${dateIso}_${memberId}` : key] = value
  }

  return {
    tasks: [...tasks.filter((t) => !isShared(t.ownerId)), ...splitTasks],
    taskCompletions: nextCompletions,
  }
}

export const routineCompletionKey = (
  type: 'morning' | 'evening',
  itemId: string,
  dateIso: string,
  memberId: string,
) => `${type}_${itemId}_${dateIso}_${memberId}`

export const habitCompletionKey = (habitId: string, dateIso: string, memberId: string) =>
  `${habitId}_${dateIso}_${memberId}`
