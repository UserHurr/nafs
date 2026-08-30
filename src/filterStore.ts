import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { OwnershipFilter } from './lib/members'

interface FilterState {
  filter: OwnershipFilter
  setFilter: (filter: OwnershipFilter) => void
}

export const useFilterStore = create<FilterState>()(
  persist(
    (set) => ({
      filter: 'mine',
      setFilter: (filter) => set({ filter }),
    }),
    { name: 'nafs-filter' },
  ),
)
