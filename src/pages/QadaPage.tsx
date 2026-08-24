import { useState } from 'react'
import { CalendarCheck2, Check, Flame } from 'lucide-react'
import { useStore } from '../store'
import { myMemberId } from '../syncStore'
import { addDays, todayIso, toIso } from '../lib/dates'
import { useConfettiBurst } from '../components/Confetti'
import { vibrateDone } from '../lib/haptics'

const DEFAULT_TARGET = 1825
const DEFAULT_BASE = 186

function computeStreak(qadaCompletions: Record<string, boolean>, me: string): number {
  let streak = 0
  let cursor = new Date()
  for (let i = 0; i < 3650; i++) {
    const cIso = toIso(cursor)
    const done = !!qadaCompletions[`${cIso}_${me}`]
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

export function QadaPage() {
  const me = myMemberId()
  const qadaTarget = useStore((s) => s.qadaTarget)
  const qadaBaseCount = useStore((s) => s.qadaBaseCount)
  const qadaCompletions = useStore((s) => s.qadaCompletions)
  const setQadaTarget = useStore((s) => s.setQadaTarget)
  const setQadaBaseCount = useStore((s) => s.setQadaBaseCount)
  const toggleQadaDay = useStore((s) => s.toggleQadaDay)
  const { fire, node } = useConfettiBurst()

  const target = qadaTarget[me] ?? DEFAULT_TARGET
  const base = qadaBaseCount[me] ?? DEFAULT_BASE

  const doneDays = Object.keys(qadaCompletions).filter((k) => k.endsWith(`_${me}`) && qadaCompletions[k]).length
  const total = Math.min(target, base + doneDays)
  const remaining = Math.max(0, target - total)
  const percent = target === 0 ? 0 : Math.min(100, Math.round((total / target) * 100))

  const iso = todayIso()
  const todayDone = !!qadaCompletions[`${iso}_${me}`]
  const streak = computeStreak(qadaCompletions, me)

  const [editing, setEditing] = useState(false)
  const [targetInput, setTargetInput] = useState(String(target))
  const [baseInput, setBaseInput] = useState(String(base))

  const handleToggleToday = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!todayDone) {
      const rect = e.currentTarget.getBoundingClientRect()
      fire(rect.left + rect.width / 2, rect.top + rect.height / 2)
      vibrateDone()
    }
    toggleQadaDay(iso)
  }

  const saveSettings = () => {
    setQadaTarget(me, Number(targetInput) || 0)
    setQadaBaseCount(me, Number(baseInput) || 0)
    setEditing(false)
  }

  return (
    <div className="page">
      {node}
      <h1 className="page-title row-gap">
        <CalendarCheck2 size={24} strokeWidth={2.2} /> Rattrapage
      </h1>

      <div className="stats-card">
        <div className="qada-big-number">
          {total}
          <span className="qada-target-suffix"> / {target}</span>
        </div>
        <div className="stats-sub">jours rattrapés — {remaining} restants</div>
        <div className="progress-bar">
          <div className="progress-bar-fill" style={{ width: `${percent}%` }} />
        </div>
        <div className="stats-sub" style={{ marginTop: 4 }}>
          {percent}%
        </div>
      </div>

      {streak > 0 && (
        <div className="stats-card row-gap" style={{ marginTop: 12 }}>
          <Flame size={16} color="var(--accent)" />
          <span style={{ fontWeight: 700 }}>
            {streak} jour{streak > 1 ? 's' : ''} d'affilée
          </span>
        </div>
      )}

      <button className={`qada-check-button ${todayDone ? 'qada-check-button-done' : ''}`} onClick={handleToggleToday}>
        <span className="qada-check-circle">{todayDone && <Check size={22} strokeWidth={3} />}</span>
        <span>{todayDone ? "Jour d'aujourd'hui rattrapé" : "Marquer aujourd'hui comme rattrapé"}</span>
      </button>

      <div className="section-label">Réglages</div>
      <div className="stats-card">
        {editing ? (
          <>
            <label className="field-label">Objectif (jours)</label>
            <input
              className="text-input"
              type="number"
              min={0}
              value={targetInput}
              onChange={(e) => setTargetInput(e.target.value)}
            />
            <label className="field-label">Déjà rattrapés avant d'utiliser l'app (jours)</label>
            <input
              className="text-input"
              type="number"
              min={0}
              value={baseInput}
              onChange={(e) => setBaseInput(e.target.value)}
            />
            <button className="btn-small" style={{ marginTop: 10 }} onClick={saveSettings}>
              Enregistrer
            </button>
          </>
        ) : (
          <button className="btn-ghost" onClick={() => setEditing(true)}>
            Modifier l'objectif / le point de départ
          </button>
        )}
      </div>
    </div>
  )
}
