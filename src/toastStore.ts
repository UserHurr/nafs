import { create } from 'zustand'

interface ToastEntry {
  id: string
  message: string
  onUndo: () => void
}

interface ToastState {
  toast: ToastEntry | null
  show: (message: string, onUndo: () => void) => void
  dismiss: () => void
}

export const useToastStore = create<ToastState>()((set) => ({
  toast: null,
  show: (message, onUndo) => set({ toast: { id: crypto.randomUUID(), message, onUndo } }),
  dismiss: () => set({ toast: null }),
}))
