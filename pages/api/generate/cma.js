import Anthropic from '@anthropic-ai/sdk'
import { getServiceClient } from '../../../lib/supabase'
import { canUse } from '../../../lib/usage'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

async function getUserFromToken(req) {
  const auth = req.headers.authorization
  console.log('Auth header:', auth ? 'present' : 'missing')
  if (!auth || !auth.startsWith('Bearer ')) return null
  const token = auth.replace('Bearer ', '')
  console.log('Token length:', token.length)
  const admin = getServiceClient()
  const { data: { user }, error } = await admin.auth.getUser(token)
  if (error) console.log('Auth error:', error.message)
  if (!user) return null
  return user
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const user = await getUserFromToken(req)
  if (!user) return res.status(401).json({ error: 'Not authenticated' })

  const admin = getServiceClient()
  const { data: profile } = await admin.from('profiles').select('*').eq('id', user.id).single()

  // Auto-create profile if missing (Google OAuth users may not have one)
  let activeProfile = profile
  if (!activeProfile) {
    const { data: newProfile } = await admin.from('profiles').insert({
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name || user.email,
    }).select().single()
    activeProfile = newProfile
  }

  if (!canUse(activeProfile, 'cma')) {
    return res.status(403).json({ error: 'Monthly CMA limit reached. Upgrade to Pro for unlimited reports.' })
  }

  const { subject, comps } = req.body
  if (!subject?.address) return res.status(400).json({ error: 'Subject property address is required.' })

  const compText = comps?.length
    ? comps.map((c, i) => `Comp ${i + 1}: ${c.address} | Sale price: ${c.price || 'unknown'} | ${c.beds || '?'} beds | ${c.sqft || '?'} sq ft`).join('\n')
    : 'No comparables provided — use reasonable hypothetical market examples.'

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1200,
      system: 'You are RealtyAI, a senior real estate analyst. Write professional CMA reports agents can use in seller appointments. Plain text only, no markdown.',
      messages: [{
        role: 'user',
        content: `Write a professional CMA report for a seller appointment.

SUBJECT PROPERTY
Address: ${subject.address}
Beds: ${subject.beds || 'N/A'} | Baths: ${subject.baths || 'N/A'} | Sq ft: ${subject.sqft || 'N/A'}
Target list price: ${subject.price || 'To be determined'}

COMPARABLE SALES
${compText}

Use these exact section headers:

MARKET OVERVIEW
SUBJECT PROPERTY SUMMARY
COMPARABLE SALES ANALYSIS
PRICE PER SQUARE FOOT ANALYSIS
RECOMMENDED LIST PRICE RANGE
AGENT TALKING POINTS`,
      }],
    })

    const report = message.content[0].text.trim()

    await admin.from('profiles')
      .update({ usage_cma: (activeProfile.usage_cma || 0) + 1 })
      .eq('id', user.id)

    return res.status(200).json({ report })
  } catch (err) {
    console.error('CMA generation error:', err)
    return res.status(500).json({ error: 'Generation failed. Please try again.' })
  }
}
