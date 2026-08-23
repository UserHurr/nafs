export const notificationsSupported = () => 'Notification' in window

export async function requestNotificationPermission(): Promise<boolean> {
  if (!notificationsSupported()) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  const result = await Notification.requestPermission()
  return result === 'granted'
}

export async function showTaskNotification(title: string, body: string) {
  if (!notificationsSupported() || Notification.permission !== 'granted') return
  try {
    const reg = await navigator.serviceWorker?.getRegistration()
    if (reg) {
      await reg.showNotification(title, { body, icon: '/icon-192.png', badge: '/icon-192.png' })
      return
    }
  } catch {
    // fall through to plain Notification
  }
  new Notification(title, { body, icon: '/icon-192.png' })
}
