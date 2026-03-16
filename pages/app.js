import Head from 'next/head'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import ListingTool from '../components/ListingTool'
import CMATool from '../components/CMATool'
import OpenHouseTool from '../components/OpenHouseTool'
import UpgradeModal from '../components/UpgradeModal'
import { canUse, usageLeft } from '../lib/usage'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const NAV = [
  { id: 'listing',   icon: '✎', label: 'Listing Generator' },
  { id: 'cma',       icon: '◫', label: 'CMA Report' },
  { id: 'openhouse', icon: '⌂', label: 'Open House' },
]

function getStoredToken() {
  try {
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
        const val = JSON.parse(localStorage.getItem(key))
        if (val?.access_token) return val.access_token
      }
    }
  } catch(e) {}
  return null
}

function decodeJWT(token) {
  try {
    const payload = token.split('.')[1]
    return JSON.parse(atob(payload))
  } catch(e) { return null }
}

export default function App() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [activeTool, setActiveTool] = useState('listing')
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function init() {
      let token = null

      // Step 1: Check URL hash for token (OAuth/magic link callback)
      if (window.location.hash && window.location.hash.includes('access_token')) {
        const params = new URLSearchParams(window.location.hash.replace('#', ''))
        const hashToken = params.get('access_token')
        if (hashToken) {
          token = hashToken
          // Store it in the same format Supabase uses
          const projectRef = SUPABASE_URL.split('//')[1].split('.')[0]
          const expiresAt = parseInt(params.get('expires_at') || '0')
          localStorage.setItem(`sb-${projectRef}-auth-token`, JSON.stringify({
            access_token: token,
            refresh_token: params.get('refresh_token') || '',
            expires_at: expiresAt,
            token_type: 'bearer',
          }))
          // Clean URL
          window.history.replaceState(null, '', '/app')
        }
      }

      // Step 2: Fall back to stored token
      if (!token) {
        token = getStoredToken()
      }

      if (!token) {
        router.push('/login')
        return
      }

      // Step 3: Decode user from token
      const payload = decodeJWT(token)
      if (!payload?.sub || (payload.exp && payload.exp < Date.now() / 1000)) {
        router.push('/login')
        return
      }

      const userData = {
        id: payload.sub,
        email: payload.email,
        user_metadata: payload.user_metadata || {},
      }
      setUser(userData)

      // Step 4: Load profile
      await loadProfile(userData.id, token)
      setLoading(false)
    }

    init()
  }, [])

  async function loadProfile(userId, token) {
    try {
      const storedToken = token || getStoredToken()
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=*`,
        {
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${storedToken}`,
          },
        }
      )
      const data = await res.json()
      if (data?.[0]) {
        setProfile(data[0])
      }
    } catch(e) {
      console.error('Profile load error:', e)
    }
  }

  async function refreshProfile() {
    if (user) {
      const token = getStoredToken()
      await loadProfile(user.id, token)
    }
  }

  async function signOut() {
    try {
      for (const key of Object.keys(localStorage)) {
        if (key.startsWith('sb-')) localStorage.removeItem(key)
      }
    } catch(e) {}
    router.push('/')
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0F0F0E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="spinner" />
    </div>
  )

  const toolProps = { profile, onUsageUpdate: refreshProfile, onUpgrade: () => setShowUpgrade(true) }

  return (
    <>
      <Head><title>RealtyAI — Dashboard</title></Head>
      <div style={{ display: 'flex', minHeight: '100vh', background: '#0F0F0E' }}>
        <aside style={{
          width: 260, flexShrink: 0,
          background: '#1A1A18', borderRight: '1px solid #2E2E2B',
          display: 'flex', flexDirection: 'column',
          position: 'sticky', top: 0, height: '100vh',
        }}>
          <div style={{ padding: '24px 24px 20px', borderBottom: '1px solid #2E2E2B' }}>
            <div style={{ fontFamily: '"DM Serif Display", serif', fontSize: 22, color: '#F0EDE6' }}>RealtyAI</div>
            {profile?.is_pro ? (
              <span style={{ display: 'inline-block', marginTop: 6, background: 'linear-gradient(135deg, #C9A84C, #E8C96A)', color: '#1a1200', fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 20 }}>PRO</span>
            ) : (
              <span style={{ display: 'inline-block', marginTop: 6, background: '#242422', color: '#8A8880', border: '1px solid #2E2E2B', fontSize: 11, padding: '2px 10px', borderRadius: 20 }}>Free plan</span>
            )}
          </div>

          <nav style={{ flex: 1, padding: '16px 12px' }}>
            {NAV.map(item => {
              const active = activeTool === item.id
              const left = usageLeft(profile, item.id)
              const limited = !profile?.is_pro && left === 0
              return (
                <button key={item.id} onClick={() => setActiveTool(item.id)} style={{
                  display: 'flex', alignItems: 'center', gap: 12, width: '100%',
                  padding: '11px 14px', borderRadius: 10, border: 'none', cursor: 'pointer',
                  background: active ? 'rgba(201,168,76,0.1)' : 'transparent',
                  color: active ? '#C9A84C' : limited ? '#5A5855' : '#8A8880',
                  fontSize: 14, fontFamily: '"DM Sans", sans-serif',
                  marginBottom: 2, textAlign: 'left', transition: 'all 0.15s',
                }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.background = '#242422' }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
                >
                  <span style={{ fontSize: 16, width: 20, textAlign: 'center' }}>{item.icon}</span>
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {!profile?.is_pro && (
                    <span style={{ fontSize: 11, color: limited ? '#5A5855' : '#8A8880', background: '#242422', border: '1px solid #2E2E2B', padding: '1px 7px', borderRadius: 10 }}>
                      {limited ? '0 left' : `${left} left`}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>

          {!profile?.is_pro && (
            <div style={{ padding: '0 12px 12px' }}>
              <button onClick={() => setShowUpgrade(true)} style={{
                width: '100%', padding: '13px',
                background: 'linear-gradient(135deg, #C9A84C, #E8C96A)',
                border: 'none', borderRadius: 10, cursor: 'pointer',
                color: '#1a1200', fontWeight: 600, fontSize: 14,
                fontFamily: '"DM Sans", sans-serif',
              }}>★ Upgrade to Pro — $29/mo</button>
            </div>
          )}

          <div style={{ padding: '12px 16px', borderTop: '1px solid #2E2E2B', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(201,168,76,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, color: '#C9A84C', flexShrink: 0 }}>
              {(profile?.full_name || user?.email || '?')[0].toUpperCase()}
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: '#F0EDE6', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{profile?.full_name || 'Agent'}</div>
              <div style={{ fontSize: 11, color: '#5A5855', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email}</div>
            </div>
            <button onClick={signOut} title="Sign out" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#5A5855', fontSize: 16, padding: '4px' }}>⎋</button>
          </div>
        </aside>

        <main style={{ flex: 1, overflowY: 'auto', padding: '40px', maxWidth: 800 }}>
          {activeTool === 'listing'   && <ListingTool   {...toolProps} />}
          {activeTool === 'cma'       && <CMATool        {...toolProps} />}
          {activeTool === 'openhouse' && <OpenHouseTool  {...toolProps} />}
        </main>
      </div>
      {showUpgrade && <UpgradeModal profile={profile} onClose={() => setShowUpgrade(false)} onSuccess={refreshProfile} />}
    </>
  )
}
