import { supabase } from '@/lib/supabase'

function autoLabel(auto) {
  return [auto.year, auto.make, auto.model].filter(Boolean).join(' ') || 'this auto'
}

const MS_PER_DAY = 24 * 60 * 60 * 1000

function toUtcDay(value) {
  if (!value) return null
  const time = Date.parse(`${String(value).slice(0, 10)}T00:00:00Z`)
  return Number.isFinite(time) ? time : null
}

function formatDay(time) {
  return time === null ? null : new Date(time).toISOString().slice(0, 10)
}

function addMonthsUtc(time, months) {
  const date = new Date(time)
  const day = date.getUTCDate()
  date.setUTCDate(1)
  date.setUTCMonth(date.getUTCMonth() + months)
  const lastDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate()
  date.setUTCDate(Math.min(day, lastDay))
  return date.getTime()
}

function toNumberOrNull(value) {
  if (value === null || value === undefined || value === '') return null
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

// Average miles per day from the earliest to the latest mileage record, or null if not computable.
export function calculateMilesPerDay(mileageRows = []) {
  const points = mileageRows
    .map((row) => ({ miles: toNumberOrNull(row.miles), day: toUtcDay(row.date) }))
    .filter((point) => point.miles !== null && point.day !== null)
    .sort((a, b) => a.day - b.day || a.miles - b.miles)

  if (points.length < 2) return null

  const earliest = points[0]
  const latest = points[points.length - 1]
  const days = (latest.day - earliest.day) / MS_PER_DAY
  const miles = latest.miles - earliest.miles
  return days > 0 && miles > 0 ? miles / days : null
}

// Predicts when a service is next due from its last occurrence and the auto's driving rate.
export function predictServiceOccurrence(service, { latestMiles, milesPerDay, today }) {
  const lastMiles = toNumberOrNull(service.last_miles)
  const lastDay = toUtcDay(service.last_date)
  const intervalMiles = toNumberOrNull(service.interval_miles)
  const intervalMonths = toNumberOrNull(service.interval_months)
  const intervalYears = toNumberOrNull(service.interval_years)

  let nextMiles = null
  let milesToGo = null
  if (lastMiles !== null && intervalMiles > 0) {
    nextMiles = lastMiles + intervalMiles
    if (latestMiles !== null) milesToGo = nextMiles - latestMiles
  }

  const candidates = []

  // 1) Last date plus the month or year interval.
  if (lastDay !== null) {
    if (intervalMonths > 0) candidates.push(addMonthsUtc(lastDay, intervalMonths))
    if (intervalYears > 0) candidates.push(addMonthsUtc(lastDay, intervalYears * 12))
  }

  // 2) Days from the last mileage occurrence: days already elapsed plus days still to drive.
  if (milesToGo !== null && milesPerDay) {
    const anchor = lastDay ?? today
    const daysSinceLast = (today - anchor) / MS_PER_DAY
    candidates.push(anchor + (daysSinceLast + milesToGo / milesPerDay) * MS_PER_DAY)
  }

  const nextDay = candidates.length
    ? Math.round(Math.min(...candidates) / MS_PER_DAY) * MS_PER_DAY
    : null

  return {
    next_miles: nextMiles,
    miles_to_go: milesToGo,
    next_date: formatDay(nextDay),
  }
}

// Estimates a missing last service date by scaling the purchase-to-latest date span by
// last service miles / (latest miles - purchase miles), starting at the purchase date.
export function estimateLastServiceDate(service, { auto, latest }) {
  const lastMiles = toNumberOrNull(service.last_miles)
  const purchaseMiles = toNumberOrNull(auto?.purchase_mileage)
  const purchaseDay = toUtcDay(auto?.purchase_date)
  const latestMiles = toNumberOrNull(latest?.miles)
  const latestDay = toUtcDay(latest?.date)

  if (lastMiles === null || purchaseMiles === null || purchaseDay === null) return null
  if (latestMiles === null || latestDay === null) return null

  const milesDriven = latestMiles - purchaseMiles
  if (milesDriven <= 0 || latestDay <= purchaseDay) return null

  const estimate = (lastMiles / milesDriven) * (latestDay - purchaseDay) + purchaseDay
  return formatDay(Math.round(estimate / MS_PER_DAY) * MS_PER_DAY)
}

// Predicts the next occurrence of every active service for each of the profile's active autos.
export async function predictFutureServices(profileId, today = Date.now()) {
  if (!supabase) throw new Error('Supabase client is not configured.')
  if (!profileId) return []

  const todayDay = toUtcDay(new Date(today).toISOString())

  const { data: autos, error: autoError } = await supabase
    .from('auto')
    .select('auto_id, year, make, model, purchase_date, purchase_mileage')
    .eq('profile_id', profileId)
    .eq('is_active', true)
    .eq('isTemplate', false)
  if (autoError) throw autoError
  if (!autos?.length) return []

  const autoIds = autos.map((auto) => auto.auto_id)
  const [mileageResult, scheduleResult] = await Promise.all([
    supabase
      .from('mileage')
      .select('auto_id, miles, date')
      .in('auto_id', autoIds)
      .eq('is_active', true),
    supabase
      .from('schedule')
      .select(
        'schedule_id, auto_id, service(service_id, name, interval_miles, interval_months, interval_years, last_miles, last_date, is_active)',
      )
      .in('auto_id', autoIds)
      .eq('is_active', true),
  ])
  if (mileageResult.error) throw mileageResult.error
  if (scheduleResult.error) throw scheduleResult.error

  return autos.map((auto) => {
    const rows = (mileageResult.data || []).filter((row) => row.auto_id === auto.auto_id)
    const milesPerDay = calculateMilesPerDay(rows)
    const latest = rows
      .filter((row) => toNumberOrNull(row.miles) !== null && toUtcDay(row.date) !== null)
      .sort((a, b) => toUtcDay(b.date) - toUtcDay(a.date) || Number(b.miles) - Number(a.miles))[0]
    const latestMiles = latest ? Number(latest.miles) : null

    const services = (scheduleResult.data || [])
      .filter((schedule) => schedule.auto_id === auto.auto_id)
      .flatMap((schedule) => schedule.service || [])
      .filter((service) => service.is_active)
      .map((service) => {
        const estimatedLastDate = service.last_date
          ? null
          : estimateLastServiceDate(service, { auto, latest })
        return {
          service_id: service.service_id,
          name: service.name,
          estimated_last_date: estimatedLastDate,
          ...predictServiceOccurrence(
            { ...service, last_date: service.last_date || estimatedLastDate },
            { latestMiles, milesPerDay, today: todayDay },
          ),
        }
      })

    return {
      auto_id: auto.auto_id,
      label: autoLabel(auto),
      latest_miles: latestMiles,
      miles_per_day: milesPerDay,
      services,
    }
  })
}

function notifyAction($q, router, message, label, target) {
  $q.notify({
    type: 'warning',
    message,
    timeout: 10000,
    actions: [
      {
        label,
        color: 'white',
        handler: () => router.push(target),
      },
    ],
  })
}

function notifyCheckError($q, step, error) {
  console.error(`[business rules] ${step} check failed:`, error.message)
  $q.notify({
    type: 'negative',
    message: 'Unable to check your setup. Please try again later.',
    timeout: 7000,
  })
}

export async function checkLoginBusinessRules($q, profileId, profileError, router) {
  if (profileError) {
    notifyCheckError($q, 'profile', new Error(profileError))
    return
  }

  if (!profileId) {
    notifyAction(
      $q,
      router,
      'Complete your profile before setting up your autos.',
      'Open profile',
      '/profile',
    )
    return
  }

  if (!supabase) {
    notifyCheckError($q, 'Supabase client', new Error('Supabase client is not configured.'))
    return
  }

  const { data: autos, error: autoError } = await supabase
    .from('auto')
    .select('auto_id, year, make, model')
    .eq('profile_id', profileId)
    .eq('is_active', true)
    .eq('isTemplate', false)

  if (autoError) {
    notifyCheckError($q, 'active auto', autoError)
    return
  }

  if (!autos?.length) {
    notifyAction(
      $q,
      router,
      'You do not have an active auto yet. Create an auto to get started.',
      'Create auto',
      '/auto',
    )
    return
  }

  const autoIds = autos.map((auto) => auto.auto_id)
  const { data: mileageEntries, error: mileageError } = await supabase
    .from('mileage')
    .select('auto_id')
    .in('auto_id', autoIds)
    .eq('is_active', true)

  if (mileageError) {
    notifyCheckError($q, 'mileage', mileageError)
    return
  }

  const autosWithMileage = new Set((mileageEntries || []).map((entry) => entry.auto_id))
  for (const auto of autos) {
    if (!autosWithMileage.has(auto.auto_id)) {
      notifyAction($q, router, `Enter current mileage for ${autoLabel(auto)}.`, 'Enter mileage', {
        path: '/mileage',
        query: { autoId: String(auto.auto_id) },
      })
    }
  }

  const { data: schedules, error: scheduleError } = await supabase
    .from('schedule')
    .select('schedule_id, auto_id, service(service_id, name, last_miles, last_date, is_active)')
    .in('auto_id', autoIds)
    .eq('is_active', true)

  if (scheduleError) {
    notifyCheckError($q, 'schedule', scheduleError)
    return
  }

  const schedulesByAutoId = new Map()
  for (const schedule of schedules || []) {
    const autoSchedules = schedulesByAutoId.get(schedule.auto_id) || []
    autoSchedules.push(schedule)
    schedulesByAutoId.set(schedule.auto_id, autoSchedules)
  }

  // Fall back to service_log history for services that have no last occurrence recorded.
  const { data: logRows, error: logError } = await supabase
    .from('service_log')
    .select('service_id, service_date, service_miles, service_order!inner(auto_id, is_active)')
    .in('service_order.auto_id', autoIds)
    .eq('service_order.is_active', true)

  if (logError) {
    notifyCheckError($q, 'service log', logError)
    return
  }

  const lastLogByAutoService = new Map()
  for (const row of logRows || []) {
    const key = `${row.service_order?.auto_id}:${row.service_id}`
    const current = lastLogByAutoService.get(key) || { miles: null, date: null }
    const miles = Number(row.service_miles)
    if (Number.isFinite(miles) && (current.miles === null || miles > current.miles)) {
      current.miles = miles
    }
    const time = row.service_date ? new Date(row.service_date).getTime() : NaN
    if (Number.isFinite(time) && (current.date === null || time > current.date)) {
      current.date = time
    }
    lastLogByAutoService.set(key, current)
  }

  for (const auto of autos) {
    const autoSchedules = schedulesByAutoId.get(auto.auto_id) || []
    if (!autoSchedules.length) {
      notifyAction($q, router, `Select a schedule for ${autoLabel(auto)}.`, 'Select schedule', {
        path: '/schedule',
        query: { autoId: String(auto.auto_id) },
      })
      continue
    }

    const servicesMissingLastOccurrence = []
    for (const schedule of autoSchedules) {
      for (const service of schedule.service || []) {
        const hasLastMiles =
          service.last_miles !== null &&
          service.last_miles !== undefined &&
          service.last_miles !== ''
        const hasLastDate = Boolean(service.last_date)
        const logged = lastLogByAutoService.get(`${auto.auto_id}:${service.service_id}`)
        if (service.is_active && logged) {
          const fill = {}
          if (!hasLastMiles && logged.miles !== null) {
            fill.last_miles = logged.miles
          }
          if (!hasLastDate && logged.date !== null) {
            fill.last_date = new Date(logged.date).toISOString().slice(0, 10)
          }
          if (Object.keys(fill).length) {
            const { error: fillError } = await supabase
              .from('service')
              .update(fill)
              .eq('service_id', service.service_id)
            if (fillError) {
              notifyCheckError($q, 'last occurrence update', fillError)
            } else {
              Object.assign(service, fill)
              continue
            }
          }
        }
        const hasLoggedOccurrence = Boolean(logged)
        if (service.is_active && !hasLastMiles && !hasLastDate && !hasLoggedOccurrence) {
          servicesMissingLastOccurrence.push(service.name || 'Unnamed service')
        }
      }
    }

    for (const serviceName of servicesMissingLastOccurrence) {
      notifyAction(
        $q,
        router,
        `Update the last occurrence for ${serviceName} on ${autoLabel(auto)}.`,
        'Review schedule',
        { path: '/schedule', query: { autoId: String(auto.auto_id) } },
      )
    }
  }
}
