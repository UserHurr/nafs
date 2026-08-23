import { useState } from 'react'
import { useStore } from '../store'
import { todayIso } from '../lib/dates'
import { routineStreak } from '../lib/stats'
import { useConfettiBurst } from '../components/Confetti'
import { OwnerPicker } from '../components/OwnerPicker'
import { myMemberId } from '../syncStore'
import { isShared, routineCompletionKey, visibleRoutineItems } from '../lib/members'
import type { RoutineType } from '../types'

const emojiChoices = ['💧', '🧘', '🍳', '🧹', '📖', '🗒️', '🪥', '🚿', '🧴', '🏃', '🧠', '☕', '📵', '🕯️', '🌤️']

function RoutineSection({ type, title, icon }: { type: RoutineType; title: string; icon: string }) {
  const allItems = useStore((s) => s.routines[type])
  const members = useStore((s) => s.members)
  const toggleRoutineItem = useStore((s) => s.toggleRoutineItem)
  const routineCompletions = useStore((s) => s.routineCompletions)
  const addRoutineItem = useStore((s) => s.addRoutineItem)
  const removeRoutineItem = useStore((s) => s.removeRoutineItem)
  const me = myMemberId()
  const iso = todayIso()
  const { fire, node } = useConfettiBurst()

  const items = visibleRoutineItems(allItems, me)

  const [adding, setAdding] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newEmoji, setNewEmoji] = useState(emojiChoices[0])
  const [newOwnerId, setNewOwnerId] = useState(me)

  const doneCount = items.filter((i) => routineCompletions[routineCompletionKey(type, i.id, iso, me)]).length
  const streak = routineStreak(items, routineCompletions, type, new Date(), me)

  const handleToggle = (e: React.MouseEvent<HTMLButtonElement>, itemId: string, wasDone: boolean) => {
    if (!wasDone) {
      const rect = e.currentTarget.getBoundingClientRect()
      fire(rect.left + rect.width / 2, rect.top + rect.height / 2)
    }
    toggleRoutineItem(type, itemId, iso)
  }

  return (
    <div className="routine-section">
      {node}
      <div className="routine-header">
        <span>
          {icon} {title}
        </span>
        <span className="row-gap">
          {streak > 0 && <span className="streak-badge">🔥 {streak}j</span>}
          <span className="routine-progress">
            {doneCount}/{items.length}
          </span>
        </span>
      </div>

      <div className="task-list">
        {items.map((item) => {
          const done = !!routineCompletions[routineCompletionKey(type, item.id, iso, me)]
          const shared = isShared(item.ownerId) && members.length > 1
          const partner = shared ? members.find((m) => m.id !== me) : undefined
          const partnerDone = partner
            ? !!routineCompletions[routineCompletionKey(type, item.id, iso, partner.id)]
            : false
          return (
            <div key={item.id} className={`task-row ${done ? 'task-done' : ''}`}>
              <button className="task-check" onClick={(e) => handleToggle(e, item.id, done)}>
                {done ? '✔' : ''}
              </button>
              <button className="task-body" onClick={(e) => handleToggle(e, item.id, done)}>
                <span className="task-emoji">{item.emoji}</span>
                <span className="task-title">{item.title}</span>
              </button>
              {partner && (
                <span className={`partner-badge ${partnerDone ? 'partner-badge-done' : ''}`} title={partner.name}>
                  {partner.emoji}
                </span>
              )}
              <button className="task-delete" onClick={() => removeRoutineItem(type, item.id)}>
                🗑️
              </button>
            </div>
          )
        })}
      </div>

      {adding ? (
        <div className="new-category-box">
          <div className="emoji-grid">
            {emojiChoices.map((e) => (
              <button
                key={e}
                className={`emoji-btn ${newEmoji === e ? 'emoji-btn-active' : ''}`}
                onClick={() => setNewEmoji(e)}
              >
                {e}
              </button>
            ))}
          </div>
          <OwnerPicker value={newOwnerId} onChange={setNewOwnerId} />
          <div className="row-gap" style={{ marginTop: 8 }}>
            <input
              className="text-input"
              placeholder="Ex : Méditation"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />
            <button
              className="btn-small"
              onClick={() => {
                if (!newTitle.trim()) return
                addRoutineItem(type, newTitle.trim(), newEmoji, newOwnerId)
                setNewTitle('')
                setAdding(false)
              }}
            >
              Ajouter
            </button>
          </div>
        </div>
      ) : (
        <button className="chip chip-dashed" onClick={() => setAdding(true)}>
          + Étape
        </button>
      )}
    </div>
  )
}

export function RoutinesPage() {
  return (
    <div className="page">
      <h1 className="page-title">🌗 Routines</h1>
      <RoutineSection type="morning" title="Routine du matin" icon="🌅" />
      <RoutineSection type="evening" title="Routine du soir" icon="🌙" />
    </div>
  )
}
