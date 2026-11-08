import { test } from 'node:test'
import assert from 'node:assert/strict'
import { clearStationValues, fetchStationRows, insertStationRow } from './stationLookup.js'

function mockClient(result) {
  const calls = []
  const query = {
    select(...args) {
      calls.push(['select', ...args])
      return this
    },
    eq(...args) {
      calls.push(['eq', ...args])
      return this
    },
    in(...args) {
      calls.push(['in', ...args])
      return this
    },
    insert(...args) {
      calls.push(['insert', ...args])
      return this
    },
    update(...args) {
      calls.push(['update', ...args])
      return this
    },
    then(resolve, reject) {
      return Promise.resolve(result).then(resolve, reject)
    },
  }
  return {
    calls,
    from: (table) => {
      calls.push(['from', table])
      return query
    },
  }
}

test('reads station rows only for the current profile', async () => {
  const rows = [{ station_id: 1, station: 'A', location: 'B' }]
  const client = mockClient({ data: rows, error: null })
  assert.deepEqual(await fetchStationRows(client, 42), rows)
  assert.deepEqual(client.calls, [
    ['from', 'station'],
    ['select', 'station_id, station, location'],
    ['eq', 'profile_id', 42],
  ])
})

test('includes the profile when inserting station values', async () => {
  const client = mockClient({ error: null })
  await insertStationRow(client, 42, 'A', 'B')
  assert.deepEqual(client.calls, [
    ['from', 'station'],
    ['insert', { profile_id: 42, station: 'A', location: 'B' }],
  ])
})

test('clears only matching values for the current profile', async () => {
  const client = mockClient({ data: [{ station_id: 1 }], error: null })
  await clearStationValues(client, 42, 'station', { ids: [1], values: ['A'] })
  assert.deepEqual(client.calls, [
    ['from', 'station'],
    ['update', { station: null }],
    ['eq', 'profile_id', 42],
    ['in', 'station_id', [1]],
    ['in', 'station', ['A']],
    ['select', 'station_id'],
  ])
})

test('rejects missing profiles, database errors and incomplete updates', async () => {
  const client = mockClient({ data: [], error: null })
  await assert.rejects(fetchStationRows(client, null), /current profile/)
  await assert.rejects(insertStationRow(client, null, 'A', 'B'), /current profile/)
  await assert.rejects(
    clearStationValues(client, null, 'station', { ids: [1], values: ['A'] }),
    /current profile/,
  )
  assert.deepEqual(client.calls, [])
  await assert.rejects(
    clearStationValues(client, 42, 'station', { ids: [1], values: ['A'] }),
    /could not be updated/,
  )
  await assert.rejects(
    fetchStationRows(mockClient({ error: new Error('network error') }), 42),
    /network error/,
  )
})
