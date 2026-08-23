import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useStore } from '../store'
import { tasksOnDate } from '../lib/recurrence'
import { addWeeks, dayNumber, fullDayLabel, isSameDay, isToday, toIso, weekDays, weekdayShort } from '../lib/dates'
import { TaskRow } from './TaskRow'
import { TaskFormModal } from './TaskFormModal'
import type { Task } from '../types'
import { myMemberId } from '../syncStore'
import { visibleTasks, type OwnershipFilter } from '../lib/members'
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
  const [selected, setSelected] = useState(anchor)
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState<Task | undefined>(undefined)
  const [dir, setDir] = useState(1)

  const days = weekDays(anchor)
  const selectedIso = toIso(selected)
  const myTasks = visibleTasks(tasks, myMemberId(), filter)
  const dayTasks = tasksOnDate(myTasks, selectedIso)

  const goToDay = (d: Date, direction: number) => {
    setDir(direction)
    setSelected(d)
    onAnchorChange(d)
  }

  const goToWeek = (direction: number) => {
    setDir(direction)
    setSelected((s) => addWeeks(s, direction))
    onAnchorChange(addWeeks(anchor, direction))
  }

  const swipe = useSwipeNav(
    () => goToWeek(-1),
    () => goToWeek(1),
  )

  return (
    <div className="view-container" {...swipe}>
      <div className="week-nav">
        <button className="nav-arrow" onClick={() => goToWeek(-1)}>
          <ChevronLeft size={18} />
        </button>
        <div className="week-strip">
          {days.map((d) => {
            const iso = toIso(d)
            const dotColors = Array.from(
              new Set(
                tasksOnDate(myTasks, iso)
                  .map((t) => categories.find((c) => c.id === t.categoryId)?.color)
                  .filter(Boolean),
              ),
            ).slice(0, 3) as string[]
            return (
              <button
                key={d.toISOString()}
                className={`week-day ${isSameDay(d, selected) ? 'week-day-active' : ''} ${isToday(d) ? 'week-day-today' : ''}`}
                onClick={() => goToDay(d, isSameDay(d, selected) ? 1 : d < selected ? -1 : 1)}
              >
                <span className="week-day-label">{weekdayShort(d)}</span>
                <span className="week-day-num">{dayNumber(d)}</span>
                <span className="week-day-dots">
                  {dotColors.map((c, i) => (
                    <span key={i} className="week-day-dot" style={{ background: c }} />
                  ))}
                </span>
              </button>
            )
          })}
        </div>
        <button className="nav-arrow" onClick={() => goToWeek(1)}>
          <ChevronRight size={18} />
        </button>
      </div>

      <div key={selectedIso} className="view-slide" style={{ '--dir': dir } as React.CSSProperties}>
        <div className="day-header">{fullDayLabel(selected)}</div>

        <div className="task-list">
          {dayTasks.length === 0 && <div className="empty-state">Rien de prévu</div>}
          {dayTasks.map((t) => (
            <TaskRow key={t.id} task={t} dateIso={selectedIso} onEdit={() => setEditing(t)} />
          ))}
        </div>
      </div>

      <button className="fab" onClick={() => setShowAdd(true)}>
        +
      </button>

      {showAdd && <TaskFormModal defaultDate={selectedIso} onClose={() => setShowAdd(false)} />}
      {editing && <TaskFormModal editingTask={editing} defaultDate={selectedIso} onClose={() => setEditing(undefined)} />}
    </div>
  )
}
