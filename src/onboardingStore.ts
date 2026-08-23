import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface OnboardingState {
  hasSeenOnboarding: boolean
  dismiss: () => void
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      hasSeenOnboarding: false,
      dismiss: () => set({ hasSeenOnboarding: true }),
    }),
    { name: 'nafs-onboarding' },
  ),
)
