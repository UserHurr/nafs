import { useState } from 'react'
import { WeekView } from '../components/WeekView'
import { MonthView } from '../components/MonthView'
import { YearView } from '../components/YearView'
import { useStore } from '../store'
import { useFilterStore } from '../filterStore'

type SubView = 'week' | 'month' | 'year'

export function AgendaPage() {
  const [subView, setSubView] = useState<SubView>('week')
  const [anchor, setAnchor] = useState(new Date())
  const members = useStore((s) => s.members)
  const filter = useFilterStore((s) => s.filter)
  const setFilter = useFilterStore((s) => s.setFilter)

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

      {members.length > 1 && (
        <div className="segmented filter-segmented">
          <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>
            Tout
          </button>
          <button className={filter === 'mine' ? 'active' : ''} onClick={() => setFilter('mine')}>
            Moi
          </button>
          <button className={filter === 'shared' ? 'active' : ''} onClick={() => setFilter('shared')}>
            Nous
          </button>
        </div>
      )}

      {subView === 'week' && <WeekView anchor={anchor} onAnchorChange={setAnchor} filter={filter} />}
      {subView === 'month' && <MonthView anchor={anchor} onAnchorChange={setAnchor} filter={filter} />}
      {subView === 'year' && (
        <YearView
          anchor={anchor}
          onAnchorChange={setAnchor}
          filter={filter}
          onSelectMonth={(d) => {
            setAnchor(d)
            setSubView('month')
          }}
        />
      )}
    </div>
  )
}
