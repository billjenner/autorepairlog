import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createPinia, setActivePinia } from 'pinia'
import { createServer } from 'vite'

test('non-admin lists use all accessible profiles and surface RPC failures', async () => {
  const calls = []
  let rpcError = null
  const client = {
    rpc(name) {
      calls.push(['rpc', name])
      return Promise.resolve({
        data: rpcError ? null : [{ profile_id: 26 }, { profile_id: 2 }],
        error: rpcError,
      })
    },
    from(table) {
      const query = {
        select() {
          return this
        },
        eq() {
          return this
        },
        order() {
          return this
        },
        in(field, values) {
          calls.push([table, field, values])
          return this
        },
        then(resolve) {
          resolve({ data: [], count: 0, error: null })
        },
      }
      return query
    },
  }
  globalThis.__sharingTestClient = client
  const server = await createServer({
    configFile: false,
    server: { middlewareMode: true, hmr: false },
    appType: 'custom',
    plugins: [
      {
        name: 'sharing-test-client',
        enforce: 'pre',
        resolveId(id) {
          if (id.replaceAll('\\', '/').endsWith('/lib/supabase')) {
            return '\0sharing-test-client'
          }
        },
        load(id) {
          if (id === '\0sharing-test-client') {
            return 'export const supabase = globalThis.__sharingTestClient'
          }
        },
      },
    ],
  })
  try {
    const [
      { useAutoStore },
      { useScheduleStore },
      { useServiceStore },
      { useServiceOrderStore },
      { useServiceLogStore },
    ] = await Promise.all([
      server.ssrLoadModule('/src/stores/auto.js'),
      server.ssrLoadModule('/src/stores/schedule.js'),
      server.ssrLoadModule('/src/stores/service.js'),
      server.ssrLoadModule('/src/stores/serviceOrder.js'),
      server.ssrLoadModule('/src/stores/serviceLog.js'),
    ])
    setActivePinia(createPinia())
    const auto = useAutoStore()
    const schedule = useScheduleStore()
    const service = useServiceStore()
    const orders = useServiceOrderStore()
    const logs = useServiceLogStore()
    const options = { profileId: 26, isAdmin: false }
    await auto.loadAuto(26)
    assert.equal(auto.error, null)
    await schedule.loadTemplateAutos(options)
    await schedule.loadSchedules(options)
    await service.loadScheduleOptions(options)
    await service.loadDashboardScheduleOptions(options)
    await service.loadNavAvailability(options)
    await orders.loadAutoOptions(options)
    await logs.loadOrderOptions(options)
    const filters = calls.filter((call) => call[0] !== 'rpc')
    assert.equal(filters.length, 10)
    for (const [, field, ids] of filters) {
      assert.ok(['profile_id', 'auto.profile_id'].includes(field))
      assert.deepEqual(ids, [26, 2])
    }

    calls.length = 0
    rpcError = new Error('RPC failed')
    auto.auto = [{ auto_id: 123 }]
    await auto.loadAuto(26)
    assert.deepEqual(auto.auto, [])
    assert.equal(auto.error, 'RPC failed')
    assert.equal(
      calls.some((call) => call[0] !== 'rpc'),
      false,
    )
  } finally {
    await server.close()
    delete globalThis.__sharingTestClient
  }
})
