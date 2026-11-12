import { test } from 'node:test'
import assert from 'node:assert/strict'
import { fetchPriorFuelMileage, PriorMileageEstimateError } from './priorFuelMileage.js'

function mockClient(rows, failure = null) {
  const calls = []
  return {
    calls,
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
        lte(column, value) {
          calls.push(['lte', column, value])
          return this
        },
        order(column, options) {
          calls.push(['order', column, options])
          return this
        },
        range(from, to) {
          calls.push(['range', from, to])
          return Promise.resolve({ data: rows.slice(from, to + 1), error: failure })
        },
      }
    },
  }
}

test('uses the immediately preceding mileage without estimating', async () => {
  const client = mockClient([{ mileage: 0, mile_per_gallon: null, gallons: null }])
  assert.equal(await fetchPriorFuelMileage(client, 12, '2026-03-01'), 0)
  assert.deepEqual(client.calls, [
    ['from', 'fuel_log'],
    ['select', 'mileage, mile_per_gallon, gallons'],
    ['eq', 'auto_id', 12],
    ['lte', 'date', '2026-03-01'],
    ['order', 'date', { ascending: false }],
    ['order', 'fuel_log_id', { ascending: false }],
    ['range', 0, 999],
  ])
})

test('estimates using the anchor MPG and only gallons from intervening records', async () => {
  const client = mockClient([
    { mileage: null, gallons: '2.500', mile_per_gallon: 99 },
    { mileage: null, gallons: '1.000', mile_per_gallon: null },
    { mileage: 1000, gallons: '4.000', mile_per_gallon: '30.25' },
    { mileage: 500, gallons: 99, mile_per_gallon: 99 },
  ])
  assert.equal(await fetchPriorFuelMileage(client, 12, '2026-03-01'), 1106)
})

test('does not require or include gallons from the mileage-bearing record', async () => {
  for (const gallons of [null, 'invalid', 999]) {
    const client = mockClient([
      { mileage: null, gallons: 2 },
      { mileage: 100, gallons, mile_per_gallon: 20 },
    ])
    assert.equal(await fetchPriorFuelMileage(client, 1, '2026-03-01'), 140)
  }
})

test('continues across database pages to find an anchor', async () => {
  const rows = Array.from({ length: 1000 }, () => ({ mileage: null, gallons: 1 }))
  rows.push({ mileage: 100, gallons: 2, mile_per_gallon: 10 })
  const client = mockClient(rows)
  assert.equal(await fetchPriorFuelMileage(client, 1, '2026-03-01'), 10100)
  assert.ok(client.calls.some((call) => call[0] === 'range' && call[1] === 1000))
})

test('returns null when no fuel mileage exists', async () => {
  assert.equal(await fetchPriorFuelMileage(mockClient([]), 1, '2026-03-01'), null)
  assert.equal(
    await fetchPriorFuelMileage(mockClient([{ mileage: null, gallons: null }]), 1, '2026-03-01'),
    null,
  )
})

test('reports incomplete or invalid data rather than estimating with missing values', async () => {
  for (const rows of [
    [
      { mileage: null, gallons: null },
      { mileage: 100, gallons: 2, mile_per_gallon: 20 },
    ],
    [
      { mileage: null, gallons: 1 },
      { mileage: 100, gallons: 2, mile_per_gallon: null },
    ],
    [
      { mileage: null, gallons: 1 },
      { mileage: 2147483647, gallons: 2, mile_per_gallon: 20 },
    ],
  ]) {
    await assert.rejects(
      fetchPriorFuelMileage(mockClient(rows), 1, '2026-03-01'),
      PriorMileageEstimateError,
    )
  }
})

test('surfaces configuration and query failures', async () => {
  await assert.rejects(fetchPriorFuelMileage(null, 1, '2026-03-01'), /not configured/)
  await assert.rejects(fetchPriorFuelMileage(mockClient([]), 1, null), /auto and date/)
  await assert.rejects(
    fetchPriorFuelMileage(mockClient([], new Error('network error')), 1, '2026-03-01'),
    /network error/,
  )
})
