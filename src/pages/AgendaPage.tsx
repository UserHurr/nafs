import { useState } from 'react'
import { DayView } from '../components/DayView'
import { WeekView } from '../components/WeekView'
import { MonthView } from '../components/MonthView'
import { YearView } from '../components/YearView'

type SubView = 'day' | 'week' | 'month' | 'year'

export function AgendaPage() {
  const [subView, setSubView] = useState<SubView>('day')
  const [anchor, setAnchor] = useState(new Date())

  return (
    <div className="page">
      <div className="sub-tabs">
        <button className={subView === 'day' ? 'active' : ''} onClick={() => setSubView('day')}>
          Jour
        </button>
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

      {subView === 'day' && <DayView anchor={anchor} onAnchorChange={setAnchor} />}
      {subView === 'week' && <WeekView anchor={anchor} onAnchorChange={setAnchor} />}
      {subView === 'month' && <MonthView anchor={anchor} onAnchorChange={setAnchor} />}
      {subView === 'year' && (
        <YearView
          anchor={anchor}
          onAnchorChange={setAnchor}
          onSelectMonth={(d) => {
            setAnchor(d)
            setSubView('month')
          }}
        />
      )}
    </div>
  )
}
