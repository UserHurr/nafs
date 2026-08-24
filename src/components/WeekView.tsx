import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useStore } from '../store'
import { tasksOnDate } from '../lib/recurrence'
import { addWeeks, dayNumber, isToday, toIso, weekDays, weekdayShort } from '../lib/dates'
import { TaskFormModal } from './TaskFormModal'
import { Icon } from '../lib/icons'
import { taskCompletionKey, visibleTasks, type OwnershipFilter } from '../lib/members'
import { myMemberId } from '../syncStore'
import type { Task } from '../types'
import { useSwipeNav } from '../hooks/useSwipeNav'

export function WeekView({
  anchor,
  onAnchorChange,
  filter,
}: {
  anchor: Date
  onAnchorChange: (d: Date) => void
  filter: OwnershipFilter
}) {
  const tasks = useStore((s) => s.tasks)
  const categories = useStore((s) => s.categories)
  const taskCompletions = useStore((s) => s.taskCompletions)
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState<Task | undefined>(undefined)
  const [dir, setDir] = useState(1)

  const me = myMemberId()
  const days = weekDays(anchor)
  const myTasks = visibleTasks(tasks, me, filter)
  const todayIsoStr = toIso(new Date())

  const goToWeek = (direction: number) => {
    setDir(direction)
    onAnchorChange(addWeeks(anchor, direction))
  }

  const swipe = useSwipeNav(
    () => goToWeek(-1),
    () => goToWeek(1),
  )

  const rangeLabel = `${dayNumber(days[0])} – ${dayNumber(days[6])} ${new Intl.DateTimeFormat('fr-FR', {
    month: 'long',
    year: 'numeric',
  }).format(days[6])}`

  return (
    <div className="view-container" {...swipe}>
      <div className="month-nav">
        <button className="nav-arrow" onClick={() => goToWeek(-1)}>
          <ChevronLeft size={18} />
        </button>
        <div className="month-label week-range-label">{rangeLabel}</div>
        <button className="nav-arrow" onClick={() => goToWeek(1)}>
          <ChevronRight size={18} />
        </button>
      </div>

      <div key={toIso(anchor)} className="week-grid-wrap view-slide" style={{ '--dir': dir } as React.CSSProperties}>
        <div className="week-grid">
          {days.map((d) => {
            const iso = toIso(d)
            const dayTasks = tasksOnDate(myTasks, iso)
            return (
              <div key={iso} className={`week-grid-day ${isToday(d) ? 'week-grid-day-today' : ''}`}>
                <div className="week-grid-day-header">
                  <span>{weekdayShort(d)}</span>
                  <span className={`week-grid-day-num ${iso === todayIsoStr ? 'week-grid-day-num-today' : ''}`}>
                    {dayNumber(d)}
                  </span>
                </div>
                <div className="week-grid-tasks">
                  {dayTasks.map((t) => {
                    const category = categories.find((c) => c.id === t.categoryId)
                    const done = !!taskCompletions[taskCompletionKey(t.id, iso, me)]
                    return (
                      <button
                        key={t.id}
                        className={`week-grid-task ${done ? 'week-grid-task-done' : ''}`}
                        style={{ background: category?.color ?? 'var(--accent)' }}
                        title={t.title}
                        onClick={() => setEditing(t)}
                      >
                        <Icon name={category?.icon} size={11} />
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <button className="fab" onClick={() => setShowAdd(true)}>
        +
      </button>

      {showAdd && <TaskFormModal defaultDate={todayIsoStr} onClose={() => setShowAdd(false)} />}
      {editing && (
        <TaskFormModal editingTask={editing} defaultDate={todayIsoStr} onClose={() => setEditing(undefined)} />
      )}
    </div>
  )
}
