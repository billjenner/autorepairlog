import { test } from 'node:test'
import assert from 'node:assert/strict'
import { groupStationValues } from './stationLookup.js'

test('groups names case-insensitively while retaining all matching row ids', () => {
  const rows = [
    { station_id: 1, station: ' Shell ', location: 'North' },
    { station_id: 2, station: 'shell', location: 'South' },
    { station_id: 3, station: 'Arco', location: ' north ' },
    { station_id: 4, station: null, location: '' },
  ]
  assert.deepEqual(groupStationValues(rows, 'station'), [
    { name: 'Arco', ids: [3], values: ['Arco'] },
    { name: 'Shell', ids: [1, 2], values: [' Shell ', 'shell'] },
  ])
  assert.deepEqual(groupStationValues(rows, 'location'), [
    { name: 'North', ids: [1, 3], values: ['North', ' north '] },
    { name: 'South', ids: [2], values: ['South'] },
  ])
})
