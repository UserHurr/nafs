import { useState } from 'react'
import { addDays, fullDayLabel, toIso } from '../lib/dates'
import { DayTimeline } from './DayTimeline'
import { TaskFormModal } from './TaskFormModal'
import type { Task } from '../types'

export function DayView({ anchor, onAnchorChange }: { anchor: Date; onAnchorChange: (d: Date) => void }) {
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState<Task | undefined>(undefined)
  const dateIso = toIso(anchor)

  return (
    <div className="view-container">
      <div className="month-nav">
        <button className="nav-arrow" onClick={() => onAnchorChange(addDays(anchor, -1))}>
          ‹
        </button>
        <div className="day-header" style={{ margin: 0 }}>
          {fullDayLabel(anchor)}
        </div>
        <button className="nav-arrow" onClick={() => onAnchorChange(addDays(anchor, 1))}>
          ›
        </button>
      </div>

      <div style={{ marginTop: 14 }}>
        <DayTimeline dateIso={dateIso} onEditTask={setEditing} />
      </div>

      <button className="fab" onClick={() => setShowAdd(true)}>
        +
      </button>

      {showAdd && <TaskFormModal defaultDate={dateIso} onClose={() => setShowAdd(false)} />}
      {editing && <TaskFormModal editingTask={editing} defaultDate={dateIso} onClose={() => setEditing(undefined)} />}
    </div>
  )
}
