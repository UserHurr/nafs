import { SHARED_OWNER, type RoutineItem, type Task, type Todo } from '../types'

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

export const taskCompletionKey = (taskId: string, dateIso: string, memberId: string) =>
  `${taskId}_${dateIso}_${memberId}`

export const routineCompletionKey = (
  type: 'morning' | 'evening',
  itemId: string,
  dateIso: string,
  memberId: string,
) => `${type}_${itemId}_${dateIso}_${memberId}`
