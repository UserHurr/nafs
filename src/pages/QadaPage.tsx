import { useState } from 'react'
import { CalendarCheck2, Flame, Minus, Plus } from 'lucide-react'
import { useStore } from '../store'
import { myMemberId } from '../syncStore'
import { addDays, todayIso, toIso } from '../lib/dates'
import { useConfettiBurst } from '../components/Confetti'
import { vibrateDone } from '../lib/haptics'

const DEFAULT_TARGET = 1825
const DEFAULT_BASE = 186

function computeStreak(qadaDayCounts: Record<string, number>, me: string): number {
  let streak = 0
  let cursor = new Date()
  for (let i = 0; i < 3650; i++) {
    const cIso = toIso(cursor)
    const done = (qadaDayCounts[`${cIso}_${me}`] ?? 0) > 0
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
  const qadaDayCounts = useStore((s) => s.qadaDayCounts)
  const setQadaTarget = useStore((s) => s.setQadaTarget)
  const setQadaBaseCount = useStore((s) => s.setQadaBaseCount)
  const incrementQadaDay = useStore((s) => s.incrementQadaDay)
  const decrementQadaDay = useStore((s) => s.decrementQadaDay)
  const { fire, node } = useConfettiBurst()

  const target = qadaTarget[me] ?? DEFAULT_TARGET
  const base = qadaBaseCount[me] ?? DEFAULT_BASE

  const doneDays = Object.entries(qadaDayCounts)
    .filter(([k]) => k.endsWith(`_${me}`))
    .reduce((sum, [, n]) => sum + n, 0)
  const total = Math.min(target, base + doneDays)
  const remaining = Math.max(0, target - total)
  const percent = target === 0 ? 0 : Math.min(100, Math.round((total / target) * 100))

  const iso = todayIso()
  const todayCount = qadaDayCounts[`${iso}_${me}`] ?? 0
  const streak = computeStreak(qadaDayCounts, me)

  const [editing, setEditing] = useState(false)
  const [targetInput, setTargetInput] = useState(String(target))
  const [baseInput, setBaseInput] = useState(String(base))

  const handleAddToday = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    fire(rect.left + rect.width / 2, rect.top + rect.height / 2)
    vibrateDone()
    incrementQadaDay(iso)
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

      <button
        className={`qada-check-button ${todayCount > 0 ? 'qada-check-button-done' : ''}`}
        onClick={handleAddToday}
      >
        <span className="qada-check-circle">
          {todayCount > 0 ? todayCount : <Plus size={20} strokeWidth={3} />}
        </span>
        <span>
          {todayCount > 0
            ? `${todayCount} jour${todayCount > 1 ? 's' : ''} rattrapé${todayCount > 1 ? 's' : ''} aujourd'hui — toucher pour en ajouter un autre`
            : "Marquer un jour comme rattrapé"}
        </span>
      </button>
      {todayCount > 0 && (
        <button className="btn-ghost qada-undo-btn" onClick={() => decrementQadaDay(iso)}>
          <Minus size={14} /> Retirer un jour (erreur de clic)
        </button>
      )}

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
