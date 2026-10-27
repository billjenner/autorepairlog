import { supabase } from '@/lib/supabase'

function autoLabel(auto) {
  return [auto.year, auto.make, auto.model].filter(Boolean).join(' ') || 'this auto'
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
      notifyAction(
        $q,
        router,
        `Enter current mileage for ${autoLabel(auto)}.`,
        'Enter mileage',
        { path: '/mileage', query: { autoId: String(auto.auto_id) } },
      )
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

  for (const auto of autos) {
    const autoSchedules = schedulesByAutoId.get(auto.auto_id) || []
    if (!autoSchedules.length) {
      notifyAction(
        $q,
        router,
        `Select a schedule for ${autoLabel(auto)}.`,
        'Select schedule',
        { path: '/schedule', query: { autoId: String(auto.auto_id) } },
      )
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
        if (service.is_active && !hasLastMiles && !hasLastDate) {
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