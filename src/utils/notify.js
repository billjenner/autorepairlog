export function notifySuccess($q, message, options = {}) {
  $q.notify({
    color: 'accent',
    textColor: 'white',
    message,
    timeout: 5000,
    ...options,
  })
}
