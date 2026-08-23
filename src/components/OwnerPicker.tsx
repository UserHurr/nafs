import { useStore } from '../store'
import { myMemberId } from '../syncStore'
import { SHARED_OWNER } from '../types'

export function OwnerPicker({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const members = useStore((s) => s.members)
  const me = myMemberId()

  if (members.length <= 1) return null

  const myMember = members.find((m) => m.id === me)

  return (
    <>
      <label className="field-label">Pour qui</label>
      <div className="chip-row">
        <button
          className={`chip ${value === me ? 'chip-active' : ''}`}
          style={value === me ? { background: myMember?.color ?? 'var(--accent)', borderColor: 'transparent' } : undefined}
          onClick={() => onChange(me)}
        >
          {myMember?.emoji ?? '🙂'} Moi
        </button>
        {members
          .filter((m) => m.id !== me)
          .map((m) => (
            <button
              key={m.id}
              className={`chip ${value === m.id ? 'chip-active' : ''}`}
              style={value === m.id ? { background: m.color, borderColor: 'transparent' } : undefined}
              onClick={() => onChange(m.id)}
            >
              {m.emoji} {m.name}
            </button>
          ))}
        <button
          className={`chip ${value === SHARED_OWNER ? 'chip-active' : ''}`}
          style={
            value === SHARED_OWNER
              ? { background: 'linear-gradient(135deg, var(--accent), var(--accent-2))', borderColor: 'transparent' }
              : undefined
          }
          onClick={() => onChange(SHARED_OWNER)}
        >
          🤝 Nous
        </button>
      </div>
    </>
  )
}
