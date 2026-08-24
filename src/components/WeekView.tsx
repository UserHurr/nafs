import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useStore } from '../store'
import { tasksOnDate } from '../lib/recurrence'
import { addWeeks, dayNumber, fullDayLabel, toIso, weekDays } from '../lib/dates'
import { TaskFormModal } from './TaskFormModal'
import { TaskPreviewModal } from './TaskPreviewModal'
import { TaskRow } from './TaskRow'
import { visibleTasks, type OwnershipFilter } from '../lib/members'
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
  const [showAdd, setShowAdd] = useState(false)
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

      <div key={toIso(anchor)} className="view-slide" style={{ '--dir': dir } as React.CSSProperties}>
        {days.map((d) => {
          const iso = toIso(d)
          const dayTasks = tasksOnDate(myTasks, iso)
          return (
            <div key={iso} className="week-day-section">
              <div className={`week-day-header ${iso === todayIsoStr ? 'week-day-header-today' : ''}`}>
                {fullDayLabel(d)}
              </div>
              <div className="task-list">
                {dayTasks.length === 0 && <div className="empty-state">Rien de prévu</div>}
                {dayTasks.map((t) => (
                  <TaskRow key={t.id} task={t} dateIso={iso} onEdit={() => setPreviewing({ task: t, dateIso: iso })} />
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <button className="fab" onClick={() => setShowAdd(true)}>
        +
      </button>

      {showAdd && <TaskFormModal defaultDate={todayIsoStr} onClose={() => setShowAdd(false)} />}
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
