import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useStore } from '../store'
import { tasksOnDate } from '../lib/recurrence'
import { addWeeks, dayNumber, isToday, toIso, weekDays, weekdayShort } from '../lib/dates'
import { TaskFormModal } from './TaskFormModal'
import { TaskPreviewModal } from './TaskPreviewModal'
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
  const [addDate, setAddDate] = useState<string | undefined>(undefined)
  const [editing, setEditing] = useState<Task | undefined>(undefined)
  const [previewing, setPreviewing] = useState<{ task: Task; dateIso: string } | undefined>(undefined)
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
              <div
                key={iso}
                className={`week-grid-day ${isToday(d) ? 'week-grid-day-today' : ''}`}
                onClick={() => setAddDate(iso)}
              >
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
                        onClick={(e) => {
                          e.stopPropagation()
                          setPreviewing({ task: t, dateIso: iso })
                        }}
                      >
                        <span className="week-grid-task-title-row">
                          <Icon name={category?.icon} size={9} className="week-grid-task-icon" />
                          <span className="week-grid-task-title">{t.title}</span>
                        </span>
                        {t.timeType === 'timed' && t.startTime && (
                          <span className="week-grid-task-time">{t.startTime}</span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <button className="fab" onClick={() => setAddDate(todayIsoStr)}>
        +
      </button>

      {addDate && <TaskFormModal defaultDate={addDate} onClose={() => setAddDate(undefined)} />}
      {previewing && (
        <TaskPreviewModal
          task={previewing.task}
          dateIso={previewing.dateIso}
          onClose={() => setPreviewing(undefined)}
          onEdit={() => {
            setEditing(previewing.task)
            setPreviewing(undefined)
          }}
        />
      )}
      {editing && (
        <TaskFormModal editingTask={editing} defaultDate={todayIsoStr} onClose={() => setEditing(undefined)} />
      )}
    </div>
  )
}
