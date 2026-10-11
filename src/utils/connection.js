// Shared detection for network/connectivity failures thrown by fetch-based clients (e.g. supabase-js).
export function isConnectionError(error) {
  const message = String(error?.message || error || '').toLowerCase()
  return (
    message.includes('failed to fetch') ||
    message.includes('networkerror') ||
    message.includes('load failed')
  )
}
