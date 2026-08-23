import { useEffect, useRef, useState } from 'react'
import { Check } from 'lucide-react'
import { useStore } from '../store'
import { tasksOnDate } from '../lib/recurrence'
import { minutesToTime, timeToMinutes } from '../lib/dates'
import type { Task } from '../types'
import { myMemberId } from '../syncStore'
import { taskCompletionKey, visibleTasks, type OwnershipFilter } from '../lib/members'
import { Icon } from '../lib/icons'
import { vibrateDone } from '../lib/haptics'

const ROW_HEIGHT = 56
const PX_PER_MIN = ROW_HEIGHT / 60
const SNAP_MIN = 15
const START_HOUR = 5
const DAY_MIN = 24 * 60
const displayHours = Array.from({ length: 24 }, (_, i) => (START_HOUR + i) % 24)

/** Minutes-from-midnight, remapped so the visible day starts at START_HOUR. */
function toDisplayOffset(minutes: number): number {
  return (minutes - START_HOUR * 60 + DAY_MIN) % DAY_MIN
}

export function DayTimeline({
  dateIso,
  onEditTask,
  filter,
}: {
  dateIso: string
  onEditTask: (task: Task) => void
  filter: OwnershipFilter
}) {
  const tasks = useStore((s) => s.tasks)
  const categories = useStore((s) => s.categories)
  const taskCompletions = useStore((s) => s.taskCompletions)
  const toggleTaskDone = useStore((s) => s.toggleTaskDone)
  const updateTask = useStore((s) => s.updateTask)

  const me = myMemberId()
  const dayTasks = tasksOnDate(visibleTasks(tasks, me, filter), dateIso)
  const allDayTasks = dayTasks.filter((t) => t.timeType === 'allday')
  const timedTasks = dayTasks.filter((t) => t.timeType === 'timed' && t.startTime)

  const [drag, setDrag] = useState<{ taskId: string; startY: number; offsetMin: number; moved: boolean } | null>(
    null,
  )

  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const now = new Date()
    const rowIndex = toDisplayOffset(now.getHours() * 60 + now.getMinutes()) / 60
    containerRef.current?.scrollTo({ top: Math.max(0, (rowIndex - 1) * ROW_HEIGHT) })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handlePointerDown = (e: React.PointerEvent, task: Task) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    setDrag({ taskId: task.id, startY: e.clientY, offsetMin: 0, moved: false })
  }

  const handlePointerMove = (e: React.PointerEvent, task: Task) => {
    if (!drag || drag.taskId !== task.id) return
    const deltaY = e.clientY - drag.startY
    if (Math.abs(deltaY) > 3) {
      const rawMin = deltaY / PX_PER_MIN
      const snapped = Math.round(rawMin / SNAP_MIN) * SNAP_MIN
      setDrag({ ...drag, offsetMin: snapped, moved: true })
    }
  }

  const handlePointerUp = (e: React.PointerEvent, task: Task) => {
    if (!drag || drag.taskId !== task.id) return
    e.currentTarget.releasePointerCapture(e.pointerId)
    if (drag.moved && task.startTime) {
      const newMinutes = timeToMinutes(task.startTime) + drag.offsetMin
      updateTask(task.id, { startTime: minutesToTime(newMinutes) })
    } else {
      onEditTask(task)
    }
    setDrag(null)
  }

  return (
    <div className="timeline-wrap">
      {allDayTasks.length > 0 && (
        <div className="timeline-allday">
          {allDayTasks.map((t) => {
            const category = categories.find((c) => c.id === t.categoryId)
            const done = !!taskCompletions[taskCompletionKey(t.id, dateIso, me)]
            return (
              <button
                key={t.id}
                className={`timeline-allday-chip ${done ? 'task-done' : ''}`}
                style={{ background: category?.color }}
                onClick={() => onEditTask(t)}
              >
                <Icon name={category?.icon} size={13} /> {t.title}
              </button>
            )
          })}
        </div>
      )}

      <div className="timeline-scroll" ref={containerRef}>
        <div className="timeline-grid" style={{ height: 24 * ROW_HEIGHT }}>
          {displayHours.map((h, i) => (
            <div key={i} className="timeline-row" style={{ height: ROW_HEIGHT }}>
              <span className="timeline-hour-label">{String(h).padStart(2, '0')}:00</span>
            </div>
          ))}

          {timedTasks.map((t) => {
            const category = categories.find((c) => c.id === t.categoryId)
            const done = !!taskCompletions[taskCompletionKey(t.id, dateIso, me)]
            const minutes = timeToMinutes(t.startTime!)
            const duration = t.duration ?? 30
            const isDragging = drag?.taskId === t.id
            const top = toDisplayOffset(minutes) * PX_PER_MIN + (isDragging ? drag.offsetMin * PX_PER_MIN : 0)
            const height = Math.max(26, duration * PX_PER_MIN)
            const displayMinutes = isDragging ? minutes + drag.offsetMin : minutes

            return (
              <div
                key={t.id}
                className={`timeline-task ${done ? 'task-done' : ''} ${isDragging ? 'timeline-task-dragging' : ''}`}
                style={{
                  top,
                  height,
                  background: category?.color ?? 'var(--accent)',
                }}
                onPointerDown={(e) => handlePointerDown(e, t)}
                onPointerMove={(e) => handlePointerMove(e, t)}
                onPointerUp={(e) => handlePointerUp(e, t)}
              >
                <button
                  className="timeline-task-check"
                  onClick={(e) => {
                    e.stopPropagation()
                    if (!done) vibrateDone()
                    toggleTaskDone(t.id, dateIso)
                  }}
                >
                  {done && <Check size={10} strokeWidth={3} />}
                </button>
                <span className="timeline-task-title">
                  <Icon name={category?.icon} size={12} /> {t.title}
                </span>
                <span className="timeline-task-time">{minutesToTime(displayMinutes)}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
