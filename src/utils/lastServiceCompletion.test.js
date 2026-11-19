import { test } from 'node:test'
import assert from 'node:assert/strict'
import { lastServiceCompletion } from './lastServiceCompletion.js'

test('calculates completion across all schedules for the auto', () => {
  const schedules = [
    { auto_id: 1, service: [{ last_miles: 0 }, { last_date: '2026-01-01' }] },
    { auto_id: 1, service: [{ last_miles: null, last_date: null }] },
    { auto_id: 2, service: [{ last_miles: 100 }] },
  ]

  assert.equal(lastServiceCompletion(schedules, 1), 67)
  assert.equal(lastServiceCompletion(schedules, 2), 100)
})

test('returns zero for no services and does not count missing values', () => {
  assert.equal(lastServiceCompletion([{ auto_id: 1, service: [] }], 1), 0)
  assert.equal(lastServiceCompletion([{ auto_id: 1, service: [{}] }], 1), 0)
  assert.equal(lastServiceCompletion([{ auto_id: 1, service: [{ last_miles: '' }] }], 1), 0)
})
