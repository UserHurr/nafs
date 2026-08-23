import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import { fr } from 'date-fns/locale'

export const toIso = (d: Date): string => format(d, 'yyyy-MM-dd')

export const todayIso = (): string => toIso(new Date())

export const fromIso = (iso: string): Date => {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export const weekDays = (anchor: Date): Date[] => {
  const start = startOfWeek(anchor, { weekStartsOn: 1, locale: fr })
  return Array.from({ length: 7 }, (_, i) => addDays(start, i))
}

export const monthGrid = (anchor: Date): Date[] => {
  const start = startOfWeek(startOfMonth(anchor), { weekStartsOn: 1, locale: fr })
  const end = endOfWeek(endOfMonth(anchor), { weekStartsOn: 1, locale: fr })
  const days: Date[] = []
  let cur = start
  while (cur <= end) {
    days.push(cur)
    cur = addDays(cur, 1)
  }
  return days
}

export const monthLabel = (d: Date): string => format(d, 'LLLL yyyy', { locale: fr })
export const weekdayShort = (d: Date): string => format(d, 'EEEEEE', { locale: fr })
export const dayNumber = (d: Date): string => format(d, 'd')
export const fullDayLabel = (d: Date): string => format(d, 'EEEE d MMMM', { locale: fr })

export const timeToMinutes = (time: string): number => {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

export const minutesToTime = (minutes: number): string => {
  const clamped = Math.max(0, Math.min(23 * 60 + 55, minutes))
  const h = Math.floor(clamped / 60)
  const m = clamped % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export { addDays, addWeeks, addMonths, addYears, isSameDay, isSameMonth, isToday }
