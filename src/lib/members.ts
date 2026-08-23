import { SHARED_OWNER, type RoutineItem, type Task, type Todo } from '../types'

export const isShared = (ownerId: string) => ownerId === SHARED_OWNER

export const isVisible = (ownerId: string, myId: string) => ownerId === myId || isShared(ownerId)

export function visibleTasks(tasks: Task[], myId: string): Task[] {
  return tasks.filter((t) => isVisible(t.ownerId, myId))
}

export function visibleTodos(todos: Todo[], myId: string): Todo[] {
  return todos.filter((t) => isVisible(t.ownerId, myId))
}

export function visibleRoutineItems(items: RoutineItem[], myId: string): RoutineItem[] {
  return items.filter((i) => isVisible(i.ownerId, myId))
}

export const taskCompletionKey = (taskId: string, dateIso: string, memberId: string) =>
  `${taskId}_${dateIso}_${memberId}`

export const routineCompletionKey = (
  type: 'morning' | 'evening',
  itemId: string,
  dateIso: string,
  memberId: string,
) => `${type}_${itemId}_${dateIso}_${memberId}`
