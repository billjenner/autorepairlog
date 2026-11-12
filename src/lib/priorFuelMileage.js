const PAGE_SIZE = 1000

export class PriorMileageEstimateError extends Error {}

function requiredNumber(value, field) {
  if (value === null || value === undefined || value === '') {
    throw new PriorMileageEstimateError(`Cannot estimate prior mileage: ${field} is missing.`)
  }
  const number = Number(value)
  if (!Number.isFinite(number) || number < 0) {
    throw new PriorMileageEstimateError(`Cannot estimate prior mileage: ${field} is invalid.`)
  }
  return number
}

export async function fetchPriorFuelMileage(client, autoId, date) {
  if (!client) throw new Error('Supabase client is not configured.')
  if (!autoId || !date) throw new Error('An auto and date are required to load prior mileage.')

  let gallons = 0
  let missingGallons = false
  let hasNewerRecords = false
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await client
      .from('fuel_log')
      .select('mileage, mile_per_gallon, gallons')
      .eq('auto_id', autoId)
      .lte('date', date)
      .order('date', { ascending: false })
      .order('fuel_log_id', { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1)
    if (error) throw error

    for (const row of data) {
      if (row.mileage !== null && row.mileage !== undefined && row.mileage !== '') {
        const mileage = requiredNumber(row.mileage, 'mileage')
        if (!hasNewerRecords) return mileage
        if (missingGallons) {
          throw new PriorMileageEstimateError(
            'Cannot estimate prior mileage: gallons are missing from a prior fuel log.',
          )
        }
        const mpg = requiredNumber(row.mile_per_gallon, 'miles per gallon')
        const estimate = Math.round(mileage + mpg * gallons)
        if (!Number.isSafeInteger(estimate) || estimate > 2147483647) {
          throw new PriorMileageEstimateError(
            'Cannot estimate prior mileage: the result exceeds the allowed mileage.',
          )
        }
        return estimate
      }

      if (row.gallons === null || row.gallons === undefined || row.gallons === '') {
        missingGallons = true
      } else {
        gallons += requiredNumber(row.gallons, 'gallons')
      }
      hasNewerRecords = true
    }
    if (data.length < PAGE_SIZE) return null
  }
}
