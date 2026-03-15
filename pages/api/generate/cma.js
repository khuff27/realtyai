import Anthropic from '@anthropic-ai/sdk'
import { createServerClient } from '@supabase/ssr'
import { getServiceClient } from '../../../lib/supabase'
import { canUse } from '../../../lib/usage'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get: (name) => req.cookies[name],
        set: () => {},
        remove: () => {},
      },
    }
  )
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return res.status(401).json({ error: 'Not authenticated' })

  const admin = getServiceClient()
  const { data: profile } = await admin.from('profiles').select('*').eq('id', session.user.id).single()
  if (!canUse(profile, 'cma')) {
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
      system: 'You are RealtyAI, a senior real estate analyst. Write professional, data-driven CMA reports that agents can use in seller appointments. Plain text only — no markdown symbols. Be specific with numbers.',
      messages: [{
        role: 'user',
        content: `Write a professional Comparative Market Analysis (CMA) report for a seller appointment.

SUBJECT PROPERTY
Address: ${subject.address}
Beds: ${subject.beds || 'N/A'} | Baths: ${subject.baths || 'N/A'} | Sq ft: ${subject.sqft || 'N/A'}
Target list price: ${subject.price || 'To be determined'}

COMPARABLE SALES
${compText}

Write the report using EXACTLY these section headers with blank lines between sections. Use plain text, no asterisks or dashes for bullets — use numbers or letters instead.

MARKET OVERVIEW
2-3 sentences on current local market conditions and what they mean for this seller.

SUBJECT PROPERTY SUMMARY
Brief description of the home and its key selling points.

COMPARABLE SALES ANALYSIS
For each comp: address, sale price, brief 1-sentence note on how it compares to subject.

PRICE PER SQUARE FOOT ANALYSIS
Calculate and compare price per sq ft across subject and comps. Give a range.

RECOMMENDED LIST PRICE RANGE
Give a specific dollar range (e.g. $480,000 - $499,000) with a 2-sentence rationale.

AGENT TALKING POINTS
3 specific talking points the agent can use with the seller at this appointment.`,
      }],
    })

    const report = message.content[0].text.trim()

    await admin.from('profiles')
      .update({ usage_cma: (profile.usage_cma || 0) + 1 })
      .eq('id', session.user.id)

    return res.status(200).json({ report })
  } catch (err) {
    console.error('CMA generation error:', err)
    return res.status(500).json({ error: 'Generation failed. Please try again.' })
  }
}
