import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { addDays, fullDayLabel, toIso } from '../lib/dates'
import { DayTimeline } from './DayTimeline'
import { TaskFormModal } from './TaskFormModal'
import type { Task } from '../types'
import { useSwipeNav } from '../hooks/useSwipeNav'
import type { OwnershipFilter } from '../lib/members'

export function DayView({
  anchor,
  onAnchorChange,
  filter,
}: {
  anchor: Date
  onAnchorChange: (d: Date) => void
  filter: OwnershipFilter
}) {
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState<Task | undefined>(undefined)
  const [dir, setDir] = useState(1)
  const dateIso = toIso(anchor)

  const goToDay = (d: Date, direction: number) => {
    setDir(direction)
    onAnchorChange(d)
  }

  const swipe = useSwipeNav(
    () => goToDay(addDays(anchor, -1), -1),
    () => goToDay(addDays(anchor, 1), 1),
    '.timeline-task',
  )

  return (
    <div className="view-container" {...swipe}>
      <div className="month-nav">
        <button className="nav-arrow" onClick={() => goToDay(addDays(anchor, -1), -1)}>
          <ChevronLeft size={18} />
        </button>
        <div className="day-header" style={{ margin: 0 }}>
          {fullDayLabel(anchor)}
        </div>
        <button className="nav-arrow" onClick={() => goToDay(addDays(anchor, 1), 1)}>
          <ChevronRight size={18} />
        </button>
      </div>

      <div key={dateIso} className="view-slide" style={{ marginTop: 14, '--dir': dir } as React.CSSProperties}>
        <DayTimeline dateIso={dateIso} onEditTask={setEditing} filter={filter} />
      </div>

      <button className="fab" onClick={() => setShowAdd(true)}>
        +
      </button>

      {showAdd && <TaskFormModal defaultDate={dateIso} onClose={() => setShowAdd(false)} />}
      {editing && <TaskFormModal editingTask={editing} defaultDate={dateIso} onClose={() => setEditing(undefined)} />}
    </div>
  )
}
