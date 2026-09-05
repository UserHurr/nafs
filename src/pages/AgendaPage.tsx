import { useState } from 'react'
import { WeekView } from '../components/WeekView'
import { MonthView } from '../components/MonthView'
import { YearView } from '../components/YearView'

type SubView = 'week' | 'month' | 'year'

export function AgendaPage() {
  const [subView, setSubView] = useState<SubView>('week')
  const [anchor, setAnchor] = useState(new Date())

  return (
    <div className="page">
      <div className="sub-tabs">
        <button className={subView === 'week' ? 'active' : ''} onClick={() => setSubView('week')}>
          Semaine
        </button>
        <button className={subView === 'month' ? 'active' : ''} onClick={() => setSubView('month')}>
          Mois
        </button>
        <button className={subView === 'year' ? 'active' : ''} onClick={() => setSubView('year')}>
          Année
        </button>
      </div>

      {subView === 'week' && <WeekView anchor={anchor} onAnchorChange={setAnchor} filter="mine" />}
      {subView === 'month' && <MonthView anchor={anchor} onAnchorChange={setAnchor} filter="mine" />}
      {subView === 'year' && (
        <YearView
          anchor={anchor}
          onAnchorChange={setAnchor}
          filter="mine"
          onSelectMonth={(d) => {
            setAnchor(d)
            setSubView('month')
          }}
        />
      )}
    </div>
  )
}
