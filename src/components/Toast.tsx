import { useEffect } from 'react'
import { Undo2 } from 'lucide-react'
import { useToastStore } from '../toastStore'

const DURATION_MS = 5000

export function Toast() {
  const toast = useToastStore((s) => s.toast)
  const dismiss = useToastStore((s) => s.dismiss)

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(dismiss, DURATION_MS)
    return () => clearTimeout(timer)
  }, [toast, dismiss])

  if (!toast) return null

  return (
    <div className="toast" key={toast.id}>
      <span className="toast-message">{toast.message}</span>
      <button
        className="toast-undo"
        onClick={() => {
          toast.onUndo()
          dismiss()
        }}
      >
        <Undo2 size={14} /> Annuler
      </button>
    </div>
  )
}
