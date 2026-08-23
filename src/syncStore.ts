import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type SyncStatus = 'disconnected' | 'connecting' | 'connected' | 'error'

interface SyncState {
  code: string | null
  status: SyncStatus
  lastSyncedAt: string | null
  error: string | null
  memberId: string
  setCode: (code: string | null) => void
  setStatus: (status: SyncStatus) => void
  setLastSyncedAt: (iso: string) => void
  setError: (error: string | null) => void
  setMemberId: (id: string) => void
}

export const useSyncStore = create<SyncState>()(
  persist(
    (set) => ({
      code: null,
      status: 'disconnected',
      lastSyncedAt: null,
      error: null,
      memberId: '',
      setCode: (code) => set({ code }),
      setStatus: (status) => set({ status }),
      setLastSyncedAt: (iso) => set({ lastSyncedAt: iso }),
      setError: (error) => set({ error }),
      setMemberId: (id) => set({ memberId: id }),
    }),
    { name: 'nafs-sync' },
  ),
)

// Every device gets a stable local identity from its very first launch,
// independent of whether/when it ever connects to a shared sync code.
if (!useSyncStore.getState().memberId) {
  useSyncStore.setState({ memberId: crypto.randomUUID() })
}

export function myMemberId(): string {
  return useSyncStore.getState().memberId
}
