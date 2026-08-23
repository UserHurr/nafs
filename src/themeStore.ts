import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Theme = 'pink' | 'blue'

interface ThemeState {
  theme: Theme
  setTheme: (theme: Theme) => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'pink',
      setTheme: (theme) => set({ theme }),
    }),
    { name: 'nafs-theme' },
  ),
)
