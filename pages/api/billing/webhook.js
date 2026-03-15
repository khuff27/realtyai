import Stripe from 'stripe'
import { getServiceClient } from '../../../lib/supabase'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

// Required: disable Next.js body parsing so we can verify the raw Stripe signature
export const config = { api: { bodyParser: false } }

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', chunk => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const rawBody = await getRawBody(req)
  const sig = req.headers['stripe-signature']

  let event
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message)
    return res.status(400).json({ error: `Webhook error: ${err.message}` })
  }

  const admin = getServiceClient()

  async function setProStatus(stripeCustomerId, isPro, subscriptionId = null) {
    const update = { is_pro: isPro }
    if (subscriptionId) update.stripe_subscription_id = subscriptionId
    const { error } = await admin.from('profiles')
      .update(update)
      .eq('stripe_customer_id', stripeCustomerId)
    if (error) console.error('Supabase update error:', error)
  }

  try {
    switch (event.type) {
      // Trial started or subscription activated
      case 'customer.subscription.created':
      case 'checkout.session.completed': {
        const obj = event.data.object
        const customerId = obj.customer || obj.customer
        const subId = obj.subscription || obj.id
        if (customerId) await setProStatus(customerId, true, subId)
        break
      }

      // Payment succeeded — ensure pro stays active
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object
        if (invoice.customer) await setProStatus(invoice.customer, true, invoice.subscription)
        break
      }

      // Payment failed — grace period, keep pro for now
      case 'invoice.payment_failed': {
        console.log('Payment failed for customer:', event.data.object.customer)
        // Optionally send email here via Supabase Edge Function
        break
      }

      // Subscription cancelled or expired — revoke pro
      case 'customer.subscription.deleted': {
        const sub = event.data.object
        if (sub.customer) await setProStatus(sub.customer, false)
        break
      }

      // Subscription updated (e.g. cancel at period end)
      case 'customer.subscription.updated': {
        const sub = event.data.object
        const isActive = ['active', 'trialing'].includes(sub.status)
        if (sub.customer) await setProStatus(sub.customer, isActive)
        break
      }

      default:
        // Unhandled event type — ignore
        break
    }

    return res.status(200).json({ received: true })
  } catch (err) {
    console.error('Webhook handler error:', err)
    return res.status(500).json({ error: 'Webhook handler failed' })
  }
}
