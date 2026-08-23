import { BarChart3, CalendarDays, ListChecks, SunMoon, Users } from 'lucide-react'
import { useOnboardingStore } from '../onboardingStore'

const points = [
  {
    icon: CalendarDays,
    title: 'Agenda',
    text: 'Tâches ponctuelles ou récurrentes, à une heure précise ou juste "dans la journée". Vues Jour, Semaine, Mois, Année.',
  },
  {
    icon: ListChecks,
    title: 'To-Do',
    text: 'Une liste simple à côté de l\'agenda, avec priorités et sous-tâches.',
  },
  {
    icon: SunMoon,
    title: 'Routines',
    text: 'Tes rituels du matin et du soir, avec un compteur de jours d\'affilée.',
  },
  {
    icon: Users,
    title: 'Mode à deux',
    text: 'Connecte un autre appareil (le tien ou celui de quelqu\'un d\'autre) via un code dans Stats → Synchronisation. Vos données perso restent séparées, seul ce que vous marquez "Nous" est partagé.',
  },
  {
    icon: BarChart3,
    title: 'Stats',
    text: 'Suivi de tes séries, historique d\'activité, thème, catégories et sauvegarde — tout est là.',
  },
]

export function Onboarding() {
  const hasSeenOnboarding = useOnboardingStore((s) => s.hasSeenOnboarding)
  const dismiss = useOnboardingStore((s) => s.dismiss)

  if (hasSeenOnboarding) return null

  return (
    <div className="modal-backdrop">
      <div className="modal-sheet">
        <div className="modal-handle" />
        <h2>Bienvenue dans Nafs</h2>
        <div className="onboarding-list">
          {points.map((p) => (
            <div key={p.title} className="onboarding-item">
              <div className="onboarding-icon">
                <p.icon size={20} />
              </div>
              <div>
                <div className="onboarding-item-title">{p.title}</div>
                <div className="onboarding-item-text">{p.text}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="modal-actions">
          <button className="btn-primary" onClick={dismiss}>
            Compris, on y va
          </button>
        </div>
      </div>
    </div>
  )
}
