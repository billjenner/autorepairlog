import { boot } from 'quasar/wrappers'
import { useUsersStore } from 'stores/users'
import { isConnectionError } from '../utils/connection'

// Mirrors the browser's online/offline state into the users store so the UI
// (OfflineConnectionCard) reacts to connection changes, and re-signals it
// every time a fetch fails because of the connection.
export default boot(() => {
  if (typeof window === 'undefined') {
    return
  }

  const usersStore = useUsersStore()
  usersStore.isOffline = !navigator.onLine

  window.addEventListener('offline', () => {
    usersStore.isOffline = true
  })
  window.addEventListener('online', () => {
    usersStore.isOffline = false
  })

  const originalFetch = window.fetch.bind(window)
  window.fetch = async (...args) => {
    try {
      return await originalFetch(...args)
    } catch (error) {
      // The login-status sync is best-effort; its failure (e.g. CORS or an
      // undeployed function) must not show the offline popup on login/logout.
      const input = args[0]
      const url = typeof input === 'string' ? input : input?.url || String(input || '')
      const isBestEffortSync = url.includes('/functions/v1/users-logged-in')
      if (!isBestEffortSync && (isConnectionError(error) || !navigator.onLine)) {
        usersStore.isOffline = true
        usersStore.offlineAttempts += 1
      }
      throw error
    }
  }
})
