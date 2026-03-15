import Anthropic from '@anthropic-ai/sdk'
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs'
import { getServiceClient } from '../../../lib/supabase'
import { canUse, FREE_LIMITS } from '../../../lib/usage'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const supabase = createServerSupabaseClient({ req, res })
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return res.status(401).json({ error: 'Not authenticated' })

  const admin = getServiceClient()
  const { data: profile } = await admin.from('profiles').select('*').eq('id', session.user.id).single()

  if (!canUse(profile, 'openhouse')) {
    return res.status(403).json({ error: 'Monthly follow-up limit reached. Upgrade to Pro for unlimited follow-ups.' })
  }

  const { property, highlights, leads, type } = req.body
  if (!property || !leads?.length) {
    return res.status(400).json({ error: 'Property address and at least one guest are required.' })
  }

  // Check if adding these leads would exceed free limit
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
      system: 'You are RealtyAI, a real estate assistant helping agents follow up with open house guests. Write warm, personal messages that feel human — not templated. Plain text only.',
      messages: [{
        role: 'user',
        content: `Write personalized open house follow-up ${isText ? 'text messages' : 'emails'} for each guest below.

PROPERTY: ${property}
HIGHLIGHTS: ${highlights || 'Not specified'}

GUESTS:
${leadList}

Instructions:
- Write one ${isText ? 'text message' : 'email'} per guest
- ${isText ? 'Keep texts under 160 characters if possible. Warm and conversational.' : 'Include a Subject line on the first line (format: "Subject: ..."), then a 3-4 sentence email body.'}
- Use each guest's name
- Reference the property naturally
- Invite them to ask questions or schedule a showing
- End with "[Agent Name]" as placeholder for the agent's signature
- NO pressure tactics, NO exclamation point overuse
- Separate each follow-up with exactly "---GUEST---" on its own line

Write all ${leads.length} follow-up${leads.length !== 1 ? 's' : ''} now:`,
      }],
    })

    const raw = message.content[0].text
    const parts = raw.split('---GUEST---').map(p => p.trim()).filter(Boolean)

    const followups = leads.map((lead, i) => ({
      name: lead.name,
      message: parts[i] || `Hi ${lead.name}, thanks for visiting ${property} today! Feel free to reach out with any questions. — [Agent Name]`,
    }))

    // Increment usage by number of leads processed
    await admin.from('profiles')
      .update({ usage_openhouse: (profile.usage_openhouse || 0) + leads.length })
      .eq('id', session.user.id)

    return res.status(200).json({ followups })
  } catch (err) {
    console.error('Open house generation error:', err)
    return res.status(500).json({ error: 'Generation failed. Please try again.' })
  }
}
