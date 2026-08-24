import { Bell, Check, Pencil, Repeat } from 'lucide-react'
import { useStore } from '../store'
import { myMemberId } from '../syncStore'
import { isShared, taskCompletionKey } from '../lib/members'
import { Icon } from '../lib/icons'
import { useConfettiBurst } from './Confetti'
import { vibrateDone } from '../lib/haptics'
import type { Task } from '../types'

export function TaskPreviewModal({
  task,
  dateIso,
  onEdit,
  onClose,
}: {
  task: Task
  dateIso: string
  onEdit: () => void
  onClose: () => void
}) {
  const category = useStore((s) => s.categories.find((c) => c.id === task.categoryId))
  const members = useStore((s) => s.members)
  const taskCompletions = useStore((s) => s.taskCompletions)
  const toggleTaskDone = useStore((s) => s.toggleTaskDone)
  const { fire, node } = useConfettiBurst()

  const me = myMemberId()
  const done = !!taskCompletions[taskCompletionKey(task.id, dateIso, me)]
  const shared = isShared(task.ownerId) && members.length > 1
  const partner = shared ? members.find((m) => m.id !== me) : undefined
  const partnerDone = partner ? !!taskCompletions[taskCompletionKey(task.id, dateIso, partner.id)] : false
  const owner = !shared ? members.find((m) => m.id === task.ownerId) : undefined

  const handleToggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!done) {
      const rect = e.currentTarget.getBoundingClientRect()
      fire(rect.left + rect.width / 2, rect.top + rect.height / 2)
      vibrateDone()
    }
    toggleTaskDone(task.id, dateIso)
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      {node}
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-handle" />

        <div className="preview-header">
          <span className="preview-icon" style={{ background: category?.color ?? 'var(--accent)' }}>
            <Icon name={category?.icon} size={20} style={{ color: 'white' }} />
          </span>
          <div>
            <div className={`preview-title ${done ? 'preview-title-done' : ''}`}>{task.title}</div>
            {category && <div className="stats-sub">{category.name}</div>}
          </div>
        </div>

        <div className="chip-row" style={{ marginTop: 14 }}>
          {task.timeType === 'timed' && task.startTime && (
            <span className="chip">
              {task.startTime}
              {task.duration ? ` · ${task.duration} min` : ''}
            </span>
          )}
          {task.recurrence && (
            <span className="chip">
              <Repeat size={13} /> Récurrente
            </span>
          )}
          {task.reminder && (
            <span className="chip">
              <Bell size={13} /> Rappel
            </span>
          )}
          {owner && members.length > 1 && (
            <span className="chip">
              <Icon name={owner.icon} size={13} /> {owner.name}
            </span>
          )}
          {shared && (
            <span className="chip">
              <Icon name="users" size={13} /> Nous
            </span>
          )}
        </div>

        {task.notes && <div className="preview-notes">{task.notes}</div>}

        <button className={`qada-check-button ${done ? 'qada-check-button-done' : ''}`} onClick={handleToggle}>
          <span className="qada-check-circle">{done && <Check size={18} strokeWidth={3} />}</span>
          <span>{done ? 'Terminée' : 'Marquer comme faite'}</span>
        </button>

        {partner && (
          <div className="stats-sub row-gap" style={{ marginTop: 10 }}>
            <span className={`partner-badge ${partnerDone ? 'partner-badge-done' : ''}`}>
              <Icon name={partner.icon} size={14} />
            </span>
            {partner.name} {partnerDone ? 'a terminé' : "n'a pas encore terminé"}
          </div>
        )}

        <div className="modal-actions">
          <button className="btn-ghost" onClick={onClose}>
            Fermer
          </button>
          <button className="btn-primary" onClick={onEdit}>
            <Pencil size={15} /> Modifier
          </button>
        </div>
      </div>
    </div>
  )
}
