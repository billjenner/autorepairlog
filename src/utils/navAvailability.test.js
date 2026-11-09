import { test } from 'node:test'
import assert from 'node:assert/strict'
import { deriveNavVisibility } from './navAvailability.js'

test('fuel navigation requires login, an active auto, and fuel tracking', () => {
  const availability = { hasAuto: true, hasSchedule: true, hasDashboard: true }
  assert.equal(deriveNavVisibility(availability, true, true)['/fuel-log'], true)
  assert.equal(deriveNavVisibility(availability, true, false)['/fuel-log'], false)
  assert.equal(
    deriveNavVisibility({ ...availability, hasAuto: false }, true, true)['/fuel-log'],
    false,
  )
  assert.equal(deriveNavVisibility(availability, false, true)['/fuel-log'], false)
  assert.equal(deriveNavVisibility(availability, true)['/fuel-log'], true)
})

test('fuel preference does not change other navigation options', () => {
  const availability = { hasAuto: true, hasSchedule: true, hasDashboard: true }
  const enabled = deriveNavVisibility(availability, true, true)
  const disabled = deriveNavVisibility(availability, true, false)
  delete enabled['/fuel-log']
  delete disabled['/fuel-log']
  assert.deepEqual(disabled, enabled)
})
