// Persists the per-user "dashboard enabled" flag in Cache Storage (the same storage
// the service worker uses) so it survives reloads and works offline.
const CACHE_NAME = 'autorepairlog-dashboard-availability'

function cacheKey(userId) {
  return new Request(`/__cache/dashboard-enabled/${encodeURIComponent(userId)}`)
}

export async function readCachedDashboardEnabled(userId) {
  if (!userId || typeof caches === 'undefined') {
    return null
  }

  try {
    const cache = await caches.open(CACHE_NAME)
    const response = await cache.match(cacheKey(userId))
    if (!response) {
      return null
    }
    const { enabled } = await response.json()
    return typeof enabled === 'boolean' ? enabled : null
  } catch {
    return null
  }
}

export async function writeCachedDashboardEnabled(userId, enabled) {
  if (!userId || typeof caches === 'undefined') {
    return
  }

  try {
    const cache = await caches.open(CACHE_NAME)
    await cache.put(
      cacheKey(userId),
      new Response(JSON.stringify({ enabled: Boolean(enabled) }), {
        headers: { 'Content-Type': 'application/json' },
      }),
    )
  } catch {
    // Caching is best-effort.
  }
}
