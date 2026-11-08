export function mileageDifference(priorMileage, mileage) {
  if (
    priorMileage === null ||
    priorMileage === undefined ||
    priorMileage === '' ||
    mileage === null ||
    mileage === undefined ||
    mileage === ''
  ) {
    return null
  }
  const prior = Number(priorMileage)
  const current = Number(mileage)
  return Number.isFinite(prior) && Number.isFinite(current) && current > prior
    ? current - prior
    : null
}

export function milesPerGallon(priorMileage, mileage, gallons) {
  const difference = mileageDifference(priorMileage, mileage)
  const amount = Number(gallons)
  return difference !== null && Number.isFinite(amount) && amount > 0 ? difference / amount : null
}

export function formatMpg(value) {
  return value === null || value === undefined ? '—' : Number(value).toFixed(2)
}
