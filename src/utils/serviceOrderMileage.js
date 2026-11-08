export async function recordServiceOrderMileage(mileageStore, order) {
  const miles = order.mileage_at_service
  if (miles === null || miles === undefined || miles === '') return

  const latest = await mileageStore.fetchLatestMilesChecked(order.auto_id)
  if (latest !== null && Number(miles) <= Number(latest)) return
  if (!order.service_date) throw new Error('A service date is required to record mileage.')

  const exists = await mileageStore.hasMileageRecord(order.auto_id, order.service_date, miles)
  if (exists) return

  const saved = await mileageStore.createMileage({
    auto_id: order.auto_id,
    date: order.service_date,
    miles,
  })
  if (!saved) throw new Error(mileageStore.error || 'Unable to save mileage history.')
}
