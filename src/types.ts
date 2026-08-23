export type RecurrenceFreq = 'daily' | 'weekly' | 'monthly' | 'yearly'

export interface Recurrence {
  freq: RecurrenceFreq
  interval: number
  /** For weekly recurrence: 0 = dimanche ... 6 = samedi. If omitted, uses the weekday of the anchor date. */
  daysOfWeek?: number[]
  endDate?: string
}

export interface Category {
  id: string
  name: string
  icon: string
  color: string
}

export const SHARED_OWNER = 'shared'

export interface Member {
  id: string
  name: string
  icon: string
  color: string
}

export type TimeType = 'timed' | 'allday'

export interface Task {
  id: string
  title: string
  categoryId: string
  timeType: TimeType
  startTime?: string
  duration?: number
  date: string
  recurrence?: Recurrence
  notes?: string
  reminder?: boolean
  ownerId: string
  createdAt: string
}

export type Priority = 'low' | 'medium' | 'high'

export interface Subtask {
  id: string
  title: string
  done: boolean
}

export interface Todo {
  id: string
  title: string
  ownerId: string
  doneBy: string[]
  dueDate?: string
  priority?: Priority
  subtasks?: Subtask[]
  createdAt: string
}

export type RoutineType = 'morning' | 'evening'

export interface RoutineItem {
  id: string
  title: string
  icon: string
  ownerId: string
}
