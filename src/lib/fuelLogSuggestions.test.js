import { test } from 'node:test'
import assert from 'node:assert/strict'
import { fetchFuelLogSuggestions } from './fuelLogSuggestions.js'

function mockClient(pages) {
  const calls = []
  const client = {
    from(table) {
      calls.push(['from', table])
      return {
        select(columns) {
          calls.push(['select', columns])
          return this
        },
        eq(column, value) {
          calls.push(['eq', column, value])
          return this
        },
        order(column) {
          calls.push(['order', column])
          return this
        },
        range(from, to) {
          calls.push(['range', from, to])
          return Promise.resolve(pages.shift())
        },
      }
    },
  }
  return { client, calls }
}

test('loads profile fuel logs across pages and independently deduplicates suggestions', async () => {
  const firstPage = Array.from({ length: 1000 }, () => ({
    station: ' Shell ',
    location: 'Town',
  }))
  const { client, calls } = mockClient([
    { data: firstPage, error: null },
    {
      data: [
        { station: 'shell', location: 'town' },
        { station: 'Arco', location: 'Other' },
        { station: null, location: 'Independent' },
        { station: 'Solo', location: null },
        { station: '', location: ' ' },
      ],
      error: null,
    },
  ])
  assert.deepEqual(await fetchFuelLogSuggestions(client, 42), {
    stations: ['Arco', 'Shell', 'Solo'],
    locations: ['Independent', 'Other', 'Town'],
  })
  assert.deepEqual(calls, [
    ['from', 'fuel_log'],
    ['select', 'station, location, auto!inner(profile_id)'],
    ['eq', 'auto.profile_id', 42],
    ['order', 'fuel_log_id'],
    ['range', 0, 999],
    ['from', 'fuel_log'],
    ['select', 'station, location, auto!inner(profile_id)'],
    ['eq', 'auto.profile_id', 42],
    ['order', 'fuel_log_id'],
    ['range', 1000, 1999],
  ])
})

test('surfaces missing configuration, profile and query failures', async () => {
  await assert.rejects(fetchFuelLogSuggestions(null, 42), /not configured/)
  await assert.rejects(fetchFuelLogSuggestions({}, null), /current profile/)
  const { client } = mockClient([{ data: null, error: new Error('network error') }])
  await assert.rejects(fetchFuelLogSuggestions(client, 42), /network error/)
})
