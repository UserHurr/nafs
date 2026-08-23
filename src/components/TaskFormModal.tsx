import { useState } from 'react'
import { Bell, Clock, Pin, Repeat, Trash2 } from 'lucide-react'
import { useStore } from '../store'
import type { Recurrence, RecurrenceFreq, Task, TimeType } from '../types'
import { toIso } from '../lib/dates'
import { requestNotificationPermission } from '../lib/notifications'
import { myMemberId } from '../syncStore'
import { OwnerPicker } from './OwnerPicker'
import { Icon, categoryIconChoices } from '../lib/icons'
import { categoryColorChoices } from '../lib/colors'
import { useToastStore } from '../toastStore'

const weekdayLabels = ['D', 'L', 'M', 'M', 'J', 'V', 'S']

const freqLabels: Record<RecurrenceFreq, string> = {
  daily: 'jour(s)',
  weekly: 'semaine(s)',
  monthly: 'mois',
  yearly: 'an(s)',
}

export function TaskFormModal({
  editingTask,
  defaultDate,
  onClose,
}: {
  editingTask?: Task
  defaultDate: string
  onClose: () => void
}) {
  const categories = useStore((s) => s.categories)
  const addCategory = useStore((s) => s.addCategory)
  const addTask = useStore((s) => s.addTask)
  const updateTask = useStore((s) => s.updateTask)
  const removeTask = useStore((s) => s.removeTask)
  const showToast = useToastStore((s) => s.show)

  const [title, setTitle] = useState(editingTask?.title ?? '')
  const [ownerId, setOwnerId] = useState(editingTask?.ownerId ?? myMemberId())
  const [categoryId, setCategoryId] = useState(editingTask?.categoryId ?? categories[0]?.id ?? '')
  const [timeType, setTimeType] = useState<TimeType>(editingTask?.timeType ?? 'allday')
  const [startTime, setStartTime] = useState(editingTask?.startTime ?? '09:00')
  const [duration, setDuration] = useState(editingTask?.duration ?? 30)
  const [date, setDate] = useState(editingTask?.date ?? defaultDate)
  const [notes, setNotes] = useState(editingTask?.notes ?? '')

  const [repeats, setRepeats] = useState(!!editingTask?.recurrence)
  const [freq, setFreq] = useState<RecurrenceFreq>(editingTask?.recurrence?.freq ?? 'weekly')
  const [interval, setInterval] = useState(editingTask?.recurrence?.interval ?? 1)
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>(editingTask?.recurrence?.daysOfWeek ?? [])
  const [endDate, setEndDate] = useState(editingTask?.recurrence?.endDate ?? '')

  const [reminder, setReminder] = useState(editingTask?.reminder ?? false)
  const notificationsEnabled = useStore((s) => s.notificationsEnabled)
  const setNotificationsEnabled = useStore((s) => s.setNotificationsEnabled)

  const [showNewCategory, setShowNewCategory] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [newCatIcon, setNewCatIcon] = useState('sparkles')
  const [newCatColor, setNewCatColor] = useState(categoryColorChoices[0])

  const toggleDay = (d: number) => {
    setDaysOfWeek((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort()))
  }

  const handleSubmit = () => {
    if (!title.trim() || !categoryId) return

    const recurrence: Recurrence | undefined = repeats
      ? {
          freq,
          interval: Math.max(1, interval),
          daysOfWeek: freq === 'weekly' && daysOfWeek.length > 0 ? daysOfWeek : undefined,
          endDate: endDate || undefined,
        }
      : undefined

    const payload = {
      title: title.trim(),
      ownerId,
      categoryId,
      timeType,
      startTime: timeType === 'timed' ? startTime : undefined,
      duration: timeType === 'timed' ? duration : undefined,
      date,
      recurrence,
      notes: notes.trim() || undefined,
      reminder: timeType === 'timed' ? reminder : undefined,
    }

    if (editingTask) {
      updateTask(editingTask.id, payload)
    } else {
      addTask(payload)
    }
    onClose()
  }

  const handleAddCategory = () => {
    if (!newCatName.trim()) return
    addCategory({ name: newCatName.trim(), icon: newCatIcon, color: newCatColor })
    setNewCatName('')
    setShowNewCategory(false)
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-handle" />
        <h2>{editingTask ? 'Modifier la tâche' : 'Nouvelle tâche'}</h2>

        <label className="field-label">Titre</label>
        <input
          className="text-input"
          placeholder="Ex : Séance de sport"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
        />

        <OwnerPicker value={ownerId} onChange={setOwnerId} />

        <label className="field-label">Catégorie</label>
        <div className="chip-row">
          {categories.map((c) => (
            <button
              key={c.id}
              className={`chip ${categoryId === c.id ? 'chip-active' : ''}`}
              style={categoryId === c.id ? { background: c.color, borderColor: c.color } : undefined}
              onClick={() => setCategoryId(c.id)}
            >
              <Icon name={c.icon} size={14} /> {c.name}
            </button>
          ))}
          <button className="chip chip-dashed" onClick={() => setShowNewCategory((v) => !v)}>
            + Catégorie
          </button>
        </div>

        {showNewCategory && (
          <div className="new-category-box">
            <div className="emoji-grid">
              {categoryIconChoices.map((key) => (
                <button
                  key={key}
                  className={`emoji-btn ${newCatIcon === key ? 'emoji-btn-active' : ''}`}
                  onClick={() => setNewCatIcon(key)}
                >
                  <Icon name={key} size={16} />
                </button>
              ))}
            </div>
            <div className="color-swatch-row">
              {categoryColorChoices.map((c) => (
                <button
                  key={c}
                  className={`color-swatch ${newCatColor === c ? 'color-swatch-active' : ''}`}
                  style={{ background: c }}
                  onClick={() => setNewCatColor(c)}
                />
              ))}
            </div>
            <div className="row-gap">
              <input
                className="text-input"
                placeholder="Nom de la catégorie"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
              />
              <button className="btn-small" onClick={handleAddCategory}>
                Ajouter
              </button>
            </div>
          </div>
        )}

        <label className="field-label">Quand</label>
        <div className="segmented">
          <button className={timeType === 'allday' ? 'active' : ''} onClick={() => setTimeType('allday')}>
            <Pin size={14} /> Dans la journée
          </button>
          <button className={timeType === 'timed' ? 'active' : ''} onClick={() => setTimeType('timed')}>
            <Clock size={14} /> À une heure précise
          </button>
        </div>

        {timeType === 'timed' && (
          <div className="time-duration-row">
            <div className="time-duration-field">
              <label className="field-label">Heure</label>
              <input
                className="text-input"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="time-duration-field">
              <label className="field-label">Durée (min)</label>
              <input
                className="text-input"
                type="number"
                min={5}
                step={5}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
              />
            </div>
          </div>
        )}

        {timeType === 'timed' && (
          <label className="field-label toggle-row">
            <span className="row-gap">
              <Bell size={15} /> Me le rappeler
            </span>
            <input
              type="checkbox"
              checked={reminder}
              onChange={async (e) => {
                const checked = e.target.checked
                if (checked && !notificationsEnabled) {
                  const granted = await requestNotificationPermission()
                  setNotificationsEnabled(granted)
                  setReminder(granted)
                  return
                }
                setReminder(checked)
              }}
            />
          </label>
        )}

        <label className="field-label">Date</label>
        <input className="text-input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />

        <label className="field-label toggle-row">
          <span className="row-gap">
            <Repeat size={15} /> Se répète
          </span>
          <input type="checkbox" checked={repeats} onChange={(e) => setRepeats(e.target.checked)} />
        </label>

        {repeats && (
          <div className="recurrence-box">
            <div className="row-gap">
              <span>Tous les</span>
              <input
                className="text-input small-input"
                type="number"
                min={1}
                value={interval}
                onChange={(e) => setInterval(Number(e.target.value))}
              />
              <select className="text-input" value={freq} onChange={(e) => setFreq(e.target.value as RecurrenceFreq)}>
                {(Object.keys(freqLabels) as RecurrenceFreq[]).map((f) => (
                  <option key={f} value={f}>
                    {freqLabels[f]}
                  </option>
                ))}
              </select>
            </div>

            {freq === 'weekly' && (
              <div className="chip-row" style={{ marginTop: 8 }}>
                {weekdayLabels.map((label, i) => (
                  <button
                    key={i}
                    className={`day-chip ${daysOfWeek.includes(i) ? 'chip-active' : ''}`}
                    onClick={() => toggleDay(i)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}

            <label className="field-label">Jusqu'au (optionnel)</label>
            <input
              className="text-input"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        )}

        <label className="field-label">Notes</label>
        <textarea
          className="text-input"
          rows={2}
          placeholder="Optionnel"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <div className="modal-actions">
          {editingTask && (
            <button
              className="btn-danger"
              onClick={() => {
                const snapshot = editingTask
                removeTask(snapshot.id)
                onClose()
                showToast('Tâche supprimée', () => {
                  const { id: _id, createdAt: _createdAt, ...rest } = snapshot
                  addTask(rest)
                })
              }}
            >
              <Trash2 size={15} /> Supprimer
            </button>
          )}
          <button className="btn-ghost" onClick={onClose}>
            Annuler
          </button>
          <button className="btn-primary" onClick={handleSubmit}>
            {editingTask ? 'Enregistrer' : 'Ajouter'}
          </button>
        </div>
      </div>
    </div>
  )
}

export const defaultDateIso = toIso(new Date())
