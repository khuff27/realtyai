import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { canUse } from '../../../lib/usage'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

function decodeJWT(token) {
  try {
    const payload = token.split('.')[1]
    const decoded = Buffer.from(payload, 'base64').toString('utf8')
    return JSON.parse(decoded)
  } catch(e) { return null }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const auth = req.headers.authorization
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'Not authenticated' })
  
  const token = auth.replace('Bearer ', '').trim()
  const payload = decodeJWT(token)
  if (!payload?.sub) return res.status(401).json({ error: 'Not authenticated' })
  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return res.status(401).json({ error: 'Session expired.' })

  const userId = payload.sub
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

  let { data: profile } = await admin.from('profiles').select('*').eq('id', userId).single()
  if (!profile) {
    const { data: np } = await admin.from('profiles').insert({ id: userId, email: payload.email, full_name: payload.user_metadata?.full_name || '' }).select().single()
    profile = np
  }

  if (!canUse(profile, 'cma')) return res.status(403).json({ error: 'Monthly CMA limit reached. Upgrade to Pro.' })

  const { subject, comps } = req.body
  if (!subject?.address) return res.status(400).json({ error: 'Subject property address is required.' })

  const compText = comps?.length
    ? comps.map((c, i) => `Comp ${i+1}: ${c.address} | ${c.price||'unknown'} | ${c.beds||'?'} beds | ${c.sqft||'?'} sqft`).join('\n')
    : 'No comparables — use reasonable market examples.'

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1200,
      system: 'You are RealtyAI, a senior real estate analyst. Write professional CMA reports. Plain text only.',
      messages: [{
        role: 'user',
        content: `Write a professional CMA report.

SUBJECT: ${subject.address} | ${subject.beds||'?'} beds | ${subject.baths||'?'} baths | ${subject.sqft||'?'} sqft | Target: ${subject.price||'TBD'}
COMPS: ${compText}

Sections: MARKET OVERVIEW / SUBJECT PROPERTY SUMMARY / COMPARABLE SALES ANALYSIS / PRICE PER SQUARE FOOT ANALYSIS / RECOMMENDED LIST PRICE RANGE / AGENT TALKING POINTS`,
      }],
    })

    await admin.from('profiles').update({ usage_cma: (profile.usage_cma || 0) + 1 }).eq('id', userId)
    return res.status(200).json({ report: message.content[0].text.trim() })
  } catch (err) {
    return res.status(500).json({ error: 'Generation failed. Please try again.' })
  }
}
