// Central rules for which navigation buttons/menu items are shown, plus a Cache Storage
// persistence layer (cache first, network second) so the nav renders quickly and offline.
const CACHE_NAME = 'autorepairlog-nav-availability'

export const EMPTY_AVAILABILITY = Object.freeze({
  hasAuto: false,
  hasSchedule: false,
  hasDashboard: false,
})

// Visibility rules:
//  - not logged in: hide auto and every other navigation option below
//  - no active auto: hide fuel log, schedule, service, service order, service log, dashboard
//  - active auto: show auto and schedule; fuel log also requires fuel tracking
//  - active auto and schedule: also show service, service order, service log
//  - dashboard: only when the dashboard schedule check found something
// This is the single place these rules live; toolbar and drawer both consume it.
export function deriveNavVisibility(availability, loggedIn = false, useFuelTracking = true) {
  const { hasAuto, hasSchedule, hasDashboard } = { ...EMPTY_AVAILABILITY, ...availability }
  if (!loggedIn) {
    return {
      '/auto': false,
      '/fuel-log': false,
      '/schedule': false,
      '/service': false,
      '/service-order': false,
      '/service-log': false,
      '/dashboard': false,
    }
  }

  const schedule = hasAuto
  const service = schedule && hasSchedule

  return {
    '/auto': true,
    '/fuel-log': hasAuto && useFuelTracking,
    '/schedule': schedule,
    '/service': service,
    '/service-order': service,
    '/service-log': service,
    '/dashboard': hasAuto && hasDashboard,
  }
}

function loginStatusKey() {
  return new Request('/__cache/nav-availability/login-status')
}

export async function writeCachedLoginStatus(loggedIn) {
  if (typeof caches === 'undefined') {
    return
  }

  try {
    const cache = await caches.open(CACHE_NAME)
    await cache.put(
      loginStatusKey(),
      new Response(JSON.stringify({ loggedIn: Boolean(loggedIn) }), {
        headers: { 'Content-Type': 'application/json' },
      }),
    )
  } catch {
    // Caching is best-effort.
  }
}

function cacheKey(userId) {
  return new Request(`/__cache/nav-availability/${encodeURIComponent(userId)}`)
}

export async function readCachedNavAvailability(userId) {
  if (!userId || typeof caches === 'undefined') {
    return null
  }

  try {
    const cache = await caches.open(CACHE_NAME)
    const response = await cache.match(cacheKey(userId))
    if (!response) {
      return null
    }
    const data = await response.json()
    return {
      hasAuto: Boolean(data.hasAuto),
      hasSchedule: Boolean(data.hasSchedule),
      hasDashboard: Boolean(data.hasDashboard),
    }
  } catch {
    return null
  }
}

export async function writeCachedNavAvailability(userId, availability) {
  if (!userId || typeof caches === 'undefined') {
    return
  }

  try {
    const cache = await caches.open(CACHE_NAME)
    await cache.put(
      cacheKey(userId),
      new Response(JSON.stringify(availability), {
        headers: { 'Content-Type': 'application/json' },
      }),
    )
  } catch {
    // Caching is best-effort.
  }
}
