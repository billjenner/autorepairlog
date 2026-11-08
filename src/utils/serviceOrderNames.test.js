import { test } from 'node:test'
import assert from 'node:assert/strict'
import { distinctServiceOrderNames, fetchServiceOrderNames } from './serviceOrderNames.js'

test('deduplicates, trims and sorts names without mixing fields', () => {
  const rows = [
    { shop_name: ' Z Shop ', mechanic_name: 'Alice' },
    { shop_name: 'z shop', mechanic_name: ' alice ' },
    { shop_name: 'A Shop', mechanic_name: null },
    { shop_name: '', mechanic_name: 'Bob' },
  ]
  assert.deepEqual(distinctServiceOrderNames(rows, 'shop_name'), ['A Shop', 'Z Shop'])
  assert.deepEqual(distinctServiceOrderNames(rows, 'mechanic_name'), ['Alice', 'Bob'])
})

test('fetches all pages scoped to the current auto owner profile', async () => {
  const calls = []
  const first = Array.from({ length: 1000 }, (_, i) => ({
    shop_name: `Shop ${i}`,
    mechanic_name: null,
  }))
  const query = {
    select(value) {
      calls.push(['select', value])
      return this
    },
    eq(field, value) {
      calls.push(['eq', field, value])
      return this
    },
    order(field, options) {
      calls.push(['order', field, options])
      return this
    },
    range(start, end) {
      calls.push(['range', start, end])
      return Promise.resolve({
        data: start === 0 ? first : [{ shop_name: 'Last', mechanic_name: 'Sam' }],
        error: null,
      })
    },
  }
  const client = {
    from(table) {
      calls.push(['from', table])
      return query
    },
  }
  const result = await fetchServiceOrderNames(client, 42)
  assert.equal(result.shops.length, 1001)
  assert.deepEqual(result.mechanics, ['Sam'])
  assert.equal(
    calls.filter((call) => call[0] === 'eq' && call[1] === 'auto.profile_id' && call[2] === 42)
      .length,
    2,
  )
  assert.ok(calls.some((call) => call[0] === 'range' && call[1] === 1000))
})

test('requires a profile and surfaces query failures', async () => {
  await assert.rejects(fetchServiceOrderNames({}, null), /current profile/)
  const query = {
    select() {
      return this
    },
    eq() {
      return this
    },
    order() {
      return this
    },
    range() {
      return Promise.resolve({ error: new Error('query failed') })
    },
  }
  await assert.rejects(fetchServiceOrderNames({ from: () => query }, 7), /query failed/)
})
