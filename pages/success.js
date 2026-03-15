import Head from 'next/head'
import Link from 'next/link'
import { useEffect } from 'react'
import { useRouter } from 'next/router'

export default function Success() {
  const router = useRouter()

  useEffect(() => {
    // Auto-redirect to app after 4 seconds
    const t = setTimeout(() => router.push('/app'), 4000)
    return () => clearTimeout(t)
  }, [])

  return (
    <>
      <Head><title>Welcome to Pro — RealtyAI</title></Head>
      <div style={{
        minHeight: '100vh', background: '#0F0F0E',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: 24, textAlign: 'center',
      }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: 'rgba(201,168,76,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 32, marginBottom: 24,
          border: '1px solid rgba(201,168,76,0.3)',
        }}>★</div>

        <h1 style={{ fontFamily: '"DM Serif Display", serif', fontSize: 36, marginBottom: 12 }}>
          Welcome to Pro.
        </h1>

        <p style={{ color: '#8A8880', fontSize: 16, maxWidth: 380, lineHeight: 1.7, marginBottom: 32 }}>
          All three tools are now unlimited. Go write some listings, build some reports, and close some deals.
        </p>

        <Link href="/app" style={{
          background: 'linear-gradient(135deg, #C9A84C, #E8C96A)',
          color: '#1a1200', fontWeight: 600, fontSize: 15,
          padding: '14px 32px', borderRadius: 12, textDecoration: 'none',
        }}>
          Go to dashboard →
        </Link>

        <p style={{ marginTop: 20, fontSize: 13, color: '#3A3835' }}>
          Redirecting automatically in a few seconds...
        </p>
      </div>
    </>
  )
}
