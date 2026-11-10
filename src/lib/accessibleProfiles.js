export async function fetchAccessibleProfileIds(client, profileId) {
  if (!client) throw new Error('Supabase client is not configured.')
  if (!profileId) throw new Error('A current profile is required.')

  const { data, error } = await client.rpc('accessible_profile_ids')
  if (error) throw error
  if (!Array.isArray(data) || !data.some((row) => String(row.profile_id) === String(profileId))) {
    throw new Error('The requested profile is not accessible.')
  }
  return data.map((row) => row.profile_id)
}
