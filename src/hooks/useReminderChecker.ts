import { useEffect } from 'react'
import { useStore } from '../store'
import { tasksOnDate } from '../lib/recurrence'
import { toIso } from '../lib/dates'
import { showTaskNotification } from '../lib/notifications'

export function useReminderChecker() {
  useEffect(() => {
    const check = () => {
      const { tasks, notificationsEnabled, notifiedReminders, markReminderNotified } = useStore.getState()
      if (!notificationsEnabled) return

      const now = new Date()
      const dateIso = toIso(now)
      const nowMinutes = now.getHours() * 60 + now.getMinutes()

      for (const task of tasksOnDate(tasks, dateIso)) {
        if (!task.reminder || task.timeType !== 'timed' || !task.startTime) continue
        const key = `${task.id}_${dateIso}`
        if (notifiedReminders[key]) continue

        const [h, m] = task.startTime.split(':').map(Number)
        const taskMinutes = h * 60 + m
        if (nowMinutes >= taskMinutes && nowMinutes - taskMinutes < 5) {
          markReminderNotified(task.id, dateIso)
          showTaskNotification('⏰ ' + task.title, `Prévu à ${task.startTime}`)
        }
      }
    }

    check()
    const id = setInterval(check, 30_000)
    return () => clearInterval(id)
  }, [])
}
