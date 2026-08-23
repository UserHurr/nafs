import { Bell, Check, Repeat } from 'lucide-react'
import type { Task } from '../types'
import { useStore } from '../store'
import { useConfettiBurst } from './Confetti'
import { myMemberId } from '../syncStore'
import { isShared, taskCompletionKey } from '../lib/members'
import { Icon } from '../lib/icons'
import { vibrateDone } from '../lib/haptics'

export function TaskRow({
  task,
  dateIso,
  onEdit,
}: {
  task: Task
  dateIso: string
  onEdit: () => void
}) {
  const category = useStore((s) => s.categories.find((c) => c.id === task.categoryId))
  const members = useStore((s) => s.members)
  const me = myMemberId()
  const done = useStore((s) => !!s.taskCompletions[taskCompletionKey(task.id, dateIso, me)])
  const toggleTaskDone = useStore((s) => s.toggleTaskDone)
  const { fire, node } = useConfettiBurst()

  const shared = isShared(task.ownerId) && members.length > 1
  const partner = shared ? members.find((m) => m.id !== me) : undefined
  const partnerDone = useStore((s) =>
    partner ? !!s.taskCompletions[taskCompletionKey(task.id, dateIso, partner.id)] : false,
  )

  const handleToggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!done) {
      const rect = e.currentTarget.getBoundingClientRect()
      fire(rect.left + rect.width / 2, rect.top + rect.height / 2)
      vibrateDone()
    }
    toggleTaskDone(task.id, dateIso)
  }

  return (
    <div className={`task-row ${done ? 'task-done' : ''}`}>
      {node}
      <button className="task-check" style={{ borderColor: category?.color }} onClick={handleToggle}>
        {done && <Check size={14} strokeWidth={3} />}
      </button>
      <button className="task-body" onClick={onEdit}>
        <Icon name={category?.icon} className="task-emoji" style={{ color: category?.color }} />
        <span className="task-title">{task.title}</span>
        {task.timeType === 'timed' && task.startTime && <span className="task-time">{task.startTime}</span>}
        {task.recurrence && <Repeat size={13} className="task-recurring" />}
        {task.reminder && <Bell size={13} className="task-recurring" />}
      </button>
      {partner && (
        <span className={`partner-badge ${partnerDone ? 'partner-badge-done' : ''}`} title={partner.name}>
          <Icon name={partner.icon} size={14} />
        </span>
      )}
    </div>
  )
}
