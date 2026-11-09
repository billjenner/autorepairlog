import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  addProfileShare,
  fetchProfileShares,
  groupActiveShares,
  removeProfileShare,
  validateShareEmail,
} from './profileShares.js'

function mockClient(responses) {
  const calls = []
  const client = {
    from(table) {
      calls.push(['from', table])
      const query = {
        select(value) {
          calls.push(['select', value])
          return this
        },
        insert(value) {
          calls.push(['insert', value])
          return this
        },
        update(value) {
          calls.push(['update', value])
          return this
        },
        delete() {
          calls.push(['delete'])
          return this
        },
        eq(field, value) {
          calls.push(['eq', field, value])
          return this
        },
        in(field, value) {
          calls.push(['in', field, value])
          return this
        },
        order(field) {
          calls.push(['order', field])
          return this
        },
        range(from, to) {
          calls.push(['range', from, to])
          return Promise.resolve(responses.shift())
        },
        single() {
          calls.push(['single'])
          return Promise.resolve(responses.shift())
        },
        then(resolve, reject) {
          return Promise.resolve(responses.shift()).then(resolve, reject)
        },
      }
      return query
    },
  }
  return { client, calls }
}

test('validates emails and groups only active entries case-insensitively', () => {
  assert.equal(validateShareEmail(' bad ', ''), 'Enter a valid email address.')
  assert.match(validateShareEmail(' ME@example.com ', 'me@example.com'), /another user/)
  assert.equal(validateShareEmail('user@example.com', 'me@example.com'), true)
  assert.deepEqual(
    groupActiveShares([
      { profile_share_id: 1, email: ' Foo@example.com ', is_active: true },
      { profile_share_id: 2, email: 'foo@example.com', is_active: true },
      { profile_share_id: 3, email: 'old@example.com', is_active: false },
      { profile_share_id: 4, email: '', is_active: true },
    ]),
    [{ email: 'foo@example.com', ids: [1, 2] }],
  )
})

test('loads all entries scoped to the current profile', async () => {
  const first = Array.from({ length: 1000 }, (_, id) => ({ profile_share_id: id }))
  const { client, calls } = mockClient([
    { data: first, error: null },
    { data: [{ profile_share_id: 1000 }], error: null },
  ])
  assert.equal((await fetchProfileShares(client, 42)).length, 1001)
  assert.deepEqual(
    calls.filter((call) => call[0] === 'eq'),
    [
      ['eq', 'profile_id', 42],
      ['eq', 'profile_id', 42],
    ],
  )
  assert.deepEqual(
    calls.filter((call) => call[0] === 'range'),
    [
      ['range', 0, 999],
      ['range', 1000, 1999],
    ],
  )
})

test('adds normalized entries, rejects duplicates, and reactivates inactive entries', async () => {
  const added = mockClient([
    { data: [], error: null },
    { data: { profile_share_id: 1 }, error: null },
  ])
  await addProfileShare(added.client, 42, '  USER@example.com ', 'me@example.com')
  assert.ok(
    added.calls.some(
      (call) =>
        call[0] === 'insert' &&
        call[1].profile_id === 42 &&
        call[1].email === 'user@example.com' &&
        call[1].is_active === true,
    ),
  )

  const inactive = mockClient([
    { data: [{ profile_share_id: 8, email: 'USER@example.com', is_active: false }], error: null },
    { data: { profile_share_id: 8 }, error: null },
  ])
  await addProfileShare(inactive.client, 42, 'user@example.com', '')
  assert.ok(inactive.calls.some((call) => call[0] === 'update' && call[1].is_active))
  assert.ok(
    inactive.calls.some((call) => call[0] === 'eq' && call[1] === 'profile_id' && call[2] === 42),
  )
  assert.ok(
    inactive.calls.some(
      (call) => call[0] === 'eq' && call[1] === 'profile_share_id' && call[2] === 8,
    ),
  )

  const duplicate = mockClient([
    { data: [{ profile_share_id: 1, email: 'USER@example.com', is_active: true }], error: null },
  ])
  await assert.rejects(addProfileShare(duplicate.client, 42, 'user@example.com', ''), /already/)
  assert.equal(
    duplicate.calls.some((call) => call[0] === 'insert'),
    false,
  )
})

test('removes all matching active entries only for the current profile', async () => {
  const { client, calls } = mockClient([
    { data: [{ profile_share_id: 1 }, { profile_share_id: 2 }], error: null },
  ])
  await removeProfileShare(client, 42, { ids: [1, 2] })
  assert.ok(calls.some((call) => call[0] === 'eq' && call[1] === 'profile_id' && call[2] === 42))
  assert.deepEqual(
    calls.find((call) => call[0] === 'in'),
    ['in', 'profile_share_id', [1, 2]],
  )
})

test('surfaces missing profiles, database errors, and incomplete removals', async () => {
  await assert.rejects(fetchProfileShares(null, null), /current profile/)
  await assert.rejects(fetchProfileShares(null, 42), /not configured/)
  await assert.rejects(
    fetchProfileShares(mockClient([{ data: null, error: new Error('network error') }]).client, 42),
    /network error/,
  )
  await assert.rejects(
    removeProfileShare(mockClient([{ data: [], error: null }]).client, 42, { ids: [1] }),
    /could not be removed/,
  )
})
