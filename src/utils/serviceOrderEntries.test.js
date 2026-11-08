import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildServiceLogEntry } from './serviceOrderEntries.js'

test('service logs use their own notes instead of the order notes', () => {
  const order = {
    service_order_id: 7,
    service_date: '2026-01-02',
    mileage_at_service: 123,
    notes: 'Order notes',
  }
  const form = { service_date: '2026-01-01', mileage_at_service: 100, notes: 'Form notes' }
  const service = { service_id: 3, name: 'Oil change' }
  const entry = { notes: '<p>Oil notes</p>', parts: 10, labor: 20, total: '30' }
  assert.deepEqual(buildServiceLogEntry(order, form, service, entry), {
    service_order_id: 7,
    service_id: 3,
    service_date: '2026-01-02',
    service_miles: 123,
    name: 'Oil change',
    notes: '<p>Oil notes</p>',
    parts: 10,
    labor: 20,
    total_cost: 30,
    use_total_cost: true,
  })
  assert.equal(buildServiceLogEntry(order, form, service, { ...entry, notes: '' }).notes, '')
  assert.equal(
    buildServiceLogEntry(order, form, service, { ...entry, notes: 'Other' }).notes,
    'Other',
  )
})
