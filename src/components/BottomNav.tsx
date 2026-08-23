export type Tab = 'agenda' | 'todo' | 'routines' | 'stats'

const tabs: { id: Tab; label: string; emoji: string }[] = [
  { id: 'agenda', label: 'Agenda', emoji: '🗓️' },
  { id: 'todo', label: 'To-Do', emoji: '✅' },
  { id: 'routines', label: 'Routines', emoji: '🌗' },
  { id: 'stats', label: 'Stats', emoji: '📊' },
]

export function BottomNav({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  return (
    <nav className="bottom-nav">
      {tabs.map((t) => (
        <button
          key={t.id}
          className={`bottom-nav-btn ${active === t.id ? 'active' : ''}`}
          onClick={() => onChange(t.id)}
        >
          <span className="bottom-nav-emoji">{t.emoji}</span>
          <span>{t.label}</span>
        </button>
      ))}
    </nav>
  )
}
