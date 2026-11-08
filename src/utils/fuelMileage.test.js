import { test } from 'node:test'
import assert from 'node:assert/strict'
import { formatMpg, mileageDifference, milesPerGallon } from './fuelMileage.js'

test('calculates a mileage difference and miles per gallon', () => {
  assert.equal(mileageDifference(12000, 12300), 300)
  assert.equal(milesPerGallon('12000', '12300', '10'), 30)
  assert.equal(formatMpg(30), '30.00')
})

test('leaves unavailable or invalid calculations blank', () => {
  for (const [prior, current] of [
    [null, 100],
    [0, null],
    ['', 100],
    [100, 100],
    [101, 100],
  ]) {
    assert.equal(mileageDifference(prior, current), null)
    assert.equal(milesPerGallon(prior, current, 10), null)
  }
  for (const gallons of [null, '', 0, -1, 'invalid']) {
    assert.equal(milesPerGallon(100, 200, gallons), null)
  }
  assert.equal(formatMpg(null), '—')
})
