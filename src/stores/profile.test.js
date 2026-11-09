import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createPinia, setActivePinia } from 'pinia'
import { createServer } from 'vite'

test('profile payload preserves explicit tracking preferences without overwriting omitted fields', async () => {
  const server = await createServer({
    configFile: false,
    server: { middlewareMode: true },
    appType: 'custom',
  })
  try {
    const { useProfileStore } = await server.ssrLoadModule('/src/stores/profile.js')
    setActivePinia(createPinia())
    const store = useProfileStore()
    assert.deepEqual(
      store.buildProfilePayload('user-1', {
        fname: ' Jane ',
        lname: ' Doe ',
        use_fuel_tracking: false,
        use_maintenance_tracking: true,
        allow_web_notifications: false,
      }),
      {
        user_id: 'user-1',
        fname: 'Jane',
        lname: 'Doe',
        use_fuel_tracking: false,
        use_maintenance_tracking: true,
        allow_web_notifications: false,
      },
    )
    assert.deepEqual(store.buildProfilePayload('user-1', {}), {
      user_id: 'user-1',
      fname: '',
      lname: '',
    })
  } finally {
    await server.close()
  }
})
