import { useState } from 'react'
import { Flame, Repeat2, Trash2 } from 'lucide-react'
import { useStore } from '../store'
import { myMemberId } from '../syncStore'
import { Icon, routineIconChoices } from '../lib/icons'
import { habitCompletionKey, visibleHabits } from '../lib/members'
import { addDays, dayNumber, isSameMonth, isToday, monthGrid, todayIso, toIso, weekDays, weekdayShort } from '../lib/dates'
import { OwnerPicker } from '../components/OwnerPicker'
import { vibrateDone } from '../lib/haptics'
import type { Habit } from '../types'

type Granularity = 'week' | 'month'

function computeHabitStreak(completions: Record<string, boolean>, habitId: string, me: string): number {
  let streak = 0
  let cursor = new Date()
  for (let i = 0; i < 3650; i++) {
    const iso = toIso(cursor)
    const done = !!completions[habitCompletionKey(habitId, iso, me)]
    if (!done) {
      if (i === 0) {
        cursor = addDays(cursor, -1)
        continue
      }
      break
    }
    streak++
    cursor = addDays(cursor, -1)
  }
  return streak
}

function HabitCard({ habit, granularity }: { habit: Habit; granularity: Granularity }) {
  const me = myMemberId()
  const habitCompletions = useStore((s) => s.habitCompletions)
  const toggleHabitDay = useStore((s) => s.toggleHabitDay)
  const removeHabit = useStore((s) => s.removeHabit)

  const streak = computeHabitStreak(habitCompletions, habit.id, me)
  const todayIsoStr = todayIso()
  const today = new Date()
  const days = granularity === 'week' ? weekDays(today) : monthGrid(today)

  return (
    <div className="stats-card habit-card">
      <div className="habit-card-header">
        <Icon name={habit.icon} size={17} />
        <span className="habit-card-name">{habit.name}</span>
        {streak > 0 && (
          <span className="streak-badge row-gap">
            <Flame size={12} /> {streak}j
          </span>
        )}
        <button className="task-delete" onClick={() => removeHabit(habit.id)}>
          <Trash2 size={14} />
        </button>
      </div>
      <div className={`habit-dot-grid habit-dot-grid-${granularity}`}>
        {days.map((d) => {
          const iso = toIso(d)
          const done = !!habitCompletions[habitCompletionKey(habit.id, iso, me)]
          const future = iso > todayIsoStr
          const dim = granularity === 'month' && !isSameMonth(d, today)
          return (
            <button
              key={iso}
              className={`habit-dot ${done ? 'habit-dot-done' : ''} ${isToday(d) ? 'habit-dot-today' : ''} ${dim ? 'habit-dot-dim' : ''}`}
              disabled={future}
              onClick={() => {
                if (!done) vibrateDone()
                toggleHabitDay(habit.id, iso)
              }}
            >
              {granularity === 'week' ? weekdayShort(d) : dayNumber(d)}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function HabitsPage() {
  const me = myMemberId()
  const habits = useStore((s) => s.habits)
  const addHabit = useStore((s) => s.addHabit)

  const [granularity, setGranularity] = useState<Granularity>('week')
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [newIcon, setNewIcon] = useState(routineIconChoices[0])
  const [newOwnerId, setNewOwnerId] = useState(me)

  const items = visibleHabits(habits, me)

  return (
    <div className="page">
      <h1 className="page-title row-gap">
        <Repeat2 size={24} strokeWidth={2.2} /> Habitudes
      </h1>

      <div className="segmented">
        <button className={granularity === 'week' ? 'active' : ''} onClick={() => setGranularity('week')}>
          Semaine
        </button>
        <button className={granularity === 'month' ? 'active' : ''} onClick={() => setGranularity('month')}>
          Mois
        </button>
      </div>

      {items.length === 0 && !adding && (
        <div className="stats-card" style={{ marginTop: 12 }}>
          <div className="stats-sub">
            Aucune habitude pour l'instant. Ajoute par exemple "Dhikr" ou "Coran" pour suivre ta régularité jour
            après jour.
          </div>
        </div>
      )}

      {items.map((h) => (
        <HabitCard key={h.id} habit={h} granularity={granularity} />
      ))}

      {adding ? (
        <div className="new-category-box" style={{ marginTop: 12 }}>
          <div className="emoji-grid">
            {routineIconChoices.map((key) => (
              <button
                key={key}
                className={`emoji-btn ${newIcon === key ? 'emoji-btn-active' : ''}`}
                onClick={() => setNewIcon(key)}
              >
                <Icon name={key} size={16} />
              </button>
            ))}
          </div>
          <OwnerPicker value={newOwnerId} onChange={setNewOwnerId} />
          <div className="row-gap" style={{ marginTop: 8 }}>
            <input
              className="text-input"
              placeholder="Ex : Dhikr"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <button
              className="btn-small"
              onClick={() => {
                if (!newName.trim()) return
                addHabit(newName.trim(), newIcon, newOwnerId)
                setNewName('')
                setAdding(false)
              }}
            >
              Ajouter
            </button>
          </div>
        </div>
      ) : (
        <button className="chip chip-dashed" style={{ marginTop: 12 }} onClick={() => setAdding(true)}>
          + Habitude
        </button>
      )}
    </div>
  )
}
