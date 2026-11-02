import { supabase } from '@/lib/supabase'
import { predictFutureServices } from '@/utils/rules'

const DUPLICATE_WINDOW_DAYS = 30
const MS_PER_DAY = 24 * 60 * 60 * 1000
const inFlightProfiles = new Set()

function isPastDue(service, todayDay) {
  const nextDay = service.next_date ? Date.parse(`${service.next_date}T00:00:00Z`) : null
  const dateDue = nextDay !== null && Number.isFinite(nextDay) && nextDay < todayDay
  const milesDue = service.miles_to_go !== null && service.miles_to_go <= 0
  return dateDue || milesDue
}

function buildMessage(auto, service) {
  const parts = []
  if (service.next_date) parts.push(`due ${service.next_date}`)
  if (service.next_miles !== null) parts.push(`due at ${service.next_miles} miles`)
  const detail = parts.length ? ` (${parts.join(', ')})` : ''
  return `${service.name} is past due for ${auto.label}${detail}.`
}

async function loadRecentNotificationKeys(profileId, now) {
  const since = new Date(now - DUPLICATE_WINDOW_DAYS * MS_PER_DAY).toISOString()
  const { data, error } = await supabase
    .from('notification')
    .select('auto_id, service_id')
    .eq('profile_id', profileId)
    .gte('date_created', since)
  if (error) throw error
  return new Set((data || []).map((row) => `${row.auto_id}:${row.service_id}`))
}

// Shows a toaster for each past-due service that has no notification in the last 30 days,
// then records the toaster in the notification table.
export async function checkServiceNotifications($q, profile, now = Date.now()) {
  const profileId = profile?.profile_id
  if (!supabase || !profileId || !profile.allow_in_app_notifications) return
  if (inFlightProfiles.has(profileId)) return

  inFlightProfiles.add(profileId)
  try {
    const todayDay = Date.parse(`${new Date(now).toISOString().slice(0, 10)}T00:00:00Z`)
    const autos = await predictFutureServices(profileId, now)
    const duePairs = autos.flatMap((auto) =>
      auto.services
        .filter((service) => service.allow_notifications && isPastDue(service, todayDay))
        .map((service) => ({ auto, service })),
    )
    if (!duePairs.length) return

    const recentKeys = await loadRecentNotificationKeys(profileId, now)

    for (const { auto, service } of duePairs) {
      if (recentKeys.has(`${auto.auto_id}:${service.service_id}`)) continue

      const subject = 'Service past due'
      const message = buildMessage(auto, service)

      $q.notify({ type: 'warning', message, caption: subject, timeout: 10000 })

      const { error } = await supabase.from('notification').insert({
        profile_id: profileId,
        auto_id: auto.auto_id,
        service_id: service.service_id,
        notification_type: 'in_app',
        subject,
        message,
        date_sent: new Date().toISOString(),
        delivery_status: 'sent',
      })
      if (error) console.error('[notifications] unable to record notification:', error.message)
    }
  } catch (error) {
    console.error('[notifications] service notification check failed:', error?.message || error)
  } finally {
    inFlightProfiles.delete(profileId)
  }
}
