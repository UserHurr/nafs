import { useRef } from 'react'

/**
 * Horizontal swipe-to-navigate for calendar-style views. Ignores swipes that
 * start on an element matching `ignoreSelector` so it doesn't fight with
 * drag-to-reschedule gestures (e.g. the day timeline's task blocks).
 */
export function useSwipeNav(onPrev: () => void, onNext: () => void, ignoreSelector?: string) {
  const start = useRef<{ x: number; y: number } | null>(null)

  const onTouchStart = (e: React.TouchEvent) => {
    if (ignoreSelector && (e.target as HTMLElement).closest(ignoreSelector)) {
      start.current = null
      return
    }
    start.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
  }

  const onTouchEnd = (e: React.TouchEvent) => {
    if (!start.current) return
    const dx = e.changedTouches[0].clientX - start.current.x
    const dy = e.changedTouches[0].clientY - start.current.y
    start.current = null
    if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      if (dx < 0) onNext()
      else onPrev()
    }
  }

  return { onTouchStart, onTouchEnd }
}
