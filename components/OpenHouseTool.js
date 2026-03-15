import { useState } from 'react'
import { canUse } from '../lib/usage'
import { authFetch } from '../lib/api'
import toast from 'react-hot-toast'

const emptyLead = () => ({ name: '', contact: '' })

export default function OpenHouseTool({ profile, onUsageUpdate, onUpgrade }) {
  const [property, setProperty] = useState('')
  const [highlights, setHighlights] = useState('')
  const [leads, setLeads] = useState([emptyLead(), emptyLead(), emptyLead()])
  const [type, setType] = useState('text')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(null)

  const allowed = canUse(profile, 'openhouse')

  function setLead(i, key) { return e => setLeads(l => l.map((lead, idx) => idx === i ? { ...lead, [key]: e.target.value } : lead)) }
  function addLead() { setLeads(l => [...l, emptyLead()]) }
  function removeLead(i) { setLeads(l => l.filter((_, idx) => idx !== i)) }

  const validLeads = leads.filter(l => l.name.trim())

  async function generate(e) {
    e.preventDefault()
    if (!allowed) { onUpgrade(); return }
    if (!property || validLeads.length === 0) {
      toast.error('Please enter the property and at least one guest name.')
      return
    }
    setLoading(true)
    setResults(null)
    try {
      const res = await authFetch('/api/generate/openhouse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ property, highlights, leads: validLeads, type }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Generation failed')
      setResults(data.followups)
      await onUsageUpdate()
      toast.success(`Generated ${data.followups.length} follow-ups!`)
    } catch (err) {
      toast.error(err.message)
    }
    setLoading(false)
  }

  function copy(text) {
    navigator.clipboard.writeText(text)
    toast.success('Copied!')
  }

  return (
    <div className="fade-up">
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: '"DM Serif Display", serif', fontSize: 32, marginBottom: 6 }}>Open House Follow-up</h1>
        <p style={{ color: '#8A8880', fontSize: 15 }}>Enter the property and guest list — get a personalized follow-up for every person before you leave.</p>
      </div>

      {!allowed && <PaywallBanner onUpgrade={onUpgrade} />}

      <form onSubmit={generate}>
        {/* Property */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#8A8880', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 14 }}>Property</div>
          <label className="field-label" style={{ marginTop: 0 }}>Address</label>
          <input className="input-base" placeholder="123 Oak Street, Nashville TN" value={property} onChange={e => setProperty(e.target.value)} disabled={!allowed} />
          <label className="field-label">Key highlights</label>
          <textarea className="input-base" rows={2} placeholder="4BR/3BA, updated kitchen, large backyard, asking $485k" value={highlights} onChange={e => setHighlights(e.target.value)} disabled={!allowed} />
        </div>

        {/* Leads */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#8A8880', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 4 }}>Open house guests</div>
          <p style={{ fontSize: 13, color: '#5A5855', marginBottom: 14 }}>Name is required. Email or phone is used to personalize the follow-up.</p>

          {leads.map((lead, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 32px', gap: 8, marginBottom: 8, alignItems: 'end' }}>
              <div>
                {i === 0 && <label className="field-label" style={{ marginTop: 0 }}>Name</label>}
                <input className="input-base" placeholder="Sarah Chen" value={lead.name} onChange={setLead(i, 'name')} disabled={!allowed} />
              </div>
              <div>
                {i === 0 && <label className="field-label" style={{ marginTop: 0 }}>Email or phone</label>}
                <input className="input-base" placeholder="sarah@email.com or 615-555-0123" value={lead.contact} onChange={setLead(i, 'contact')} disabled={!allowed} />
              </div>
              <button type="button" onClick={() => removeLead(i)} disabled={leads.length <= 1} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#5A5855', fontSize: 16, padding: '8px 4px', alignSelf: 'flex-end', marginBottom: 1,
              }}>✕</button>
            </div>
          ))}

          <button type="button" onClick={addLead} disabled={!allowed} style={{
            width: '100%', marginTop: 4, padding: 10,
            background: 'none', border: '1px dashed #2E2E2B', borderRadius: 8,
            color: '#5A5855', cursor: 'pointer', fontSize: 13,
            fontFamily: '"DM Sans", sans-serif', transition: 'all 0.15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#C9A84C'; e.currentTarget.style.color = '#C9A84C' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#2E2E2B'; e.currentTarget.style.color = '#5A5855' }}
          >+ Add guest</button>
        </div>

        {/* Message type toggle */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {[['text', 'Text message'], ['email', 'Email']].map(([val, label]) => (
            <button key={val} type="button" onClick={() => setType(val)} style={{
              flex: 1, padding: '10px', borderRadius: 10, border: 'none', cursor: 'pointer',
              background: type === val ? 'rgba(201,168,76,0.12)' : '#1A1A18',
              color: type === val ? '#C9A84C' : '#8A8880',
              border: type === val ? '1px solid rgba(201,168,76,0.3)' : '1px solid #2E2E2B',
              fontFamily: '"DM Sans", sans-serif', fontSize: 14, transition: 'all 0.15s',
            }}>{label}</button>
          ))}
        </div>

        <button className="btn-gold" type="submit" disabled={loading || !allowed}>
          {loading ? (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
              <span className="spinner" style={{ borderTopColor: '#1a1200' }} />
              Writing follow-ups for {validLeads.length} guest{validLeads.length !== 1 ? 's' : ''}...
            </span>
          ) : !allowed ? '🔒 Upgrade to continue' : `Generate follow-ups for ${validLeads.length} guest${validLeads.length !== 1 ? 's' : ''} →`}
        </button>
      </form>

      {results && (
        <div style={{ marginTop: 24 }}>
          {results.map((r, i) => (
            <div key={i} className="output-box">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#F0EDE6' }}>{r.name}</span>
                <button onClick={() => copy(r.message)} style={{
                  fontSize: 11, padding: '4px 12px', borderRadius: 8,
                  border: '1px solid #2E2E2B', background: '#1A1A18',
                  color: '#8A8880', cursor: 'pointer', fontFamily: '"DM Sans", sans-serif',
                }}>Copy</button>
              </div>
              <p style={{ fontSize: 14, lineHeight: 1.75, color: '#F0EDE6', whiteSpace: 'pre-wrap', margin: 0 }}>{r.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function PaywallBanner({ onUpgrade }) {
  return (
    <div style={{
      background: 'rgba(224,92,92,0.06)', border: '1px solid rgba(224,92,92,0.18)',
      borderRadius: 10, padding: '12px 16px', marginBottom: 16,
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      fontSize: 14, color: '#E05C5C',
    }}>
      <span>You've reached your 10 free follow-up limit this month.</span>
      <button onClick={onUpgrade} style={{
        background: 'none', border: 'none', cursor: 'pointer',
        color: '#C9A84C', fontWeight: 600, fontSize: 13, fontFamily: '"DM Sans", sans-serif',
      }}>Upgrade to Pro →</button>
    </div>
  )
}
