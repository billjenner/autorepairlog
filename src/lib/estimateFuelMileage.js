function isMissing(value) {
  return value === null || value === undefined || value === ''
}

export async function estimateFuelMileage(client, entry, fuelLogId = null) {
  if (!isMissing(entry.mileage) || isMissing(entry.prior_mileage) || isMissing(entry.gallons)) {
    return { mileage: null, warning: null }
  }
  if (!client) throw new Error('Supabase client is not configured.')
  if (!entry.auto_id || !/^\d{4}-\d{2}-\d{2}$/.test(entry.date)) {
    throw new Error('An auto and valid date are required to estimate mileage.')
  }

  const prior = Number(entry.prior_mileage)
  const gallons = Number(Number(entry.gallons).toFixed(3))
  if (!Number.isSafeInteger(prior) || prior < 0 || !Number.isFinite(gallons) || gallons <= 0) {
    throw new Error('Valid prior mileage and positive gallons are required to estimate mileage.')
  }

  let query = client
    .from('fuel_log')
    .select('mile_per_gallon')
    .eq('auto_id', entry.auto_id)
    .gt('mile_per_gallon', 0)
  if (fuelLogId !== null) {
    if (!Number.isSafeInteger(Number(fuelLogId)) || Number(fuelLogId) <= 0) {
      throw new Error('A valid fuel log ID is required to estimate mileage.')
    }
    query = query.or(
      `date.lt.${entry.date},and(date.eq.${entry.date},fuel_log_id.lt.${Number(fuelLogId)})`,
    )
  } else {
    query = query.lte('date', entry.date)
  }
  const { data, error } = await query
    .order('date', { ascending: false })
    .order('fuel_log_id', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  if (!data) {
    return {
      mileage: null,
      warning: 'Mileage could not be estimated: no previous MPG is available.',
    }
  }

  const mpg = Number(data.mile_per_gallon)
  if (!Number.isFinite(mpg) || mpg <= 0) {
    throw new Error('Cannot estimate mileage: the previous MPG is invalid.')
  }
  const mileage = Math.round(prior + gallons * mpg)
  if (!Number.isSafeInteger(mileage) || mileage > 2147483647 || mileage <= prior) {
    throw new Error('Cannot estimate mileage: the result is outside the allowed mileage range.')
  }
  return { mileage, warning: null }
}
