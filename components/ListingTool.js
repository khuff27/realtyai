import { useState } from 'react'
import { canUse } from '../lib/usage'
import { authFetch } from '../lib/api'
import toast from 'react-hot-toast'

export default function ListingTool({ profile, onUsageUpdate, onUpgrade }) {
  const [form, setForm] = useState({ address: '', beds: '', baths: '', sqft: '', price: '', features: '', vibe: '' })
  const [loading, setLoading] = useState(false)
  const [outputs, setOutputs] = useState(null)

  const allowed = canUse(profile, 'listing')

  function set(key) { return e => setForm(f => ({ ...f, [key]: e.target.value })) }

  async function generate(e) {
    e.preventDefault()
    if (!allowed) { onUpgrade(); return }
    if (!form.address || !form.beds || !form.price) {
      toast.error('Please fill in address, beds, and price at minimum.')
      return
    }
    setLoading(true)
    setOutputs(null)
    try {
      const res = await authFetch('/api/generate/listing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Generation failed')
      setOutputs(data.outputs)
      await onUsageUpdate()
      toast.success('Generated 3 outputs!')
    } catch (err) {
      toast.error(err.message)
    }
    setLoading(false)
  }

  function copy(text) {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  }

  return (
    <div className="fade-up">
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: '"DM Serif Display", serif', fontSize: 32, marginBottom: 6 }}>Listing Generator</h1>
        <p style={{ color: '#8A8880', fontSize: 15 }}>Fill in the details — get MLS copy, a social caption, and an email blast in one click.</p>
      </div>

      {!allowed && <PaywallBanner tool="listing" onUpgrade={onUpgrade} />}

      <form onSubmit={generate}>
        <div className="card">
          <label className="field-label" style={{ marginTop: 0 }}>Property address</label>
          <input className="input-base" placeholder="123 Oak Street, Nashville TN 37201" value={form.address} onChange={set('address')} disabled={!allowed} />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div>
              <label className="field-label">Beds</label>
              <input className="input-base" type="number" placeholder="4" value={form.beds} onChange={set('beds')} disabled={!allowed} />
            </div>
            <div>
              <label className="field-label">Baths</label>
              <input className="input-base" type="number" placeholder="3" value={form.baths} onChange={set('baths')} disabled={!allowed} />
            </div>
            <div>
              <label className="field-label">Sq ft</label>
              <input className="input-base" type="number" placeholder="2,400" value={form.sqft} onChange={set('sqft')} disabled={!allowed} />
            </div>
          </div>

          <label className="field-label">List price</label>
          <input className="input-base" placeholder="$485,000" value={form.price} onChange={set('price')} disabled={!allowed} />

          <label className="field-label">Key features (comma separated)</label>
          <textarea className="input-base" rows={3} placeholder="Updated kitchen, hardwood floors, large backyard, 2-car garage, quiet cul-de-sac" value={form.features} onChange={set('features')} disabled={!allowed} />

          <label className="field-label">Neighborhood vibe</label>
          <select className="input-base" value={form.vibe} onChange={set('vibe')} disabled={!allowed} style={{ cursor: 'pointer' }}>
            <option value="">Select a vibe...</option>
            <option>Family-friendly suburban</option>
            <option>Walkable urban core</option>
            <option>Quiet & private retreat</option>
            <option>Up-and-coming neighborhood</option>
            <option>Luxury & prestige</option>
            <option>Investment / rental opportunity</option>
          </select>
        </div>

        <button className="btn-gold" type="submit" disabled={loading || !allowed} style={{ marginTop: 16 }}>
          {loading ? (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
              <span className="spinner" style={{ borderTopColor: '#1a1200' }} />
              Generating your 3 outputs...
            </span>
          ) : !allowed ? '🔒 Upgrade to generate' : 'Generate all 3 outputs →'}
        </button>
      </form>

      {outputs && (
        <div style={{ marginTop: 24 }}>
          {[
            { key: 'mls', label: 'MLS Description' },
            { key: 'social', label: 'Social Caption' },
            { key: 'email', label: 'Email Blast' },
          ].map(({ key, label }) => outputs[key] && (
            <div key={key} className="output-box">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#8A8880', letterSpacing: '0.07em', textTransform: 'uppercase' }}>{label}</span>
                <button onClick={() => copy(outputs[key])} style={{
                  fontSize: 11, padding: '4px 12px', borderRadius: 8,
                  border: '1px solid #2E2E2B', background: '#1A1A18',
                  color: '#8A8880', cursor: 'pointer', fontFamily: '"DM Sans", sans-serif',
                }}>Copy</button>
              </div>
              <p style={{ fontSize: 14, lineHeight: 1.75, color: '#F0EDE6', whiteSpace: 'pre-wrap', margin: 0 }}>{outputs[key]}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function PaywallBanner({ tool, onUpgrade }) {
  const msgs = {
    listing: "You've used all 3 free listings this month.",
    cma: "You've used your 1 free CMA report this month.",
    openhouse: "You've reached your 10 free follow-up limit this month.",
  }
  return (
    <div style={{
      background: 'rgba(224,92,92,0.06)', border: '1px solid rgba(224,92,92,0.18)',
      borderRadius: 10, padding: '12px 16px', marginBottom: 16,
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      fontSize: 14, color: '#E05C5C',
    }}>
      <span>{msgs[tool]}</span>
      <button onClick={onUpgrade} style={{
        background: 'none', border: 'none', cursor: 'pointer',
        color: '#C9A84C', fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap',
        fontFamily: '"DM Sans", sans-serif',
      }}>Upgrade to Pro →</button>
    </div>
  )
}
