import type { RoutineItem, Task, Todo } from '../types'
import { addDays, toIso } from './dates'
import { tasksOnDate } from './recurrence'
import { isShared, routineCompletionKey, taskCompletionKey, visibleTasks, visibleTodos } from './members'

export function routineStreak(
  items: RoutineItem[],
  completions: Record<string, boolean>,
  type: 'morning' | 'evening',
  today: Date,
  memberId: string,
): number {
  if (items.length === 0) return 0
  let streak = 0
  let cursor = today
  for (let i = 0; i < 3650; i++) {
    const iso = toIso(cursor)
    const allDone = items.every((it) => completions[routineCompletionKey(type, it.id, iso, memberId)])
    if (!allDone) {
      if (i === 0) {
        cursor = addDays(cursor, -1)
        continue
      }
      break
    }
    streak++
    cursor = addDays(cursor, -1)
  }
  return streak
}

export interface DayScore {
  dateIso: string
  done: number
  total: number
  ratio: number
}

export function dayCompletion(
  tasks: Task[],
  taskCompletions: Record<string, boolean>,
  todos: Todo[],
  dateIso: string,
  memberId: string,
): DayScore {
  const myTasks = visibleTasks(tasks, memberId)
  const occurring = tasksOnDate(myTasks, dateIso)
  let done = occurring.filter((t) => taskCompletions[taskCompletionKey(t.id, dateIso, memberId)]).length
  let total = occurring.length

  const dueTodos = visibleTodos(todos, memberId).filter((t) => t.dueDate === dateIso)
  done += dueTodos.filter((t) => t.doneBy.includes(memberId)).length
  total += dueTodos.length

  return { dateIso, done, total, ratio: total === 0 ? 0 : done / total }
}

export function weeklySummary(
  tasks: Task[],
  taskCompletions: Record<string, boolean>,
  todos: Todo[],
  today: Date,
  memberId: string,
): { done: number; total: number; ratio: number } {
  const weekday = (today.getDay() + 6) % 7 // 0 = lundi
  const monday = addDays(today, -weekday)
  let done = 0
  let total = 0
  for (let i = 0; i <= weekday; i++) {
    const iso = toIso(addDays(monday, i))
    const score = dayCompletion(tasks, taskCompletions, todos, iso, memberId)
    done += score.done
    total += score.total
  }
  return { done, total, ratio: total === 0 ? 0 : done / total }
}

export function sharedWeeklySummary(
  tasks: Task[],
  taskCompletions: Record<string, boolean>,
  today: Date,
  memberId: string,
): { done: number; total: number; ratio: number } {
  const sharedTasks = tasks.filter((t) => isShared(t.ownerId))
  const weekday = (today.getDay() + 6) % 7
  const monday = addDays(today, -weekday)
  let done = 0
  let total = 0
  for (let i = 0; i <= weekday; i++) {
    const iso = toIso(addDays(monday, i))
    const occurring = tasksOnDate(sharedTasks, iso)
    total += occurring.length
    done += occurring.filter((t) => taskCompletions[taskCompletionKey(t.id, iso, memberId)]).length
  }
  return { done, total, ratio: total === 0 ? 0 : done / total }
}

export function heatmapDays(today: Date, weeks: number): Date[][] {
  const weekday = (today.getDay() + 6) % 7
  const lastMonday = addDays(today, -weekday)
  const firstMonday = addDays(lastMonday, -7 * (weeks - 1))
  const grid: Date[][] = []
  for (let w = 0; w < weeks; w++) {
    const row: Date[] = []
    for (let d = 0; d < 7; d++) {
      row.push(addDays(firstMonday, w * 7 + d))
    }
    grid.push(row)
  }
  return grid
}
