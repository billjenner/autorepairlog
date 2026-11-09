function requireProfile(client, profileId) {
  if (!profileId) throw new Error('A current profile is required to manage shared users.')
  if (!client) throw new Error('Supabase client is not configured.')
}

export function normalizeEmail(email) {
  return String(email ?? '')
    .trim()
    .toLowerCase()
}

export function validateShareEmail(email, ownEmail) {
  const normalized = normalizeEmail(email)
  if (!normalized || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    return 'Enter a valid email address.'
  }
  if (normalized === normalizeEmail(ownEmail)) {
    return 'Enter another user’s email address.'
  }
  return true
}

export function groupActiveShares(rows) {
  const groups = new Map()
  for (const row of rows) {
    if (!row.is_active) continue
    const email = normalizeEmail(row.email)
    if (!email) continue
    if (!groups.has(email)) groups.set(email, { email, ids: [] })
    groups.get(email).ids.push(row.profile_share_id)
  }
  return [...groups.values()].sort((a, b) => a.email.localeCompare(b.email))
}

export async function fetchProfileShares(client, profileId) {
  requireProfile(client, profileId)
  const rows = []
  const pageSize = 1000
  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await client
      .from('profile_share')
      .select('profile_share_id, email, is_active')
      .eq('profile_id', profileId)
      .order('profile_share_id')
      .range(offset, offset + pageSize - 1)
    if (error) throw error
    rows.push(...data)
    if (data.length < pageSize) return rows
  }
}

export async function addProfileShare(client, profileId, email, ownEmail) {
  requireProfile(client, profileId)
  const validation = validateShareEmail(email, ownEmail)
  if (validation !== true) throw new Error(validation)
  const normalized = normalizeEmail(email)
  const rows = await fetchProfileShares(client, profileId)
  const matches = rows.filter((row) => normalizeEmail(row.email) === normalized)
  if (matches.some((row) => row.is_active)) throw new Error('This email is already in your list.')

  const inactive = matches[0]
  const query = inactive
    ? client
        .from('profile_share')
        .update({ email: normalized, is_active: true })
        .eq('profile_id', profileId)
        .eq('profile_share_id', inactive.profile_share_id)
    : client
        .from('profile_share')
        .insert({ profile_id: profileId, email: normalized, is_active: true })
  const { data, error } = await query.select('profile_share_id').single()
  if (error) throw error
  if (!data) throw new Error('The shared user could not be saved.')
}

export async function removeProfileShare(client, profileId, item) {
  requireProfile(client, profileId)
  if (!item?.ids?.length) throw new Error('A shared user is required.')
  const { data, error } = await client
    .from('profile_share')
    .delete()
    .eq('profile_id', profileId)
    .in('profile_share_id', item.ids)
    .select('profile_share_id')
  if (error) throw error
  if (data.length !== item.ids.length) {
    throw new Error('Some entries could not be removed. Reload and try again.')
  }
}
