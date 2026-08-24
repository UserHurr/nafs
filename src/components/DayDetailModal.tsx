import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useStore } from '../store'
import { tasksOnDate } from '../lib/recurrence'
import { fromIso, fullDayLabel } from '../lib/dates'
import { TaskRow } from './TaskRow'
import { TaskFormModal } from './TaskFormModal'
import { visibleTasks, type OwnershipFilter } from '../lib/members'
import { myMemberId } from '../syncStore'
import type { Task } from '../types'

export function DayDetailModal({
  dateIso,
  filter,
  onClose,
}: {
  dateIso: string
  filter: OwnershipFilter
  onClose: () => void
}) {
  const tasks = useStore((s) => s.tasks)
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState<Task | undefined>(undefined)

  const myTasks = visibleTasks(tasks, myMemberId(), filter)
  const dayTasks = tasksOnDate(myTasks, dateIso)

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-handle" />
        <h2>{fullDayLabel(fromIso(dateIso))}</h2>

        <div className="task-list">
          {dayTasks.length === 0 && <div className="empty-state">Rien de prévu</div>}
          {dayTasks.map((t) => (
            <TaskRow key={t.id} task={t} dateIso={dateIso} onEdit={() => setEditing(t)} />
          ))}
        </div>

        <div className="modal-actions">
          <button className="btn-ghost" onClick={onClose}>
            Fermer
          </button>
          <button className="btn-primary" onClick={() => setShowAdd(true)}>
            <Plus size={15} /> Ajouter
          </button>
        </div>
      </div>

      {showAdd && <TaskFormModal defaultDate={dateIso} onClose={() => setShowAdd(false)} />}
      {editing && <TaskFormModal editingTask={editing} defaultDate={dateIso} onClose={() => setEditing(undefined)} />}
    </div>
  )
}
