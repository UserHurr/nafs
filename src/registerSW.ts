import { registerSW } from 'virtual:pwa-register'

// registerType 'autoUpdate' means: when a new version is found, activate it
// and reload immediately — no user prompt. Also poll periodically so an app
// left open for a while still picks up updates, not just on relaunch.
export function initServiceWorker() {
  if (!('serviceWorker' in navigator)) return

  const updateSW = registerSW({
    immediate: true,
    onRegisteredSW(_url, registration) {
      if (!registration) return
      setInterval(() => registration.update(), 60_000)
    },
  })

  void updateSW
}
