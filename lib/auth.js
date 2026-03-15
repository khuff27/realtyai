// Plain fetch auth — no Supabase client, no detectStore crash
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export async function signInWithOtp(email, redirectTo, metadata = {}) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/otp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({
      email,
      create_user: true,
      data: metadata,
      options: { emailRedirectTo: redirectTo },
    }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error_description || err.msg || 'Failed to send magic link')
  }
  return true
}

export async function signInWithGoogle(redirectTo) {
  const params = new URLSearchParams({
    provider: 'google',
    redirect_to: redirectTo,
  })
  window.location.href = `${SUPABASE_URL}/auth/v1/authorize?${params}`
}

export async function signOut() {
  const token = getToken()
  if (token) {
    await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${token}`,
      },
    })
  }
  clearToken()
}

export function getToken() {
  if (typeof window === 'undefined') return null
  // Check our explicit storage first
  const explicit = localStorage.getItem('realtyai_token')
  if (explicit && explicit !== 'null') return explicit
  // Fall back to scanning for Supabase's own storage
  try {
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
        const val = JSON.parse(localStorage.getItem(key))
        if (val?.access_token) {
          localStorage.setItem('realtyai_token', val.access_token)
          return val.access_token
        }
      }
    }
  } catch(e) {}
  return null
}

export function clearToken() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('realtyai_token')
  }
}

export async function getSession() {
  // Check URL for token (magic link / OAuth callback)
  if (typeof window !== 'undefined') {
    const hash = window.location.hash
    if (hash && hash.includes('access_token')) {
      const params = new URLSearchParams(hash.replace('#', ''))
      const token = params.get('access_token')
      if (token) {
        localStorage.setItem('realtyai_token', token)
        // Clean URL
        window.history.replaceState(null, '', window.location.pathname)
        return { access_token: token }
      }
    }
  }
  const token = getToken()
  if (!token) return null
  return { access_token: token }
}

export async function getUser() {
  const token = getToken()
  if (!token) return null
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${token}`,
      },
    })
    if (!res.ok) {
      clearToken()
      return null
    }
    return await res.json()
  } catch(e) {
    return null
  }
}
