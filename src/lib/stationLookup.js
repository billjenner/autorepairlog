function requireProfile(profileId) {
  if (!profileId) throw new Error('A current profile is required to manage fuel stations.')
}

export async function fetchStationRows(client, profileId) {
  requireProfile(profileId)
  if (!client) throw new Error('Supabase client is not configured.')
  const { data, error } = await client
    .from('station')
    .select('station_id, station, location')
    .eq('profile_id', profileId)
  if (error) throw error
  return data || []
}

export async function insertStationRow(client, profileId, station, location) {
  requireProfile(profileId)
  if (!client) throw new Error('Supabase client is not configured.')
  const { error } = await client
    .from('station')
    .insert({ profile_id: profileId, station, location })
  if (error) throw error
}

export async function clearStationValues(client, profileId, field, item) {
  requireProfile(profileId)
  if (!client) throw new Error('Supabase client is not configured.')
  if (!['station', 'location'].includes(field)) throw new Error('Invalid station lookup field.')
  const { data, error } = await client
    .from('station')
    .update({ [field]: null })
    .eq('profile_id', profileId)
    .in('station_id', item.ids)
    .in(field, item.values)
    .select('station_id')
  if (error) throw error
  if ((data || []).length !== item.ids.length) {
    throw new Error('Some matching entries could not be updated. Reload and try again.')
  }
}
