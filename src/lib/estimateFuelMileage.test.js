import { test } from 'node:test'
import assert from 'node:assert/strict'
import { estimateFuelMileage } from './estimateFuelMileage.js'

function mockClient(data, error = null) {
  const calls = []
  const query = {
    select(value) {
      calls.push(['select', value])
      return this
    },
    eq(field, value) {
      calls.push(['eq', field, value])
      return this
    },
    gt(field, value) {
      calls.push(['gt', field, value])
      return this
    },
    lte(field, value) {
      calls.push(['lte', field, value])
      return this
    },
    or(value) {
      calls.push(['or', value])
      return this
    },
    order(field, options) {
      calls.push(['order', field, options])
      return this
    },
    limit(value) {
      calls.push(['limit', value])
      return this
    },
    maybeSingle() {
      calls.push(['maybeSingle'])
      return Promise.resolve({ data, error })
    },
  }
  return {
    calls,
    from(table) {
      calls.push(['from', table])
      return query
    },
  }
}

const entry = { auto_id: 7, date: '2026-03-01', prior_mileage: 1000, gallons: 2.5, mileage: null }

test('estimates missing mileage with the latest earlier available MPG', async () => {
  const client = mockClient({ mile_per_gallon: '30.25' })
  assert.deepEqual(await estimateFuelMileage(client, entry), { mileage: 1076, warning: null })
  assert.deepEqual(client.calls, [
    ['from', 'fuel_log'],
    ['select', 'mile_per_gallon'],
    ['eq', 'auto_id', 7],
    ['gt', 'mile_per_gallon', 0],
    ['lte', 'date', '2026-03-01'],
    ['order', 'date', { ascending: false }],
    ['order', 'fuel_log_id', { ascending: false }],
    ['limit', 1],
    ['maybeSingle'],
  ])
})

test('excludes the edited record and later records on the same day', async () => {
  const client = mockClient({ mile_per_gallon: 20 })
  assert.equal((await estimateFuelMileage(client, entry, 15)).mileage, 1050)
  assert.ok(
    client.calls.some(
      (call) =>
        call[0] === 'or' &&
        call[1] === 'date.lt.2026-03-01,and(date.eq.2026-03-01,fuel_log_id.lt.15)',
    ),
  )
})

test('does not query or overwrite supplied mileage or estimate without inputs', async () => {
  for (const changes of [
    { mileage: 0 },
    { mileage: '1234' },
    { prior_mileage: null },
    { prior_mileage: '' },
    { gallons: null },
    { gallons: '' },
  ]) {
    const client = mockClient(null)
    assert.deepEqual(await estimateFuelMileage(client, { ...entry, ...changes }), {
      mileage: null,
      warning: null,
    })
    assert.deepEqual(client.calls, [])
  }
})

test('reports when no previous MPG is available', async () => {
  assert.deepEqual(await estimateFuelMileage(mockClient(null), entry), {
    mileage: null,
    warning: 'Mileage could not be estimated: no previous MPG is available.',
  })
})

test('rejects invalid input, query errors, and invalid estimates', async () => {
  await assert.rejects(estimateFuelMileage(null, entry), /not configured/)
  for (const changes of [
    { gallons: 0 },
    { gallons: -1 },
    { gallons: 'invalid' },
    { prior_mileage: -1 },
    { prior_mileage: 1.5 },
    { date: 'invalid' },
  ]) {
    await assert.rejects(estimateFuelMileage(mockClient(null), { ...entry, ...changes }))
  }
  await assert.rejects(estimateFuelMileage(mockClient(null), entry, 'invalid'), /fuel log ID/)
  await assert.rejects(
    estimateFuelMileage(mockClient(null, new Error('network error')), entry),
    /network error/,
  )
  await assert.rejects(estimateFuelMileage(mockClient({ mile_per_gallon: 0 }), entry), /invalid/)
  await assert.rejects(
    estimateFuelMileage(mockClient({ mile_per_gallon: 100 }), {
      ...entry,
      prior_mileage: 2147483640,
    }),
    /allowed mileage range/,
  )
  await assert.rejects(
    estimateFuelMileage(mockClient({ mile_per_gallon: 0.01 }), { ...entry, gallons: 0.001 }),
    /allowed mileage range/,
  )
})

test('uses gallons rounded to the precision stored by the fuel log', async () => {
  const client = mockClient({ mile_per_gallon: 100 })
  assert.equal((await estimateFuelMileage(client, { ...entry, gallons: 1.0046 })).mileage, 1101)
})
