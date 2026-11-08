export function distinctServiceOrderNames(rows, field) {
  const names = new Map()
  for (const row of rows) {
    const name = String(row[field] ?? '').trim()
    if (name && !names.has(name.toLowerCase())) names.set(name.toLowerCase(), name)
  }
  return [...names.values()].sort((a, b) => a.localeCompare(b))
}

export async function fetchServiceOrderNames(client, profileId) {
  if (!client) throw new Error('Supabase client is not configured.')
  if (!profileId) throw new Error('A current profile is required.')
  const rows = []
  const pageSize = 1000
  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await client
      .from('service_order')
      .select('shop_name, mechanic_name, auto!inner(profile_id)')
      .eq('auto.profile_id', profileId)
      .order('service_order_id', { ascending: true })
      .range(offset, offset + pageSize - 1)
    if (error) throw error
    rows.push(...(data || []))
    if (!data || data.length < pageSize) break
  }
  return {
    shops: distinctServiceOrderNames(rows, 'shop_name'),
    mechanics: distinctServiceOrderNames(rows, 'mechanic_name'),
  }
}
