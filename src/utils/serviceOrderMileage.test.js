import { test } from 'node:test'
import assert from 'node:assert/strict'
import { recordServiceOrderMileage } from './serviceOrderMileage.js'

function store(latest, exists = false) {
  const calls = []
  return {
    calls,
    error: null,
    async fetchLatestMilesChecked(autoId) {
      calls.push(['latest', autoId])
      return latest
    },
    async hasMileageRecord(autoId, date, miles) {
      calls.push(['exists', autoId, date, miles])
      return exists
    },
    async createMileage(record) {
      calls.push(['create', record])
      return record
    },
  }
}

const order = { auto_id: 7, service_date: '2026-01-03', mileage_at_service: 1200 }

test('records higher mileage with the service date and auto', async () => {
  for (const latest of [1000, null]) {
    const mileage = store(latest)
    await recordServiceOrderMileage(mileage, order)
    assert.deepEqual(mileage.calls, [
      ['latest', 7],
      ['exists', 7, '2026-01-03', 1200],
      ['create', { auto_id: 7, date: '2026-01-03', miles: 1200 }],
    ])
  }
})

test('does not insert missing, equal, lower or already recorded mileage', async () => {
  for (const value of [null, undefined, '']) {
    const mileage = store(null)
    await recordServiceOrderMileage(mileage, { ...order, mileage_at_service: value })
    assert.deepEqual(mileage.calls, [])
  }
  for (const latest of [1200, 1300]) {
    const mileage = store(latest)
    await recordServiceOrderMileage(mileage, order)
    assert.deepEqual(mileage.calls, [['latest', 7]])
  }
  const mileage = store(1000, true)
  await recordServiceOrderMileage(mileage, order)
  assert.equal(mileage.calls.length, 2)
})

test('surfaces read and save failures for retry', async () => {
  const mileage = store(1000)
  await assert.rejects(recordServiceOrderMileage(mileage, { ...order, service_date: null }), /date/)
  mileage.hasMileageRecord = async () => {
    throw new Error('lookup failed')
  }
  await assert.rejects(recordServiceOrderMileage(mileage, order), /lookup failed/)
  mileage.hasMileageRecord = async () => false
  mileage.createMileage = async () => null
  mileage.error = 'insert failed'
  await assert.rejects(recordServiceOrderMileage(mileage, order), /insert failed/)
  mileage.fetchLatestMilesChecked = async () => {
    throw new Error('read failed')
  }
  await assert.rejects(recordServiceOrderMileage(mileage, order), /read failed/)
})
