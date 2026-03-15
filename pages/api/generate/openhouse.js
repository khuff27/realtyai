import Anthropic from '@anthropic-ai/sdk'
import { getServiceClient } from '../../../lib/supabase'
import { canUse, FREE_LIMITS } from '../../../lib/usage'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

async function getUserFromToken(req) {
  const auth = req.headers.authorization
  if (!auth || !auth.startsWith('Bearer ')) return null
  const token = auth.replace('Bearer ', '')
  const admin = getServiceClient()
  const { data: { user }, error } = await admin.auth.getUser(token)
  if (error || !user) return null
  return user
}

async function getOrCreateProfile(admin, user) {
  const { data: profile } = await admin.from('profiles').select('*').eq('id', user.id).single()
  if (profile) return profile
  const { data: newProfile } = await admin.from('profiles').insert({
    id: user.id,
    email: user.email,
    full_name: user.user_metadata?.full_name || user.email,
  }).select().single()
  return newProfile
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const user = await getUserFromToken(req)
  if (!user) return res.status(401).json({ error: 'Not authenticated' })

  const admin = getServiceClient()
  const profile = await getOrCreateProfile(admin, user)

  if (!canUse(profile, 'openhouse')) {
    return res.status(403).json({ error: 'Monthly follow-up limit reached. Upgrade to Pro for unlimited follow-ups.' })
  }

  const { property, highlights, leads, type } = req.body
  if (!property || !leads?.length) {
    return res.status(400).json({ error: 'Property address and at least one guest are required.' })
  }

  if (!profile.is_pro) {
    const used = profile.usage_openhouse || 0
    const remaining = FREE_LIMITS.openhouse - used
    if (leads.length > remaining) {
      return res.status(403).json({
        error: `You have ${remaining} follow-up${remaining !== 1 ? 's' : ''} left this month. Upgrade to Pro for unlimited access.`
      })
    }
  }

  const isText = type === 'text'
  const leadList = leads.map((l, i) => `${i + 1}. Name: ${l.name}${l.contact ? ` | Contact: ${l.contact}` : ''}`).join('\n')

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1400,
      system: 'You are RealtyAI, helping agents follow up with open house guests. Write warm, personal messages. Plain text only.',
      messages: [{
        role: 'user',
        content: `Write personalized open house follow-up ${isText ? 'text messages' : 'emails'} for each guest.

PROPERTY: ${property}
HIGHLIGHTS: ${highlights || 'Not specified'}

GUESTS:
${leadList}

Instructions:
- ${isText ? 'Keep texts under 160 characters. Warm and conversational.' : 'Include Subject: line first, then 3-4 sentence email.'}
- Use each guest name, reference the property, invite questions or a showing
- End with "[Agent Name]"
- Separate each with exactly "---GUEST---" on its own line`,
      }],
    })

    const raw = message.content[0].text
    const parts = raw.split('---GUEST---').map(p => p.trim()).filter(Boolean)

    const followups = leads.map((lead, i) => ({
      name: lead.name,
      message: parts[i] || `Hi ${lead.name}, thanks for visiting ${property} today! Feel free to reach out. — [Agent Name]`,
    }))

    await admin.from('profiles')
      .update({ usage_openhouse: (profile.usage_openhouse || 0) + leads.length })
      .eq('id', user.id)

    return res.status(200).json({ followups })
  } catch (err) {
    console.error('Open house generation error:', err)
    return res.status(500).json({ error: 'Generation failed. Please try again.' })
  }
}
