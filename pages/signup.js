import Head from 'next/head'
import Link from 'next/link'
import { useState } from 'react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

export default function Signup() {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
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

              <h1 style={{ fontFamily: '"DM Serif Display", serif', fontSize: 28, marginBottom: 8 }}>Create your account</h1>
              <p style={{ color: '#8A8880', fontSize: 14, marginBottom: 28 }}>Start writing better listings in under 2 minutes.</p>

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
          Free plan includes 3 listings, 1 CMA, and 10 follow-ups per month. No credit card required.
        </p>
      </div>
    </>
  )
}
