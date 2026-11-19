export function lastServiceCompletion(schedules, autoId) {
  const services = schedules
    .filter((schedule) => schedule.auto_id === autoId)
    .flatMap((schedule) => schedule.service || [])

  if (!services.length) {
    return 0
  }

  const completed = services.filter(
    (service) =>
      (service.last_miles !== null &&
        service.last_miles !== undefined &&
        service.last_miles !== '') ||
      Boolean(service.last_date),
  ).length

  return Math.round((completed / services.length) * 100)
}
