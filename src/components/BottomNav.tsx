import { CalendarDays, ListChecks, SunMoon, CalendarCheck2, BarChart3, type LucideIcon } from 'lucide-react'

export type Tab = 'agenda' | 'todo' | 'routines' | 'qada' | 'stats'

const tabs: { id: Tab; label: string; icon: LucideIcon }[] = [
  { id: 'agenda', label: 'Agenda', icon: CalendarDays },
  { id: 'todo', label: 'To-Do', icon: ListChecks },
  { id: 'routines', label: 'Routines', icon: SunMoon },
  { id: 'qada', label: 'Rattrapage', icon: CalendarCheck2 },
  { id: 'stats', label: 'Stats', icon: BarChart3 },
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
          <t.icon className="bottom-nav-icon" size={20} strokeWidth={2} />
          <span>{t.label}</span>
        </button>
      ))}
    </nav>
  )
}
