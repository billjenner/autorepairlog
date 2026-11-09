import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'vite'

test('maintenance preference prevents loading and stops an in-flight notification check', async () => {
  const server = await createServer({
    configFile: false,
    server: { middlewareMode: true },
    appType: 'custom',
    plugins: [
      {
        name: 'notification-test-dependencies',
        resolveId(id) {
          if (id === '@/lib/supabase') return '\0test-supabase'
          if (id === '@/utils/rules') return '\0test-rules'
        },
        load(id) {
          if (id === '\0test-supabase') {
            return 'export const supabase = globalThis.__notificationTest.client'
          }
          if (id === '\0test-rules') {
            return 'export const predictFutureServices = (...args) => globalThis.__notificationTest.predict(...args)'
          }
        },
      },
    ],
  })

  let queries = 0
  let predictions = 0
  let notifyCount = 0
  let release
  globalThis.__notificationTest = {
    client: {
      from() {
        queries++
        throw new Error('Unexpected database query')
      },
    },
    predict() {
      predictions++
      return new Promise((resolve) => {
        release = resolve
      })
    },
  }
  try {
    const { checkServiceNotifications } = await server.ssrLoadModule('/src/utils/notifications.js')
    const q = { notify: () => notifyCount++ }
    const profile = {
      profile_id: 42,
      allow_in_app_notifications: true,
      use_maintenance_tracking: false,
    }
    await checkServiceNotifications(q, profile)
    assert.equal(predictions, 0)
    assert.equal(queries, 0)
    assert.equal(notifyCount, 0)

    profile.use_maintenance_tracking = true
    let enabled = true
    const pending = checkServiceNotifications(q, profile, Date.now(), () => enabled)
    assert.equal(predictions, 1)
    enabled = false
    release([
      {
        services: [{ allow_notifications: true, miles_to_go: -1 }],
      },
    ])
    await pending
    assert.equal(queries, 0)
    assert.equal(notifyCount, 0)

    const defaultProfile = { profile_id: 43, allow_in_app_notifications: true }
    const defaultPending = checkServiceNotifications(q, defaultProfile)
    assert.equal(predictions, 2)
    release([])
    await defaultPending
  } finally {
    delete globalThis.__notificationTest
    await server.close()
  }
})
