import { useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import toast from 'react-hot-toast'

export default function UpgradeModal({ profile, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false)

  async function startCheckout() {
    setLoading(true)
    try {
      const res = await fetch('/api/billing/checkout', { method: 'POST' })
      const { url, error } = await res.json()
      if (error) throw new Error(error)
      window.location.href = url
    } catch (err) {
      toast.error(err.message)
      setLoading(false)
    }
  }

  const FEATURES = [
    'Unlimited listing descriptions',
    'Unlimited CMA reports',
    'Unlimited open house follow-ups',
    'CMA PDF export with your branding',
    'Usage synced across web & mobile',
    'Priority support',
  ]

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 200, padding: 20,
    }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{
        background: '#1A1A18', border: '1px solid rgba(201,168,76,0.3)',
        borderRadius: 20, padding: 36, maxWidth: 420, width: '100%',
        position: 'relative',
      }}>
        <button onClick={onClose} style={{
          position: 'absolute', top: 16, right: 16,
          background: 'none', border: 'none', cursor: 'pointer',
          color: '#5A5855', fontSize: 20, lineHeight: 1,
        }}>✕</button>

        <div style={{
          display: 'inline-block', background: 'rgba(201,168,76,0.1)',
          border: '1px solid rgba(201,168,76,0.25)', borderRadius: 20,
          padding: '4px 14px', fontSize: 11, fontWeight: 600,
          color: '#C9A84C', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 16,
        }}>Upgrade to Pro</div>

        <h2 style={{ fontFamily: '"DM Serif Display", serif', fontSize: 28, marginBottom: 8 }}>
          Unlimited AI.<br /><em style={{ color: '#C9A84C' }}>One flat price.</em>
        </h2>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, margin: '20px 0 4px' }}>
          <span style={{ fontFamily: '"DM Serif Display", serif', fontSize: 44, color: '#C9A84C' }}>$29</span>
          <span style={{ color: '#8A8880', fontSize: 15 }}>/month</span>
        </div>
        <p style={{ color: '#5A5855', fontSize: 12, marginBottom: 24 }}>Cancel anytime · 7-day free trial</p>

        <div style={{ marginBottom: 28 }}>
          {FEATURES.map(f => (
            <div key={f} style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10, fontSize: 14, color: '#F0EDE6' }}>
              <span style={{ color: '#C9A84C', fontSize: 11, flexShrink: 0 }}>✦</span>{f}
            </div>
          ))}
        </div>

        <button className="btn-gold" onClick={startCheckout} disabled={loading}>
          {loading ? 'Redirecting to checkout...' : 'Start 7-day free trial →'}
        </button>

        <p style={{ textAlign: 'center', fontSize: 12, color: '#5A5855', marginTop: 14 }}>
          Secure payment via Stripe. No charge until trial ends.
        </p>
      </div>
    </div>
  )
}
