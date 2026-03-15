import Stripe from 'stripe'
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs'
import { getServiceClient } from '../../../lib/supabase'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const supabase = createServerSupabaseClient({ req, res })
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return res.status(401).json({ error: 'Not authenticated' })

  const admin = getServiceClient()
  const { data: profile } = await admin.from('profiles').select('*').eq('id', session.user.id).single()

  try {
    // Get or create Stripe customer
    let customerId = profile?.stripe_customer_id
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: session.user.email,
        metadata: { supabase_user_id: session.user.id },
      })
      customerId = customer.id
      await admin.from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', session.user.id)
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{
        price: process.env.STRIPE_PRO_PRICE_ID,
        quantity: 1,
      }],
      subscription_data: {
        trial_period_days: 7,
        metadata: { supabase_user_id: session.user.id },
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/app`,
      metadata: { supabase_user_id: session.user.id },
    })

    return res.status(200).json({ url: checkoutSession.url })
  } catch (err) {
    console.error('Stripe checkout error:', err)
    return res.status(500).json({ error: 'Could not start checkout. Please try again.' })
  }
}
