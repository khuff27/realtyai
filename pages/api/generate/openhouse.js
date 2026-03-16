import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { canUse, FREE_LIMITS } from '../../../lib/usage'

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

  if (!canUse(profile, 'openhouse')) return res.status(403).json({ error: 'Monthly follow-up limit reached. Upgrade to Pro.' })

  const { property, highlights, leads, type } = req.body
  if (!property || !leads?.length) return res.status(400).json({ error: 'Property and at least one guest required.' })

  if (!profile.is_pro) {
    const remaining = FREE_LIMITS.openhouse - (profile.usage_openhouse || 0)
    if (leads.length > remaining) return res.status(403).json({ error: `Only ${remaining} follow-ups left this month.` })
  }

  const isText = type === 'text'
  const leadList = leads.map((l, i) => `${i+1}. ${l.name}${l.contact ? ` (${l.contact})` : ''}`).join('\n')

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1400,
      system: 'You are RealtyAI helping agents follow up with open house guests. Write warm personal messages. Plain text only.',
      messages: [{
        role: 'user',
        content: `Write ${isText ? 'text messages' : 'emails'} for each guest. Separate with "---GUEST---".
PROPERTY: ${property} | HIGHLIGHTS: ${highlights||'N/A'}
GUESTS: ${leadList}
${isText ? 'Under 160 chars each.' : 'Subject: line then 3-4 sentence email.'} Use their name. End with "[Agent Name]".`,
      }],
    })

    const parts = message.content[0].text.split('---GUEST---').map(p => p.trim()).filter(Boolean)
    const followups = leads.map((lead, i) => ({ name: lead.name, message: parts[i] || `Hi ${lead.name}, thanks for visiting ${property}! — [Agent Name]` }))
    await admin.from('profiles').update({ usage_openhouse: (profile.usage_openhouse || 0) + leads.length }).eq('id', userId)
    return res.status(200).json({ followups })
  } catch (err) {
    return res.status(500).json({ error: 'Generation failed. Please try again.' })
  }
}
