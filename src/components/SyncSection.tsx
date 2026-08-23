import { useState } from 'react'
import { Check, Sparkles } from 'lucide-react'
import { useSyncStore, myMemberId } from '../syncStore'
import { useStore } from '../store'
import { supabaseConfigured } from '../lib/supabase'
import { generateSyncCode, pullState } from '../lib/sync'
import { Icon, avatarIconChoices } from '../lib/icons'
import type { Member } from '../types'

function remapCompletionKeys(completions: Record<string, boolean>, oldId: string, newId: string) {
  const suffix = `_${oldId}`
  const out: Record<string, boolean> = {}
  for (const [k, v] of Object.entries(completions)) {
    out[k.endsWith(suffix) ? k.slice(0, -suffix.length) + `_${newId}` : k] = v
  }
  return out
}

function ProfileCard() {
  const me = myMemberId()
  const members = useStore((s) => s.members)
  const updateMember = useStore((s) => s.updateMember)
  const myMember = members.find((m) => m.id === me)
  const others = members.filter((m) => m.id !== me)

  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(myMember?.name ?? 'Moi')
  const [icon, setIcon] = useState(myMember?.icon ?? 'user')

  const save = () => {
    updateMember(me, { name: name.trim() || 'Moi', icon })
    setEditing(false)
  }

  return (
    <div className="stats-card">
      <div className="stats-card-title">Ton profil</div>
      {editing ? (
        <>
          <div className="emoji-grid">
            {avatarIconChoices.map((key) => (
              <button
                key={key}
                className={`emoji-btn ${icon === key ? 'emoji-btn-active' : ''}`}
                onClick={() => setIcon(key)}
              >
                <Icon name={key} size={16} />
              </button>
            ))}
          </div>
          <div className="row-gap" style={{ marginTop: 8 }}>
            <input className="text-input" value={name} onChange={(e) => setName(e.target.value)} />
            <button className="btn-small" onClick={save}>
              OK
            </button>
          </div>
        </>
      ) : (
        <div className="row-gap">
          <Icon name={myMember?.icon} size={22} />
          <span style={{ flex: 1, fontWeight: 700 }}>{myMember?.name}</span>
          <button className="btn-ghost" onClick={() => setEditing(true)}>
            Modifier
          </button>
        </div>
      )}
      {others.length > 0 && (
        <div className="stats-sub row-gap" style={{ marginTop: 10 }}>
          <span>Avec :</span>
          {others.map((m) => (
            <span key={m.id} className="row-gap" style={{ gap: 4 }}>
              <Icon name={m.icon} size={14} /> {m.name}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

/** After entering a code, lets this device claim an existing profile (its
 * own other device) instead of always registering as a brand-new person. */
function WhoAreYouPicker({
  code,
  remoteMembers,
  onCancel,
}: {
  code: string
  remoteMembers: Member[]
  onCancel: () => void
}) {
  const setMemberId = useSyncStore((s) => s.setMemberId)
  const setCode = useSyncStore((s) => s.setCode)

  const claim = (memberId: string | null) => {
    if (memberId) {
      const oldId = myMemberId()
      setMemberId(memberId)
      useStore.setState((s) => ({
        members: s.members.filter((m) => m.id !== oldId),
        tasks: s.tasks.map((t) => (t.ownerId === oldId ? { ...t, ownerId: memberId } : t)),
        todos: s.todos.map((t) => ({
          ...t,
          ownerId: t.ownerId === oldId ? memberId : t.ownerId,
          doneBy: t.doneBy.map((id) => (id === oldId ? memberId : id)),
        })),
        routines: {
          morning: s.routines.morning.map((i) => (i.ownerId === oldId ? { ...i, ownerId: memberId } : i)),
          evening: s.routines.evening.map((i) => (i.ownerId === oldId ? { ...i, ownerId: memberId } : i)),
        },
        taskCompletions: remapCompletionKeys(s.taskCompletions, oldId, memberId),
        routineCompletions: remapCompletionKeys(s.routineCompletions, oldId, memberId),
      }))
    }
    setCode(code)
  }

  return (
    <div className="stats-card" style={{ marginTop: 10 }}>
      <div className="stats-card-title">C'est toi ?</div>
      <div className="stats-sub" style={{ marginBottom: 10 }}>
        Si cet appareil t'appartient déjà (ton autre téléphone/tablette), choisis ton profil pour retrouver tes
        données. Sinon, crée un nouveau profil.
      </div>
      <div className="chip-row">
        {remoteMembers.map((m) => (
          <button key={m.id} className="chip" onClick={() => claim(m.id)}>
            <Icon name={m.icon} size={14} /> {m.name}
          </button>
        ))}
        <button className="chip chip-dashed" onClick={() => claim(null)}>
          + Nouveau profil
        </button>
      </div>
      <button className="btn-ghost" style={{ marginTop: 10 }} onClick={onCancel}>
        Annuler
      </button>
    </div>
  )
}

export function SyncSection() {
  const code = useSyncStore((s) => s.code)
  const status = useSyncStore((s) => s.status)
  const lastSyncedAt = useSyncStore((s) => s.lastSyncedAt)
  const error = useSyncStore((s) => s.error)
  const setCode = useSyncStore((s) => s.setCode)
  const setStatus = useSyncStore((s) => s.setStatus)

  const [inputCode, setInputCode] = useState('')
  const [copied, setCopied] = useState(false)
  const [checking, setChecking] = useState(false)
  const [pending, setPending] = useState<{ code: string; remoteMembers: Member[] } | null>(null)

  if (!supabaseConfigured) {
    return (
      <div className="stats-card">
        <div className="stats-sub">Synchronisation non configurée.</div>
      </div>
    )
  }

  const handleConnectClick = async () => {
    if (!inputCode) return
    setChecking(true)
    try {
      const remote = await pullState(inputCode)
      if (remote && remote.data.members.length > 0) {
        setPending({ code: inputCode, remoteMembers: remote.data.members })
      } else {
        setCode(inputCode)
      }
    } catch {
      // If the lookup fails, just try connecting directly — the normal
      // connect flow will surface the error.
      setCode(inputCode)
    } finally {
      setChecking(false)
    }
  }

  if (pending) {
    return (
      <>
        <ProfileCard />
        <WhoAreYouPicker code={pending.code} remoteMembers={pending.remoteMembers} onCancel={() => setPending(null)} />
      </>
    )
  }

  return (
    <>
      <ProfileCard />

      {code ? (
        <div className="stats-card" style={{ marginTop: 10 }}>
          <div className="stats-sub row-gap">
            <span className={`status-dot status-dot-${status}`} />
            {status === 'connected' && 'Connecté'}
            {status === 'connecting' && 'Connexion…'}
            {status === 'error' && `Erreur : ${error}`}
          </div>
          <div className="sync-code-box">
            <code>{code}</code>
            <button
              className="btn-ghost"
              onClick={() => {
                navigator.clipboard.writeText(code)
                setCopied(true)
                setTimeout(() => setCopied(false), 1500)
              }}
            >
              {copied ? (
                <>
                  <Check size={14} /> Copié
                </>
              ) : (
                'Copier'
              )}
            </button>
          </div>
          <div className="stats-sub" style={{ marginTop: 6 }}>
            Utilise ce même code sur tes autres appareils (ou celui d'une autre personne) pour retrouver/partager tes
            données.
            {lastSyncedAt && ` Dernière synchro : ${new Date(lastSyncedAt).toLocaleTimeString('fr-FR')}`}
          </div>
          <button
            className="btn-ghost"
            style={{ marginTop: 10 }}
            onClick={() => {
              setCode(null)
              setStatus('disconnected')
            }}
          >
            Se déconnecter
          </button>
        </div>
      ) : (
        <div className="stats-card" style={{ marginTop: 10 }}>
          <div className="stats-sub">
            Connecte-toi à un code pour retrouver tes données sur un autre appareil, ou pour partager des activités
            avec quelqu'un (vos agendas et to-do perso restent séparés, seul ce que vous marquez "Nous" est
            partagé).
          </div>
          <div className="row-gap" style={{ marginTop: 10 }}>
            <input
              className="text-input"
              placeholder="Coller un code existant…"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value.trim())}
            />
            <button className="btn-small" onClick={handleConnectClick} disabled={checking}>
              {checking ? '…' : 'Connecter'}
            </button>
          </div>
          <button
            className="btn-ghost"
            style={{ marginTop: 10 }}
            onClick={() => {
              setCode(generateSyncCode())
            }}
          >
            <Sparkles size={15} /> Générer un nouveau code
          </button>
        </div>
      )}
    </>
  )
}
