export async function authFetch(url, options = {}) {
  // We store the token explicitly in app.js when the session loads
  const token = typeof window !== 'undefined' ? localStorage.getItem('realtyai_token') : null

  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  })
}
