const PAGE_SIZE = 1000

export async function fetchFuelLogSuggestions(client, profileId) {
  if (!profileId) throw new Error('A current profile is required to load fuel suggestions.')
  if (!client) throw new Error('Supabase client is not configured.')

  const rows = []
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await client
      .from('fuel_log')
      .select('station, location, auto!inner(profile_id)')
      .eq('auto.profile_id', profileId)
      .order('fuel_log_id')
      .range(offset, offset + PAGE_SIZE - 1)
    if (error) throw error
    rows.push(...data)
    if (data.length < PAGE_SIZE) break
  }

  return {
    stations: distinctValues(rows, 'station'),
    locations: distinctValues(rows, 'location'),
  }
}

function distinctValues(rows, field) {
  const unique = new Map()
  for (const row of rows) {
    const value = String(row[field] ?? '').trim()
    if (value && !unique.has(value.toLowerCase())) unique.set(value.toLowerCase(), value)
  }
  return [...unique.values()].sort((a, b) => a.localeCompare(b))
}
