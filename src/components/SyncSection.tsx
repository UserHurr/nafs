import { useState } from 'react'
import { Check, Sparkles } from 'lucide-react'
import { useSyncStore, myMemberId } from '../syncStore'
import { useStore } from '../store'
import { supabaseConfigured } from '../lib/supabase'
import { generateSyncCode } from '../lib/sync'
import { Icon, avatarIconChoices } from '../lib/icons'

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

export function SyncSection() {
  const code = useSyncStore((s) => s.code)
  const status = useSyncStore((s) => s.status)
  const lastSyncedAt = useSyncStore((s) => s.lastSyncedAt)
  const error = useSyncStore((s) => s.error)
  const setCode = useSyncStore((s) => s.setCode)
  const setStatus = useSyncStore((s) => s.setStatus)

  const [inputCode, setInputCode] = useState('')
  const [copied, setCopied] = useState(false)

  if (!supabaseConfigured) {
    return (
      <div className="stats-card">
        <div className="stats-sub">Synchronisation non configurée.</div>
      </div>
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
            Entre ce code sur l'appareil de l'autre personne pour partager vos activités communes.
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
            Connecte-toi à un code pour partager des activités avec quelqu'un (vos agendas et to-do perso restent
            séparés, seul ce que vous marquez "Nous" est partagé).
          </div>
          <div className="row-gap" style={{ marginTop: 10 }}>
            <input
              className="text-input"
              placeholder="Coller un code existant…"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value.trim())}
            />
            <button
              className="btn-small"
              onClick={() => {
                if (inputCode) setCode(inputCode)
              }}
            >
              Connecter
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
