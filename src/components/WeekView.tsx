import { useState } from 'react'
import { useStore } from '../store'
import { tasksOnDate } from '../lib/recurrence'
import { addWeeks, dayNumber, fullDayLabel, isSameDay, isToday, toIso, weekDays, weekdayShort } from '../lib/dates'
import { TaskRow } from './TaskRow'
import { TaskFormModal } from './TaskFormModal'
import type { Task } from '../types'
import { myMemberId } from '../syncStore'
import { visibleTasks } from '../lib/members'

export function WeekView({ anchor, onAnchorChange }: { anchor: Date; onAnchorChange: (d: Date) => void }) {
  const tasks = useStore((s) => s.tasks)
  const [selected, setSelected] = useState(anchor)
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState<Task | undefined>(undefined)

  const days = weekDays(anchor)
  const selectedIso = toIso(selected)
  const dayTasks = tasksOnDate(visibleTasks(tasks, myMemberId()), selectedIso)

  return (
    <div className="view-container">
      <div className="week-nav">
        <button className="nav-arrow" onClick={() => onAnchorChange(addWeeks(anchor, -1))}>
          ‹
        </button>
        <div className="week-strip">
          {days.map((d) => (
            <button
              key={d.toISOString()}
              className={`week-day ${isSameDay(d, selected) ? 'week-day-active' : ''} ${isToday(d) ? 'week-day-today' : ''}`}
              onClick={() => setSelected(d)}
            >
              <span className="week-day-label">{weekdayShort(d)}</span>
              <span className="week-day-num">{dayNumber(d)}</span>
            </button>
          ))}
        </div>
        <button className="nav-arrow" onClick={() => onAnchorChange(addWeeks(anchor, 1))}>
          ›
        </button>
      </div>

      <div className="day-header">{fullDayLabel(selected)}</div>

      <div className="task-list">
        {dayTasks.length === 0 && <div className="empty-state">Rien de prévu — profite ✨</div>}
        {dayTasks.map((t) => (
          <TaskRow key={t.id} task={t} dateIso={selectedIso} onEdit={() => setEditing(t)} />
        ))}
      </div>

      <button className="fab" onClick={() => setShowAdd(true)}>
        +
      </button>

      {showAdd && <TaskFormModal defaultDate={selectedIso} onClose={() => setShowAdd(false)} />}
      {editing && <TaskFormModal editingTask={editing} defaultDate={selectedIso} onClose={() => setEditing(undefined)} />}
    </div>
  )
}
