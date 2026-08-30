import { registerSW } from 'virtual:pwa-register'

declare const __BUILD_ID__: string

// A plain fetch of a tiny unhashed file, forced to bypass every cache layer
// (HTTP cache, service worker). This is independent of the Service Worker
// update mechanism, which iOS is known to throttle/delay in standalone PWA
// mode — so it's a reliable fallback signal that a new version was deployed.
async function checkBuildId() {
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}build-id.txt?t=${Date.now()}`, { cache: 'no-store' })
    if (!res.ok) return
    const remoteId = (await res.text()).trim()
    if (remoteId && remoteId !== __BUILD_ID__) {
      window.location.reload()
    }
  } catch {
    // offline or transient network error — next check will retry
  }
}

// registerType 'autoUpdate' means: when a new version is found, activate it
// and reload immediately — no user prompt.
export function initServiceWorker() {
  if (!('serviceWorker' in navigator)) return

  const updateSW = registerSW({
    immediate: true,
    onRegisteredSW(_url, registration) {
      if (!registration) return

      // setInterval alone isn't enough: on mobile it's throttled or fully
      // paused while the app is backgrounded/closed on the home screen —
      // exactly when a stale version otherwise lingers. So also force a
      // check the moment the app is reopened/foregrounded, which is when
      // it matters most. registration.update() bypasses the HTTP cache for
      // the SW script fetch itself (per spec), so this reliably catches a
      // new deploy even though GitHub Pages serves it with a 10min cache.
      const check = () => {
        registration.update()
        checkBuildId()
      }
      setInterval(check, 60_000)
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') check()
      })
      window.addEventListener('focus', check)
      window.addEventListener('pageshow', check)
    },
  })

  void updateSW
}
