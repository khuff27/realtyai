import { useState } from 'react'
import { canUse } from '../lib/usage'
import { authFetch } from '../lib/api'
import toast from 'react-hot-toast'

const emptyComp = () => ({ address: '', price: '', beds: '', sqft: '' })

export default function CMATool({ profile, onUsageUpdate, onUpgrade }) {
  const [subject, setSubject] = useState({ address: '', beds: '', baths: '', sqft: '', price: '' })
  const [comps, setComps] = useState([emptyComp(), emptyComp(), emptyComp()])
  const [loading, setLoading] = useState(false)
  const [report, setReport] = useState(null)

  const allowed = canUse(profile, 'cma')

  function setSubjectField(key) { return e => setSubject(s => ({ ...s, [key]: e.target.value })) }
  function setComp(i, key) { return e => setComps(c => c.map((comp, idx) => idx === i ? { ...comp, [key]: e.target.value } : comp)) }
  function addComp() { setComps(c => [...c, emptyComp()]) }
  function removeComp(i) { setComps(c => c.filter((_, idx) => idx !== i)) }

  async function generate(e) {
    e.preventDefault()
    if (!allowed) { onUpgrade(); return }
    if (!subject.address) { toast.error('Please enter the subject property address.'); return }
    setLoading(true)
    setReport(null)
    try {
      const res = await authFetch('/api/generate/cma', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, comps: comps.filter(c => c.address) }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Generation failed')
      setReport(data.report)
      await onUsageUpdate()
      toast.success('CMA report ready!')
    } catch (err) {
      toast.error(err.message)
    }
    setLoading(false)
  }

  function copy() {
    navigator.clipboard.writeText(report)
    toast.success('Report copied to clipboard')
  }

  return (
    <div className="fade-up">
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: '"DM Serif Display", serif', fontSize: 32, marginBottom: 6 }}>CMA Report Builder</h1>
        <p style={{ color: '#8A8880', fontSize: 15 }}>Enter your subject property and comparable sales — get a seller-ready report for your appointment.</p>
      </div>

      {!allowed && <PaywallBanner onUpgrade={onUpgrade} />}

      <form onSubmit={generate}>
        {/* Subject property */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#8A8880', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 14 }}>Subject property</div>

          <label className="field-label" style={{ marginTop: 0 }}>Address</label>
          <input className="input-base" placeholder="123 Oak Street, Nashville TN" value={subject.address} onChange={setSubjectField('address')} disabled={!allowed} />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10 }}>
            {[['beds','Beds','4'],['baths','Baths','3'],['sqft','Sq ft','2100'],['price','Target price','$495,000']].map(([k,l,p]) => (
              <div key={k}>
                <label className="field-label">{l}</label>
                <input className="input-base" placeholder={p} value={subject[k]} onChange={setSubjectField(k)} disabled={!allowed} />
              </div>
            ))}
          </div>
        </div>

        {/* Comparables */}
        <div className="card">
          <div style={{ fontSize: 11, fontWeight: 700, color: '#8A8880', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 4 }}>Comparable sales</div>
          <p style={{ fontSize: 13, color: '#5A5855', marginBottom: 16 }}>Enter recently sold homes nearby. More comps = better report.</p>

          {comps.map((comp, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 60px 80px 32px', gap: 8, marginBottom: 8, alignItems: 'end' }}>
              <div>
                {i === 0 && <label className="field-label" style={{ marginTop: 0 }}>Address</label>}
                <input className="input-base" placeholder="456 Maple Ave..." value={comp.address} onChange={setComp(i, 'address')} disabled={!allowed} />
              </div>
              <div>
                {i === 0 && <label className="field-label" style={{ marginTop: 0 }}>Sale price</label>}
                <input className="input-base" placeholder="$465k" value={comp.price} onChange={setComp(i, 'price')} disabled={!allowed} />
              </div>
              <div>
                {i === 0 && <label className="field-label" style={{ marginTop: 0 }}>Beds</label>}
                <input className="input-base" placeholder="3" value={comp.beds} onChange={setComp(i, 'beds')} disabled={!allowed} />
              </div>
              <div>
                {i === 0 && <label className="field-label" style={{ marginTop: 0 }}>Sq ft</label>}
                <input className="input-base" placeholder="1950" value={comp.sqft} onChange={setComp(i, 'sqft')} disabled={!allowed} />
              </div>
              <button type="button" onClick={() => removeComp(i)} disabled={comps.length <= 1} style={{
                background: 'none', border: 'none', cursor: 'pointer', color: '#5A5855',
                fontSize: 16, padding: '8px 4px', alignSelf: 'flex-end', marginBottom: 1,
              }}>✕</button>
            </div>
          ))}

          <button type="button" onClick={addComp} disabled={!allowed} style={{
            width: '100%', marginTop: 4, padding: 10,
            background: 'none', border: '1px dashed #2E2E2B', borderRadius: 8,
            color: '#5A5855', cursor: 'pointer', fontSize: 13,
            fontFamily: '"DM Sans", sans-serif', transition: 'all 0.15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#C9A84C'; e.currentTarget.style.color = '#C9A84C' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#2E2E2B'; e.currentTarget.style.color = '#5A5855' }}
          >+ Add comparable</button>
        </div>

        <button className="btn-gold" type="submit" disabled={loading || !allowed} style={{ marginTop: 16 }}>
          {loading ? (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
              <span className="spinner" style={{ borderTopColor: '#1a1200' }} /> Building your CMA report...
            </span>
          ) : !allowed ? '🔒 Upgrade to generate' : 'Generate CMA report →'}
        </button>
      </form>

      {report && (
        <div className="output-box" style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#8A8880', letterSpacing: '0.07em', textTransform: 'uppercase' }}>CMA Report</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={copy} style={{
                fontSize: 11, padding: '4px 12px', borderRadius: 8,
                border: '1px solid #2E2E2B', background: '#1A1A18',
                color: '#8A8880', cursor: 'pointer', fontFamily: '"DM Sans", sans-serif',
              }}>Copy</button>
              {profile?.is_pro && (
                <button style={{
                  fontSize: 11, padding: '4px 12px', borderRadius: 8,
                  border: '1px solid rgba(201,168,76,0.3)', background: 'rgba(201,168,76,0.08)',
                  color: '#C9A84C', cursor: 'pointer', fontFamily: '"DM Sans", sans-serif',
                }}>Export PDF ↓</button>
              )}
            </div>
          </div>
          <p style={{ fontSize: 14, lineHeight: 1.85, color: '#F0EDE6', whiteSpace: 'pre-wrap', margin: 0 }}>{report}</p>
          {!profile?.is_pro && (
            <p style={{ fontSize: 12, color: '#5A5855', marginTop: 14, textAlign: 'center' }}>
              Pro plan includes branded PDF export
            </p>
          )}
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
      <span>You've used your 1 free CMA report this month.</span>
      <button onClick={onUpgrade} style={{
        background: 'none', border: 'none', cursor: 'pointer',
        color: '#C9A84C', fontWeight: 600, fontSize: 13,
        fontFamily: '"DM Sans", sans-serif',
      }}>Upgrade to Pro →</button>
    </div>
  )
}
