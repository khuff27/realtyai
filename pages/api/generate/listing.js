import Anthropic from '@anthropic-ai/sdk'
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs'
import { getServiceClient } from '../../../lib/supabase'
import { canUse, FREE_LIMITS } from '../../../lib/usage'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  // Auth check
  const supabase = createServerSupabaseClient({ req, res })
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return res.status(401).json({ error: 'Not authenticated' })

  // Fetch profile + check usage
  const admin = getServiceClient()
  const { data: profile } = await admin.from('profiles').select('*').eq('id', session.user.id).single()
  if (!canUse(profile, 'listing')) {
    return res.status(403).json({ error: 'Monthly listing limit reached. Upgrade to Pro for unlimited access.' })
  }

  const { address, beds, baths, sqft, price, features, vibe } = req.body
  if (!address || !beds || !price) {
    return res.status(400).json({ error: 'Address, beds, and price are required.' })
  }

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1200,
      system: 'You are RealtyAI, a professional real estate copywriter. Write compelling, accurate real estate content. Use plain text only — no markdown symbols like ** or ##. Be warm, professional, and specific.',
      messages: [{
        role: 'user',
        content: `Write 3 outputs for this listing. Separate each section with exactly "---OUTPUT---" on its own line.

Property: ${address}
${beds} beds · ${baths || '?'} baths · ${sqft ? sqft + ' sq ft' : 'sq ft not provided'}
Price: ${price}
Features: ${features || 'Not specified'}
Neighborhood vibe: ${vibe || 'Not specified'}

OUTPUT 1 - MLS Description
Write a 150-180 word professional MLS listing description. Lead with the strongest feature. End with a call to action like "Schedule your showing today."

---OUTPUT---

OUTPUT 2 - Social Media Caption
Write a 50-70 word Instagram/Facebook caption. Make it punchy and engaging. Include 5-6 relevant hashtags at the end.

---OUTPUT---

OUTPUT 3 - Email Blast
First line: Subject: [your subject line here]
Then write a 90-110 word email to buyer leads. Reference the property, highlight 2-3 key features, and include a clear call to action.`,
      }],
    })

    const raw = message.content[0].text
    const parts = raw.split('---OUTPUT---').map(p => p.trim())
    const clean = (s) => s.replace(/^OUTPUT \d+ - [^\n]+\n+/, '').trim()

    const outputs = {
      mls: parts[0] ? clean(parts[0]) : '',
      social: parts[1] ? clean(parts[1]) : '',
      email: parts[2] ? clean(parts[2]) : '',
    }

    // Increment usage counter
    await admin.from('profiles')
      .update({ usage_listing: (profile.usage_listing || 0) + 1 })
      .eq('id', session.user.id)

    return res.status(200).json({ outputs })
  } catch (err) {
    console.error('Listing generation error:', err)
    return res.status(500).json({ error: 'Generation failed. Please try again.' })
  }
}
