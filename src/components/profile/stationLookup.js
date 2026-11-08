export function groupStationValues(rows, field) {
  const groups = new Map()
  for (const row of rows) {
    const name = String(row[field] ?? '').trim()
    if (!name) continue
    const key = name.toLowerCase()
    if (!groups.has(key)) groups.set(key, { name, ids: [], values: [] })
    groups.get(key).ids.push(row.station_id)
    if (!groups.get(key).values.includes(row[field])) groups.get(key).values.push(row[field])
  }
  return [...groups.values()].sort((a, b) => a.name.localeCompare(b.name))
}
