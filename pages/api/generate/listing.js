import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { canUse } from '../../../lib/usage'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const auth = req.headers.authorization
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Not authenticated' })
  }
  const token = auth.replace('Bearer ', '').trim()

  // Use anon key client with the user's token to verify identity
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  )

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    console.error('Auth error:', userError?.message)
    return res.status(401).json({ error: 'Not authenticated' })
  }

  // Use service role for DB operations
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  let { data: profile } = await admin.from('profiles').select('*').eq('id', user.id).single()

  if (!profile) {
    const { data: newProfile } = await admin.from('profiles').insert({
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name || '',
    }).select().single()
    profile = newProfile
  }

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
      system: 'You are RealtyAI, a professional real estate copywriter. Use plain text only, no markdown.',
      messages: [{
        role: 'user',
        content: `Write 3 outputs for this listing. Separate each with exactly "---OUTPUT---" on its own line.

Property: ${address}
${beds} beds · ${baths || '?'} baths · ${sqft ? sqft + ' sq ft' : ''}
Price: ${price}
Features: ${features || 'Not specified'}
Vibe: ${vibe || 'Not specified'}

OUTPUT 1 - MLS Description (150-180 words, end with call to action)
---OUTPUT---
OUTPUT 2 - Social Caption (50-70 words + 5 hashtags)
---OUTPUT---
OUTPUT 3 - Email Blast (Subject: line first, then 90-110 word email body)`,
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

    await admin.from('profiles')
      .update({ usage_listing: (profile.usage_listing || 0) + 1 })
      .eq('id', user.id)

    return res.status(200).json({ outputs })
  } catch (err) {
    console.error('Listing generation error:', err)
    return res.status(500).json({ error: 'Generation failed. Please try again.' })
  }
}
