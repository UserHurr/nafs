import { useState } from 'react'
import { useStore } from '../store'
import { dayCompletion, heatmapDays, routineStreak, sharedWeeklySummary, weeklySummary } from '../lib/stats'
import { toIso, isToday } from '../lib/dates'
import { notificationsSupported, requestNotificationPermission } from '../lib/notifications'
import { SyncSection } from '../components/SyncSection'
import { myMemberId } from '../syncStore'
import { useThemeStore, type Theme } from '../themeStore'

const weekdayLabels = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

export function StatsPage() {
  const tasks = useStore((s) => s.tasks)
  const taskCompletions = useStore((s) => s.taskCompletions)
  const todos = useStore((s) => s.todos)
  const routines = useStore((s) => s.routines)
  const routineCompletions = useStore((s) => s.routineCompletions)
  const members = useStore((s) => s.members)
  const notificationsEnabled = useStore((s) => s.notificationsEnabled)
  const setNotificationsEnabled = useStore((s) => s.setNotificationsEnabled)

  const [requesting, setRequesting] = useState(false)

  const me = myMemberId()
  const today = new Date()
  const weekly = weeklySummary(tasks, taskCompletions, todos, today, me)
  const weeks = 10
  const grid = heatmapDays(today, weeks)

  const morningStreak = routineStreak(routines.morning, routineCompletions, 'morning', today, me)
  const eveningStreak = routineStreak(routines.evening, routineCompletions, 'evening', today, me)

  const partner = members.find((m) => m.id !== me)

  const handleEnableNotifications = async () => {
    setRequesting(true)
    const granted = await requestNotificationPermission()
    setNotificationsEnabled(granted)
    setRequesting(false)
  }

  return (
    <div className="page">
      <h1 className="page-title">📊 Stats</h1>

      <div className="stats-card">
        <div className="stats-card-title">Cette semaine</div>
        <div className="stats-big-number">{Math.round(weekly.ratio * 100)}%</div>
        <div className="stats-sub">
          {weekly.done} / {weekly.total} complétées
        </div>
        <div className="progress-bar">
          <div className="progress-bar-fill" style={{ width: `${Math.round(weekly.ratio * 100)}%` }} />
        </div>
      </div>

      <div className="row-gap" style={{ marginTop: 12 }}>
        <div className="stats-card" style={{ flex: 1 }}>
          <div className="stats-card-title">🌅 Matin</div>
          <div className="stats-big-number" style={{ fontSize: 22 }}>
            {morningStreak > 0 ? `🔥 ${morningStreak}j` : '—'}
          </div>
        </div>
        <div className="stats-card" style={{ flex: 1 }}>
          <div className="stats-card-title">🌙 Soir</div>
          <div className="stats-big-number" style={{ fontSize: 22 }}>
            {eveningStreak > 0 ? `🔥 ${eveningStreak}j` : '—'}
          </div>
        </div>
      </div>

      {partner && <TogetherCard partnerId={partner.id} partnerName={partner.name} partnerEmoji={partner.emoji} />}

      <div className="section-label">Historique ({weeks} semaines)</div>
      <div className="heatmap-wrap">
        <div className="heatmap-weekday-col">
          {weekdayLabels.map((w, i) => (
            <span key={i}>{w}</span>
          ))}
        </div>
        <div className="heatmap-grid">
          {grid.map((week, wi) => (
            <div key={wi} className="heatmap-col">
              {week.map((day) => {
                const iso = toIso(day)
                const future = day > today && !isToday(day)
                const score = dayCompletion(tasks, taskCompletions, todos, iso, me)
                const opacity = future || score.total === 0 ? 0 : 0.15 + score.ratio * 0.85
                return (
                  <div
                    key={iso}
                    className={`heatmap-cell ${isToday(day) ? 'heatmap-cell-today' : ''}`}
                    style={{ background: future ? 'transparent' : `rgba(var(--accent-rgb), ${opacity})` }}
                    title={`${iso} — ${score.done}/${score.total}`}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="section-label">Notifications</div>
      <div className="stats-card">
        {!notificationsSupported() ? (
          <div className="stats-sub">Non supporté sur ce navigateur.</div>
        ) : notificationsEnabled ? (
          <>
            <div className="stats-sub">🔔 Rappels activés — les tâches avec une cloche te préviendront.</div>
            <button className="btn-ghost" style={{ marginTop: 10 }} onClick={() => setNotificationsEnabled(false)}>
              Désactiver
            </button>
          </>
        ) : (
          <>
            <div className="stats-sub">
              Active les rappels pour être prévenu·e à l'heure d'une tâche (marquée 🔔). Ne fonctionne que quand
              l'app est ouverte ou récemment utilisée.
            </div>
            <button className="btn-small" style={{ marginTop: 10 }} onClick={handleEnableNotifications} disabled={requesting}>
              🔔 Activer les rappels
            </button>
          </>
        )}
      </div>

      <div className="section-label">Thème</div>
      <ThemePicker />

      <div className="section-label">Synchronisation</div>
      <SyncSection />
    </div>
  )
}

const themeSwatches: { id: Theme; label: string; colors: [string, string] }[] = [
  { id: 'pink', label: 'Rose', colors: ['#fdf1f6', '#ec4899'] },
  { id: 'blue', label: 'Bleu', colors: ['#eff6fd', '#2f7cf6'] },
]

function ThemePicker() {
  const theme = useThemeStore((s) => s.theme)
  const setTheme = useThemeStore((s) => s.setTheme)

  return (
    <div className="stats-card">
      <div className="chip-row">
        {themeSwatches.map((t) => (
          <button
            key={t.id}
            className={`theme-swatch ${theme === t.id ? 'theme-swatch-active' : ''}`}
            onClick={() => setTheme(t.id)}
          >
            <span className="theme-swatch-preview" style={{ background: t.colors[0], borderColor: t.colors[1] }}>
              <span style={{ background: t.colors[1] }} />
            </span>
            {t.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function TogetherCard({
  partnerId,
  partnerName,
  partnerEmoji,
}: {
  partnerId: string
  partnerName: string
  partnerEmoji: string
}) {
  const tasks = useStore((s) => s.tasks)
  const taskCompletions = useStore((s) => s.taskCompletions)
  const me = myMemberId()
  const today = new Date()

  const mine = sharedWeeklySummary(tasks, taskCompletions, today, me)
  const theirs = sharedWeeklySummary(tasks, taskCompletions, today, partnerId)

  if (mine.total === 0) return null

  return (
    <div className="stats-card" style={{ marginTop: 12 }}>
      <div className="stats-card-title">🤝 Nos objectifs communs cette semaine</div>
      <div className="together-row">
        <div className="together-col">
          <div className="stats-sub">Toi</div>
          <div className="stats-big-number" style={{ fontSize: 24 }}>
            {Math.round(mine.ratio * 100)}%
          </div>
          <div className="progress-bar">
            <div className="progress-bar-fill" style={{ width: `${Math.round(mine.ratio * 100)}%` }} />
          </div>
        </div>
        <div className="together-col">
          <div className="stats-sub">
            {partnerEmoji} {partnerName}
          </div>
          <div className="stats-big-number" style={{ fontSize: 24 }}>
            {Math.round(theirs.ratio * 100)}%
          </div>
          <div className="progress-bar">
            <div className="progress-bar-fill" style={{ width: `${Math.round(theirs.ratio * 100)}%` }} />
          </div>
        </div>
      </div>
    </div>
  )
}
