import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useStore } from '../store'
import { tasksOnDate } from '../lib/recurrence'
import {
  addMonths,
  dayNumber,
  fullDayLabel,
  isSameDay,
  isSameMonth,
  isToday,
  monthGrid,
  monthLabel,
  toIso,
} from '../lib/dates'
import { TaskRow } from './TaskRow'
import { TaskFormModal } from './TaskFormModal'
import type { Task } from '../types'
import { myMemberId } from '../syncStore'
import { visibleTasks } from '../lib/members'
import { useSwipeNav } from '../hooks/useSwipeNav'

const weekdayHeaders = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

export function MonthView({ anchor, onAnchorChange }: { anchor: Date; onAnchorChange: (d: Date) => void }) {
  const tasks = useStore((s) => s.tasks)
  const categories = useStore((s) => s.categories)
  const [selected, setSelected] = useState(anchor)
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState<Task | undefined>(undefined)
  const [dir, setDir] = useState(1)

  const myTasks = visibleTasks(tasks, myMemberId())
  const days = monthGrid(anchor)
  const selectedIso = toIso(selected)
  const dayTasks = tasksOnDate(myTasks, selectedIso)

  const goToMonth = (d: Date, direction: number) => {
    setDir(direction)
    onAnchorChange(d)
  }

  const swipe = useSwipeNav(
    () => goToMonth(addMonths(anchor, -1), -1),
    () => goToMonth(addMonths(anchor, 1), 1),
  )

  return (
    <div className="view-container" {...swipe}>
      <div className="month-nav">
        <button className="nav-arrow" onClick={() => goToMonth(addMonths(anchor, -1), -1)}>
          <ChevronLeft size={18} />
        </button>
        <div className="month-label">{monthLabel(anchor)}</div>
        <button className="nav-arrow" onClick={() => goToMonth(addMonths(anchor, 1), 1)}>
          <ChevronRight size={18} />
        </button>
      </div>

      <div key={monthLabel(anchor)} className="view-slide" style={{ '--dir': dir } as React.CSSProperties}>
      <div className="month-grid-headers">
        {weekdayHeaders.map((w, i) => (
          <div key={i} className="month-grid-header">
            {w}
          </div>
        ))}
      </div>

      <div className="month-grid">
        {days.map((d) => {
          const iso = toIso(d)
          const dTasks = tasksOnDate(myTasks, iso)
          const dotColors = Array.from(
            new Set(dTasks.map((t) => categories.find((c) => c.id === t.categoryId)?.color).filter(Boolean)),
          ).slice(0, 3) as string[]
          return (
            <button
              key={iso}
              className={`month-cell ${isSameMonth(d, anchor) ? '' : 'month-cell-outside'} ${isSameDay(d, selected) ? 'month-cell-selected' : ''} ${isToday(d) ? 'month-cell-today' : ''}`}
              onClick={() => setSelected(d)}
            >
              <span className="month-cell-num">{dayNumber(d)}</span>
              <span className="month-cell-dots">
                {dotColors.map((c, i) => (
                  <span key={i} className="month-cell-dot" style={{ background: c }} />
                ))}
              </span>
            </button>
          )
        })}
      </div>

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
