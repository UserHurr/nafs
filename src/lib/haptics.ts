/** Short haptic buzz on completion. No-op where the Vibration API isn't
 * supported (notably iOS Safari). */
export function vibrateDone() {
  navigator.vibrate?.(15)
}
