import type { Task } from '../types'

const MS_PER_DAY = 86400000

function toUTCDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}

function diffDays(aIso: string, bIso: string): number {
  return Math.round((toUTCDate(bIso).getTime() - toUTCDate(aIso).getTime()) / MS_PER_DAY)
}

export function occursOn(task: Task, dateIso: string): boolean {
  const days = diffDays(task.date, dateIso)
  if (days < 0) return false

  const rec = task.recurrence
  if (!rec) return days === 0

  if (rec.endDate && dateIso > rec.endDate) return false

  const interval = Math.max(1, rec.interval)

  switch (rec.freq) {
    case 'daily':
      return days % interval === 0

    case 'weekly': {
      const anchorWeekday = toUTCDate(task.date).getUTCDay()
      const targetWeekdays = rec.daysOfWeek && rec.daysOfWeek.length > 0 ? rec.daysOfWeek : [anchorWeekday]
      const weekday = toUTCDate(dateIso).getUTCDay()
      if (!targetWeekdays.includes(weekday)) return false
      // align interval on the week containing the anchor date's own week start (Sunday)
      const anchorDate = toUTCDate(task.date)
      const anchorWeekStart = new Date(anchorDate)
      anchorWeekStart.setUTCDate(anchorDate.getUTCDate() - anchorWeekday)
      const targetDate = toUTCDate(dateIso)
      const targetWeekday = weekday
      const targetWeekStart = new Date(targetDate)
      targetWeekStart.setUTCDate(targetDate.getUTCDate() - targetWeekday)
      const weeksBetween = Math.round((targetWeekStart.getTime() - anchorWeekStart.getTime()) / (MS_PER_DAY * 7))
      return weeksBetween >= 0 && weeksBetween % interval === 0
    }

    case 'monthly': {
      const anchor = toUTCDate(task.date)
      const target = toUTCDate(dateIso)
      if (anchor.getUTCDate() !== target.getUTCDate()) return false
      const monthsBetween =
        (target.getUTCFullYear() - anchor.getUTCFullYear()) * 12 + (target.getUTCMonth() - anchor.getUTCMonth())
      return monthsBetween >= 0 && monthsBetween % interval === 0
    }

    case 'yearly': {
      const anchor = toUTCDate(task.date)
      const target = toUTCDate(dateIso)
      if (anchor.getUTCDate() !== target.getUTCDate() || anchor.getUTCMonth() !== target.getUTCMonth()) return false
      const yearsBetween = target.getUTCFullYear() - anchor.getUTCFullYear()
      return yearsBetween >= 0 && yearsBetween % interval === 0
    }

    default:
      return false
  }
}

export function tasksOnDate(tasks: Task[], dateIso: string): Task[] {
  return tasks
    .filter((t) => occursOn(t, dateIso))
    .sort((a, b) => {
      if (a.timeType === 'allday' && b.timeType === 'timed') return -1
      if (a.timeType === 'timed' && b.timeType === 'allday') return 1
      if (a.timeType === 'timed' && b.timeType === 'timed') {
        return (a.startTime ?? '').localeCompare(b.startTime ?? '')
      }
      return a.title.localeCompare(b.title)
    })
}
