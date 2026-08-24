import { useEffect, useState } from 'react'
import { BottomNav, type Tab } from './components/BottomNav'
import { AgendaPage } from './pages/AgendaPage'
import { TodoPage } from './pages/TodoPage'
import { RoutinesPage } from './pages/RoutinesPage'
import { QadaPage } from './pages/QadaPage'
import { HabitsPage } from './pages/HabitsPage'
import { StatsPage } from './pages/StatsPage'
import { useReminderChecker } from './hooks/useReminderChecker'
import { useCloudSync } from './hooks/useCloudSync'
import { useThemeStore } from './themeStore'
import { Toast } from './components/Toast'
import { Onboarding } from './components/Onboarding'
import './App.css'

function App() {
  const [tab, setTab] = useState<Tab>('agenda')
  const theme = useThemeStore((s) => s.theme)
  useReminderChecker()
  useCloudSync()

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    const meta = document.querySelector('meta[name="theme-color"]')
    meta?.setAttribute('content', theme === 'blue' ? '#5c7c96' : '#b8677a')
  }, [theme])

  return (
    <div className="app-shell">
      <main className="app-main">
        {tab === 'agenda' && <AgendaPage />}
        {tab === 'todo' && <TodoPage />}
        {tab === 'routines' && <RoutinesPage />}
        {tab === 'qada' && <QadaPage />}
        {tab === 'habits' && <HabitsPage />}
        {tab === 'stats' && <StatsPage />}
      </main>
      <BottomNav active={tab} onChange={setTab} />
      <Toast />
      <Onboarding />
    </div>
  )
}

export default App
