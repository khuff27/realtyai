import Head from 'next/head'
import Link from 'next/link'
import { useState } from 'react'

const TOOLS = [
  {
    icon: '✎',
    color: 'rgba(76,175,124,0.12)',
    title: 'Listing Description Generator',
    desc: 'Input beds, baths, and features — get polished MLS copy, a social caption, and an email blast. Three outputs, one click.',
    badge: '3 free/mo',
  },
  {
    icon: '◫',
    color: 'rgba(201,168,76,0.12)',
    title: 'CMA Report Builder',
    desc: 'Enter your subject property and comps — get a branded seller report ready for your next appointment.',
    badge: '1 free/mo',
  },
  {
    icon: '⌂',
    color: 'rgba(100,140,255,0.12)',
    title: 'Open House Follow-up',
    desc: 'Paste your sign-in sheet — get personalized texts and emails for every guest before you leave the driveway.',
    badge: '10 leads free',
  },
]

const TESTIMONIALS = [
  { quote: 'I write 10 listings a month. This saves me at least 2 hours. Pays for itself on the first one.', name: 'Sarah M.', role: 'RE/MAX agent, Nashville' },
  { quote: 'The CMA report is something I used to dread building. Now I walk into seller meetings with it already done.', name: 'James T.', role: 'Keller Williams, Austin' },
  { quote: 'My open house follow-ups used to go out 3 days late. Now they go out the same night.', name: 'Priya K.', role: 'Independent broker, Chicago' },
]

export default function Landing() {
  const [email, setEmail] = useState('')

  return (
    <>
      <Head>
        <title>RealtyAI — AI tools for real estate agents</title>
        <meta name="description" content="Write listings, build CMA reports, and follow up with open house leads — all powered by AI. Built for agents who'd rather be selling than typing." />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="noise" style={{ minHeight: '100vh', background: '#0F0F0E' }}>

        {/* NAV */}
        <nav style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '20px 40px', borderBottom: '1px solid #2E2E2B',
          position: 'sticky', top: 0, background: 'rgba(15,15,14,0.92)',
          backdropFilter: 'blur(12px)', zIndex: 100,
        }}>
          <span style={{ fontFamily: '"DM Serif Display", serif', fontSize: 22, color: '#F0EDE6' }}>
            RealtyAI
          </span>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <Link href="/login" style={{ color: '#8A8880', fontSize: 14, textDecoration: 'none', padding: '8px 16px' }}>
              Sign in
            </Link>
            <Link href="/signup" style={{
              background: 'linear-gradient(135deg, #C9A84C, #E8C96A)',
              color: '#1a1200', fontWeight: 600, fontSize: 14,
              padding: '9px 20px', borderRadius: 10, textDecoration: 'none',
            }}>
              Try free →
            </Link>
          </div>
        </nav>

        {/* HERO */}
        <section style={{ maxWidth: 960, margin: '0 auto', padding: '100px 40px 80px', textAlign: 'center' }}>
          <div className="fade-up" style={{
            display: 'inline-block', background: 'rgba(201,168,76,0.1)',
            border: '1px solid rgba(201,168,76,0.25)', borderRadius: 20,
            padding: '5px 16px', fontSize: 12, fontWeight: 600,
            color: '#C9A84C', letterSpacing: '0.08em', textTransform: 'uppercase',
            marginBottom: 24,
          }}>
            Built for real estate agents
          </div>

          <h1 className="fade-up-1" style={{
            fontFamily: '"DM Serif Display", serif',
            fontSize: 'clamp(42px, 7vw, 76px)',
            lineHeight: 1.1, letterSpacing: '-1px',
            marginBottom: 24, color: '#F0EDE6',
          }}>
            Stop writing.<br />
            <em style={{ color: '#C9A84C' }}>Start closing.</em>
          </h1>

          <p className="fade-up-2" style={{
            fontSize: 'clamp(16px, 2.5vw, 20px)', color: '#8A8880',
            lineHeight: 1.7, maxWidth: 560, margin: '0 auto 40px',
          }}>
            Three AI tools that handle your listings, CMA reports, and open house follow-ups — so you can spend your time on what actually earns commission.
          </p>

          <div className="fade-up-3" style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/signup" style={{
              background: 'linear-gradient(135deg, #C9A84C, #E8C96A)',
              color: '#1a1200', fontWeight: 600, fontSize: 16,
              padding: '15px 32px', borderRadius: 12, textDecoration: 'none',
              display: 'inline-block',
            }}>
              Start free — no credit card
            </Link>
            <Link href="/app" style={{
              background: 'transparent', border: '1px solid #2E2E2B',
              color: '#F0EDE6', fontSize: 16,
              padding: '15px 32px', borderRadius: 12, textDecoration: 'none',
              display: 'inline-block',
            }}>
              See the tools →
            </Link>
          </div>

          <p className="fade-up-4" style={{ fontSize: 13, color: '#5A5855', marginTop: 20 }}>
            Free plan includes 3 listings, 1 CMA report, and 10 follow-ups per month.
          </p>
        </section>

        {/* TOOLS */}
        <section style={{ maxWidth: 960, margin: '0 auto', padding: '0 40px 100px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            {TOOLS.map((t, i) => (
              <div key={i} style={{
                background: '#1A1A18', border: '1px solid #2E2E2B',
                borderRadius: 16, padding: 28, transition: 'border-color 0.2s',
              }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#C9A84C'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#2E2E2B'}
              >
                <div style={{
                  width: 48, height: 48, borderRadius: 12,
                  background: t.color, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: 22, marginBottom: 16,
                }}>{t.icon}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <h3 style={{ fontFamily: '"DM Serif Display", serif', fontSize: 18, lineHeight: 1.2 }}>{t.title}</h3>
                  <span style={{
                    background: 'rgba(201,168,76,0.1)', color: '#C9A84C',
                    border: '1px solid rgba(201,168,76,0.2)',
                    fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20,
                    whiteSpace: 'nowrap', marginLeft: 8, flexShrink: 0,
                  }}>{t.badge}</span>
                </div>
                <p style={{ color: '#8A8880', fontSize: 14, lineHeight: 1.6 }}>{t.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* PRICING */}
        <section style={{ maxWidth: 960, margin: '0 auto', padding: '0 40px 100px', textAlign: 'center' }}>
          <h2 style={{ fontFamily: '"DM Serif Display", serif', fontSize: 'clamp(32px, 5vw, 48px)', marginBottom: 16 }}>
            Simple pricing.
          </h2>
          <p style={{ color: '#8A8880', fontSize: 16, marginBottom: 48 }}>
            Start free. Upgrade when you're ready. Cancel anytime.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, maxWidth: 640, margin: '0 auto' }}>
            {/* Free */}
            <div style={{ background: '#1A1A18', border: '1px solid #2E2E2B', borderRadius: 16, padding: 28, textAlign: 'left' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#8A8880', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Free</div>
              <div style={{ fontFamily: '"DM Serif Display", serif', fontSize: 40, marginBottom: 4 }}>$0</div>
              <div style={{ color: '#8A8880', fontSize: 13, marginBottom: 24 }}>forever</div>
              {['3 listing descriptions/mo', '1 CMA report/mo', '10 open house follow-ups/mo', 'All output types'].map(f => (
                <div key={f} style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10, fontSize: 14, color: '#8A8880' }}>
                  <span style={{ color: '#C9A84C', fontSize: 12 }}>✦</span>{f}
                </div>
              ))}
              <Link href="/signup" style={{
                display: 'block', marginTop: 24, textAlign: 'center',
                border: '1px solid #2E2E2B', color: '#F0EDE6',
                padding: '12px', borderRadius: 10, textDecoration: 'none', fontSize: 14,
              }}>Get started free</Link>
            </div>

            {/* Pro */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(201,168,76,0.08), #1A1A18)',
              border: '1px solid rgba(201,168,76,0.35)', borderRadius: 16, padding: 28, textAlign: 'left',
              position: 'relative',
            }}>
              <div style={{
                position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                background: 'linear-gradient(135deg, #C9A84C, #E8C96A)',
                color: '#1a1200', fontSize: 11, fontWeight: 700, padding: '4px 14px',
                borderRadius: 20, letterSpacing: '0.06em', textTransform: 'uppercase', whiteSpace: 'nowrap',
              }}>Most popular</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#C9A84C', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Pro</div>
              <div style={{ fontFamily: '"DM Serif Display", serif', fontSize: 40, color: '#C9A84C', marginBottom: 4 }}>$29</div>
              <div style={{ color: '#8A8880', fontSize: 13, marginBottom: 24 }}>per month</div>
              {['Unlimited listing descriptions', 'Unlimited CMA reports', 'Unlimited follow-ups', 'CMA PDF export', 'Custom branding on reports', 'Priority support', 'Synced across web + mobile'].map(f => (
                <div key={f} style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10, fontSize: 14, color: '#F0EDE6' }}>
                  <span style={{ color: '#C9A84C', fontSize: 12 }}>✦</span>{f}
                </div>
              ))}
              <Link href="/signup" style={{
                display: 'block', marginTop: 24, textAlign: 'center',
                background: 'linear-gradient(135deg, #C9A84C, #E8C96A)',
                color: '#1a1200', fontWeight: 600,
                padding: '13px', borderRadius: 10, textDecoration: 'none', fontSize: 14,
              }}>Start Pro free for 7 days</Link>
            </div>
          </div>
        </section>

        {/* TESTIMONIALS */}
        <section style={{ maxWidth: 960, margin: '0 auto', padding: '0 40px 100px' }}>
          <h2 style={{ fontFamily: '"DM Serif Display", serif', fontSize: 'clamp(28px, 4vw, 40px)', textAlign: 'center', marginBottom: 48 }}>
            Agents love it.
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
            {TESTIMONIALS.map((t, i) => (
              <div key={i} style={{ background: '#1A1A18', border: '1px solid #2E2E2B', borderRadius: 16, padding: 24 }}>
                <p style={{ color: '#F0EDE6', fontSize: 15, lineHeight: 1.7, marginBottom: 20, fontStyle: 'italic' }}>
                  "{t.quote}"
                </p>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{t.name}</div>
                <div style={{ fontSize: 12, color: '#8A8880' }}>{t.role}</div>
              </div>
            ))}
          </div>
        </section>

        {/* FOOTER */}
        <footer style={{ borderTop: '1px solid #2E2E2B', padding: '32px 40px', textAlign: 'center' }}>
          <div style={{ fontFamily: '"DM Serif Display", serif', fontSize: 18, marginBottom: 8 }}>RealtyAI</div>
          <p style={{ color: '#5A5855', fontSize: 13 }}>
            © 2025 RealtyAI. Built for agents who'd rather be selling.
          </p>
        </footer>
      </div>
    </>
  )
}
