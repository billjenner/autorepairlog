import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'vite'

test('login checks include shared autos and report inaccessible profiles', async () => {
  const server = await createServer({
    configFile: false,
    server: { middlewareMode: true },
    appType: 'custom',
    plugins: [
      {
        name: 'rules-test-supabase',
        resolveId(id) {
          if (id === '@/lib/supabase') return '\0rules-test-supabase'
        },
        load(id) {
          if (id === '\0rules-test-supabase') {
            return 'export const supabase = globalThis.__rulesTestClient'
          }
        },
      },
    ],
  })

  const calls = []
  const notices = []
  let accessible = [{ profile_id: 26 }, { profile_id: 2 }]
  let accessError = null
  globalThis.__rulesTestClient = {
    rpc(name) {
      calls.push(['rpc', name])
      return Promise.resolve({ data: accessible, error: accessError })
    },
    from(table) {
      const filters = []
      const query = {
        select() {
          return this
        },
        eq(field, value) {
          filters.push(['eq', field, value])
          return this
        },
        in(field, value) {
          filters.push(['in', field, value])
          return this
        },
        then(resolve) {
          calls.push([table, filters])
          resolve({ data: [{ auto_id: 1 }], error: null })
        },
      }
      return query
    },
  }
  try {
    const { checkLoginBusinessRules } = await server.ssrLoadModule('/src/utils/rules.js')
    const q = { notify: (notice) => notices.push(notice) }
    await checkLoginBusinessRules(q, 26, null, {}, false)
    assert.deepEqual(calls[0], ['rpc', 'accessible_profile_ids'])
    assert.ok(
      calls[1][1].some(
        (filter) =>
          filter[0] === 'in' &&
          filter[1] === 'profile_id' &&
          JSON.stringify(filter[2]) === JSON.stringify([26, 2]),
      ),
    )
    assert.equal(notices.length, 0)

    calls.length = 0
    accessible = []
    await checkLoginBusinessRules(q, 26, null, {}, false)
    assert.equal(calls.length, 1)
    assert.equal(notices.at(-1).type, 'negative')

    calls.length = 0
    accessError = new Error('RPC failed')
    await checkLoginBusinessRules(q, 26, null, {}, false)
    assert.equal(calls.length, 1)
    assert.equal(notices.at(-1).type, 'negative')
  } finally {
    delete globalThis.__rulesTestClient
    await server.close()
  }
})
