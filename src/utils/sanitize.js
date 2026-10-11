// Best-effort scrubbing of free-text input before it is sent to the backend.
// Supabase queries are parameterized (no raw SQL is built from user input), but this
// strips HTML/script tags and common SQL-injection tokens as defense-in-depth.
const HTML_TAG_PATTERN = /<[^>]*>/g
const SQL_INJECTION_PATTERN =
  /(\b(select|insert|update|delete|drop|alter|create|exec|execute|union|truncate|grant|revoke)\b)|(--)|(\/\*)|(\*\/)|(;)|(xp_)/gi

export function sanitizeInput(value) {
  if (value === null || value === undefined) {
    return ''
  }

  return String(value).replace(HTML_TAG_PATTERN, '').replace(SQL_INJECTION_PATTERN, '').trim()
}
