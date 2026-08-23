import { useState } from 'react'
import { AlertTriangle, Calendar, Check, ListChecks, Trash2 } from 'lucide-react'
import { useStore } from '../store'
import { todayIso } from '../lib/dates'
import { useConfettiBurst } from '../components/Confetti'
import { OwnerPicker } from '../components/OwnerPicker'
import { myMemberId } from '../syncStore'
import { isShared, visibleTodos } from '../lib/members'
import { Icon } from '../lib/icons'
import { useToastStore } from '../toastStore'
import { vibrateDone } from '../lib/haptics'
import type { Priority, Todo } from '../types'

const priorityMeta: Record<Priority, { label: string; color: string }> = {
  low: { label: 'Basse', color: '#22c55e' },
  medium: { label: 'Moyenne', color: '#eab308' },
  high: { label: 'Haute', color: '#e11d48' },
}

function TodoRow({ todo }: { todo: Todo }) {
  const toggleTodo = useStore((s) => s.toggleTodo)
  const removeTodo = useStore((s) => s.removeTodo)
  const addTodo = useStore((s) => s.addTodo)
  const showToast = useToastStore((s) => s.show)
  const setTodoPriority = useStore((s) => s.setTodoPriority)
  const addSubtask = useStore((s) => s.addSubtask)
  const toggleSubtask = useStore((s) => s.toggleSubtask)
  const removeSubtask = useStore((s) => s.removeSubtask)
  const members = useStore((s) => s.members)
  const { fire, node } = useConfettiBurst()

  const [expanded, setExpanded] = useState(false)
  const [subtaskTitle, setSubtaskTitle] = useState('')

  const me = myMemberId()
  const iso = todayIso()
  const done = todo.doneBy.includes(me)
  const overdue = !!todo.dueDate && todo.dueDate < iso && !done
  const subtasks = todo.subtasks ?? []
  const doneSubtasks = subtasks.filter((s) => s.done).length

  const shared = isShared(todo.ownerId) && members.length > 1
  const partner = shared ? members.find((m) => m.id !== me) : undefined
  const partnerDone = partner ? todo.doneBy.includes(partner.id) : false

  const handleToggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!done) {
      const rect = e.currentTarget.getBoundingClientRect()
      fire(rect.left + rect.width / 2, rect.top + rect.height / 2)
      vibrateDone()
    }
    toggleTodo(todo.id)
  }

  return (
    <div className={`task-row todo-row ${done ? 'task-done' : ''}`} style={{ flexWrap: 'wrap' }}>
      {node}
      <button className="task-check" onClick={handleToggle}>
        {done && <Check size={14} strokeWidth={3} />}
      </button>
      <button className="task-body" onClick={() => setExpanded((v) => !v)}>
        {todo.priority && (
          <span className="priority-dot" style={{ background: priorityMeta[todo.priority].color }} />
        )}
        <span className="task-title">{todo.title}</span>
        {subtasks.length > 0 && (
          <span className="task-time">
            {doneSubtasks}/{subtasks.length}
          </span>
        )}
        {todo.dueDate && (
          <span className={`due-badge ${overdue ? 'due-badge-overdue' : ''}`}>
            {overdue ? <AlertTriangle size={11} /> : <Calendar size={11} />}
            {todo.dueDate.slice(5)}
          </span>
        )}
      </button>
      {partner && (
        <span className={`partner-badge ${partnerDone ? 'partner-badge-done' : ''}`} title={partner.name}>
          <Icon name={partner.icon} size={14} />
        </span>
      )}
      <button
        className="task-delete"
        onClick={() => {
          removeTodo(todo.id)
          showToast('Tâche supprimée', () => addTodo(todo.title, todo.ownerId, todo.dueDate, todo.priority))
        }}
      >
        <Trash2 size={15} />
      </button>

      {expanded && (
        <div className="subtask-panel">
          <div className="chip-row">
            {(Object.keys(priorityMeta) as Priority[]).map((p) => (
              <button
                key={p}
                className={`chip ${todo.priority === p ? 'chip-active' : ''}`}
                style={todo.priority === p ? { background: priorityMeta[p].color, borderColor: priorityMeta[p].color } : undefined}
                onClick={() => setTodoPriority(todo.id, p)}
              >
                {priorityMeta[p].label}
              </button>
            ))}
          </div>

          {subtasks.map((st) => (
            <div key={st.id} className="subtask-row">
              <button className="task-check task-check-sm" onClick={() => toggleSubtask(todo.id, st.id)}>
                {st.done && <Check size={10} strokeWidth={3} />}
              </button>
              <span className={st.done ? 'subtask-done' : ''}>{st.title}</span>
              <button className="task-delete" onClick={() => removeSubtask(todo.id, st.id)}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}

          <div className="row-gap" style={{ marginTop: 6 }}>
            <input
              className="text-input"
              placeholder="Sous-tâche…"
              value={subtaskTitle}
              onChange={(e) => setSubtaskTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && subtaskTitle.trim()) {
                  addSubtask(todo.id, subtaskTitle.trim())
                  setSubtaskTitle('')
                }
              }}
            />
            <button
              className="btn-small"
              onClick={() => {
                if (!subtaskTitle.trim()) return
                addSubtask(todo.id, subtaskTitle.trim())
                setSubtaskTitle('')
              }}
            >
              +
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export function TodoPage() {
  const todos = useStore((s) => s.todos)
  const addTodo = useStore((s) => s.addTodo)
  const [title, setTitle] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [ownerId, setOwnerId] = useState(myMemberId())

  const myTodos = visibleTodos(todos, myMemberId())
  const me = myMemberId()
  const pending = myTodos.filter((t) => !t.doneBy.includes(me))
  const done = myTodos.filter((t) => t.doneBy.includes(me))

  const submit = () => {
    if (!title.trim()) return
    addTodo(title.trim(), ownerId, dueDate || undefined)
    setTitle('')
    setDueDate('')
  }

  return (
    <div className="page">
      <h1 className="page-title row-gap">
        <ListChecks size={24} strokeWidth={2.2} /> To-Do
      </h1>

      <div className="todo-add-row">
        <input
          className="text-input"
          placeholder="Ajouter une tâche…"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
        />
        <input
          className="text-input"
          type="date"
          style={{ flex: '0 0 128px' }}
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
        <button className="btn-small" onClick={submit}>
          Ajouter
        </button>
      </div>

      <OwnerPicker value={ownerId} onChange={setOwnerId} />

      <div className="task-list" style={{ marginTop: 12 }}>
        {pending.length === 0 && done.length === 0 && <div className="empty-state">Ta liste est vide</div>}
        {pending.map((t) => (
          <TodoRow key={t.id} todo={t} />
        ))}
      </div>

      {done.length > 0 && (
        <>
          <div className="section-label">Terminées</div>
          <div className="task-list">
            {done.map((t) => (
              <TodoRow key={t.id} todo={t} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
