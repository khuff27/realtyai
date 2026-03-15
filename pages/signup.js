import Head from 'next/head'
import Link from 'next/link'
import { useState } from 'react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

export default function Signup() {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSignup(e) {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/app`,
        data: { full_name: name },
      },
    })
    if (error) {
      toast.error(error.message)
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  async function handleGoogle() {
    setGoogleLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/app` },
    })
    if (error) {
      toast.error(error.message)
      setGoogleLoading(false)
    }
  }

  return (
    <>
      <Head><title>Create account — RealtyAI</title></Head>
      <div style={{ minHeight: '100vh', background: '#0F0F0E', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Link href="/" style={{ fontFamily: '"DM Serif Display", serif', fontSize: 28, color: '#F0EDE6', textDecoration: 'none', marginBottom: 40 }}>
          RealtyAI
        </Link>

        <div style={{ width: '100%', maxWidth: 400, background: '#1A1A18', border: '1px solid #2E2E2B', borderRadius: 20, padding: 36 }}>
          {sent ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>✉️</div>
              <h2 style={{ fontFamily: '"DM Serif Display", serif', fontSize: 24, marginBottom: 12 }}>Check your email</h2>
              <p style={{ color: '#8A8880', fontSize: 14, lineHeight: 1.6 }}>
                We sent a magic link to <strong style={{ color: '#F0EDE6' }}>{email}</strong>.<br />
                Click it to activate your free account.
              </p>
            </div>
          ) : (
            <>
              <div style={{
                display: 'inline-block', background: 'rgba(201,168,76,0.1)',
                border: '1px solid rgba(201,168,76,0.25)', borderRadius: 20,
                padding: '4px 14px', fontSize: 11, fontWeight: 600,
                color: '#C9A84C', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 16,
              }}>Free — no credit card</div>

              <h1 style={{ fontFamily: '"DM Serif Display", serif', fontSize: 28, marginBottom: 24 }}>Create your account</h1>

              {/* Google button */}
              <button onClick={handleGoogle} disabled={googleLoading} style={{
                width: '100%', padding: '13px', borderRadius: 12,
                border: '1px solid #2E2E2B', background: '#242422',
                color: '#F0EDE6', fontSize: 15, fontFamily: '"DM Sans", sans-serif',
                cursor: 'pointer', display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: 10, marginBottom: 16,
                transition: 'border-color 0.15s',
              }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#C9A84C'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#2E2E2B'}
              >
                {googleLoading ? (
                  <span className="spinner" />
                ) : (
                  <svg width="18" height="18" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                    <path fill="none" d="M0 0h48v48H0z"/>
                  </svg>
                )}
                {googleLoading ? 'Redirecting...' : 'Continue with Google'}
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ flex: 1, height: 1, background: '#2E2E2B' }} />
                <span style={{ color: '#5A5855', fontSize: 12 }}>or use email</span>
                <div style={{ flex: 1, height: 1, background: '#2E2E2B' }} />
              </div>

              <form onSubmit={handleSignup}>
                <label className="field-label" style={{ marginTop: 0 }}>Your name</label>
                <input className="input-base" type="text" placeholder="Sarah Johnson" value={name} onChange={e => setName(e.target.value)} />

                <label className="field-label">Email address</label>
                <input className="input-base" type="email" placeholder="you@brokerage.com" value={email} onChange={e => setEmail(e.target.value)} required />

                <button className="btn-gold" type="submit" disabled={loading} style={{ marginTop: 20 }}>
                  {loading ? 'Creating account...' : 'Create free account →'}
                </button>
              </form>

              <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: '#5A5855' }}>
                Already have an account?{' '}
                <Link href="/login" style={{ color: '#C9A84C', textDecoration: 'none' }}>Sign in</Link>
              </p>
            </>
          )}
        </div>

        <p style={{ marginTop: 24, fontSize: 12, color: '#3A3835', textAlign: 'center', maxWidth: 320 }}>
          Free plan includes 3 listings, 1 CMA, and 10 follow-ups per month.
        </p>
      </div>
    </>
  )
}
