const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export function getToken() {
  if (typeof window === 'undefined') return null
  try {
    // Find the Supabase auth token — stored as sb-{projectref}-auth-token
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
        const val = JSON.parse(localStorage.getItem(key))
        const token = val?.access_token
        if (token) return token
      }
    }
  } catch(e) {}
  return null
}

export function clearToken() {
  if (typeof window === 'undefined') return
  for (const key of Object.keys(localStorage)) {
    if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
      localStorage.removeItem(key)
    }
  }
  localStorage.removeItem('realtyai_token')
}

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
    }).catch(() => {})
  }
  clearToken()
}

export async function getSession() {
  // Handle magic link / OAuth callback in URL hash
  if (typeof window !== 'undefined') {
    const hash = window.location.hash
    if (hash && hash.includes('access_token')) {
      const params = new URLSearchParams(hash.replace('#', ''))
      const token = params.get('access_token')
      if (token) {
        // Store in Supabase format so getToken() finds it
        const projectRef = SUPABASE_URL.split('//')[1].split('.')[0]
        localStorage.setItem(`sb-${projectRef}-auth-token`, JSON.stringify({
          access_token: token,
          token_type: 'bearer',
        }))
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
