import { useStore } from '../store'
import { tasksOnDate } from '../lib/recurrence'
import { addYears, isToday, monthGrid, toIso } from '../lib/dates'
import { format, isSameMonth as sameMonthFn } from 'date-fns'
import { fr } from 'date-fns/locale'
import { myMemberId } from '../syncStore'
import { visibleTasks } from '../lib/members'

export function YearView({
  anchor,
  onAnchorChange,
  onSelectMonth,
}: {
  anchor: Date
  onAnchorChange: (d: Date) => void
  onSelectMonth: (d: Date) => void
}) {
  const tasks = useStore((s) => s.tasks)
  const myTasks = visibleTasks(tasks, myMemberId())
  const year = anchor.getFullYear()
  const months = Array.from({ length: 12 }, (_, i) => new Date(year, i, 1))

  return (
    <div className="view-container">
      <div className="month-nav">
        <button className="nav-arrow" onClick={() => onAnchorChange(addYears(anchor, -1))}>
          ‹
        </button>
        <div className="month-label">{year}</div>
        <button className="nav-arrow" onClick={() => onAnchorChange(addYears(anchor, 1))}>
          ›
        </button>
      </div>

      <div className="year-grid">
        {months.map((m) => (
          <button key={m.toISOString()} className="mini-month" onClick={() => onSelectMonth(m)}>
            <div className="mini-month-title">{format(m, 'LLLL', { locale: fr })}</div>
            <div className="mini-month-grid">
              {monthGrid(m).map((d) => {
                const iso = toIso(d)
                const hasTasks = tasksOnDate(myTasks, iso).length > 0
                return (
                  <span
                    key={iso}
                    className={`mini-day ${sameMonthFn(d, m) ? '' : 'mini-day-outside'} ${isToday(d) ? 'mini-day-today' : ''} ${hasTasks ? 'mini-day-has-task' : ''}`}
                  />
                )
              })}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
