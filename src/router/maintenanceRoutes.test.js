import { test } from 'node:test'
import assert from 'node:assert/strict'
import routes from './routes.js'

test('maintenance pages require maintenance tracking, but dashboard remains available', () => {
  const children = routes[0].children
  for (const path of ['schedule', 'service', 'service-order', 'service-log']) {
    const route = children.find((item) => item.path === path)
    assert.equal(route.meta.requiresAuth, true)
    assert.equal(route.meta.requiresMaintenanceTracking, true)
  }
  assert.notEqual(
    children.find((item) => item.path === 'dashboard').meta.requiresMaintenanceTracking,
    true,
  )
})
