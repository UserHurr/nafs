import { useStore } from '../store'
import { todayIso } from './dates'

export function exportDataAsJson() {
  const s = useStore.getState()
  const payload = {
    exportedAt: new Date().toISOString(),
    categories: s.categories,
    members: s.members,
    tasks: s.tasks,
    todos: s.todos,
    routines: s.routines,
    taskCompletions: s.taskCompletions,
    routineCompletions: s.routineCompletions,
  }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `nafs-sauvegarde-${todayIso()}.json`
  a.click()
  URL.revokeObjectURL(url)
}
