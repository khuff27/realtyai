import Head from 'next/head'
import Link from 'next/link'
import { useState } from 'react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

export default function Login() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleLogin(e) {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/app` },
    })
    if (error) {
      toast.error(error.message)
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  return (
    <>
      <Head><title>Sign in — RealtyAI</title></Head>
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
                Click the link to sign in — no password needed.
              </p>
              <button onClick={() => setSent(false)} style={{ marginTop: 24, color: '#C9A84C', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }}>
                Use a different email
              </button>
            </div>
          ) : (
            <>
              <h1 style={{ fontFamily: '"DM Serif Display", serif', fontSize: 28, marginBottom: 8 }}>Welcome back</h1>
              <p style={{ color: '#8A8880', fontSize: 14, marginBottom: 28 }}>Enter your email — we'll send you a magic link.</p>

              <form onSubmit={handleLogin}>
                <label className="field-label" style={{ marginTop: 0 }}>Email address</label>
                <input
                  className="input-base"
                  type="email"
                  placeholder="you@brokerage.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
                <button className="btn-gold" type="submit" disabled={loading} style={{ marginTop: 16 }}>
                  {loading ? 'Sending...' : 'Send magic link →'}
                </button>
              </form>

              <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: '#5A5855' }}>
                No account?{' '}
                <Link href="/signup" style={{ color: '#C9A84C', textDecoration: 'none' }}>Sign up free</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </>
  )
}
