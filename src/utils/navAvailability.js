// Central rules for which navigation buttons/menu items are shown, plus a Cache Storage
// persistence layer (cache first, network second) so the nav renders quickly and offline.
const CACHE_NAME = 'autorepairlog-nav-availability'

export const EMPTY_AVAILABILITY = Object.freeze({
  hasAuto: false,
  hasSchedule: false,
  hasDashboard: false,
})

// Visibility rules:
//  - no active auto: hide schedule, service, service order, service log, dashboard
//  - active auto: show auto and schedule
//  - active auto and schedule: also show service, service order, service log
//  - dashboard: only when the dashboard schedule check found something
export function deriveNavVisibility(availability, loggedIn = true) {
  const { hasAuto, hasSchedule, hasDashboard } = { ...EMPTY_AVAILABILITY, ...availability }
  const auto = loggedIn
  const schedule = loggedIn && hasAuto
  const service = schedule && hasSchedule

  return {
    '/auto': auto,
    '/schedule': schedule,
    '/service': service,
    '/service-order': service,
    '/service-log': service,
    '/dashboard': loggedIn && hasAuto && hasDashboard,
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
