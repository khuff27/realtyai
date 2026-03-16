# RealtyAI — Deployment Guide

Three AI tools for real estate agents: listing descriptions, CMA reports, and open house follow-ups.
Freemium SaaS — free tier with monthly limits, Pro plan at $29/month.

\---

## Stack

* **Frontend + API**: Next.js 14 (deployed to Vercel)
* **Auth + Database**: Supabase (magic link login, Postgres)
* **AI**: Anthropic Claude API
* **Web billing**: Stripe
* **Mobile billing**: RevenueCat (wire in when building React Native app)

\---

## Deploy in 5 steps

### 1\. Set up Supabase

1. Go to [supabase.com](https://supabase.com) → create a new project
2. In the SQL Editor, paste and run the contents of `supabase-schema.sql`
3. Go to Project Settings → API → copy:

   * Project URL → `NEXT\_PUBLIC\_SUPABASE\_URL`
   * anon/public key → `NEXT\_PUBLIC\_SUPABASE\_ANON\_KEY`
   * service\_role key → `SUPABASE\_SERVICE\_ROLE\_KEY`
4. Go to Authentication → URL Configuration → add your Vercel domain to Site URL and Redirect URLs

### 2\. Set up Anthropic

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Create an API key → `ANTHROPIC\_API\_KEY`

### 3\. Set up Stripe

1. Go to [dashboard.stripe.com](https://dashboard.stripe.com)
2. Create a Product: "RealtyAI Pro" with a recurring price of $29/month
3. Copy the Price ID → `STRIPE\_PRO\_PRICE\_ID`
4. Copy publishable key → `NEXT\_PUBLIC\_STRIPE\_PUBLISHABLE\_KEY`
5. Copy secret key → `STRIPE\_SECRET\_KEY`
6. After deploying to Vercel, set up a webhook:

   * Endpoint: `https://yourdomain.vercel.app/api/billing/webhook`
   * Events to listen for:

     * `checkout.session.completed`
     * `customer.subscription.created`
     * `customer.subscription.updated`
     * `customer.subscription.deleted`
     * `invoice.payment\_succeeded`
     * `invoice.payment\_failed`
   * Copy webhook signing secret → `STRIPE\_WEBHOOK\_SECRET`

### 4\. Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# From the realtyai directory
vercel

# Follow prompts, then add environment variables:
vercel env add NEXT\_PUBLIC\_SUPABASE\_URL
vercel env add NEXT\_PUBLIC\_SUPABASE\_ANON\_KEY
vercel env add SUPABASE\_SERVICE\_ROLE\_KEY
vercel env add ANTHROPIC\_API\_KEY
vercel env add STRIPE\_SECRET\_KEY
vercel env add NEXT\_PUBLIC\_STRIPE\_PUBLISHABLE\_KEY
vercel env add STRIPE\_WEBHOOK\_SECRET
vercel env add STRIPE\_PRO\_PRICE\_ID
vercel env add NEXT\_PUBLIC\_APP\_URL  # your https://yourapp.vercel.app URL

# Deploy to production
vercel --prod
```

Or connect your GitHub repo to Vercel and it auto-deploys on every push.

### 5\. Test the full flow

1. Visit your deployed URL
2. Sign up with your email → click magic link
3. Try generating a listing → confirm usage counter increments in Supabase
4. Hit the limit → upgrade modal should appear
5. Complete Stripe checkout (use test card `4242 4242 4242 4242`)
6. Confirm `is\_pro = true` in your Supabase profiles table
7. Confirm all tools now show unlimited

\---

## Local development

```bash
# Clone and install
npm install

# Copy env file and fill in your values
cp .env.local.example .env.local

# Run dev server
npm run dev
# Open http://localhost:3000
```

For Stripe webhooks locally, use the Stripe CLI:

```bash
stripe listen --forward-to localhost:3000/api/billing/webhook
```

\---

## Monthly usage reset

Usage counters reset automatically for users whose `usage\_reset\_at` is older than 30 days.
The `reset\_monthly\_usage()` function is already in your Supabase DB.

To call it automatically, set up a Supabase cron job (pg\_cron):

```sql
-- Run in Supabase SQL Editor
select cron.schedule('reset-usage', '0 0 1 \* \*', 'select reset\_monthly\_usage()');
```

Or call it from an external cron service like cron-job.org hitting a protected API route.

\---

## Connecting the mobile app

When the React Native app is built, it uses the same Supabase project.

* Auth: `@supabase/supabase-js` with AsyncStorage on mobile
* Usage: reads same `profiles` table → limits are synced automatically
* Billing: RevenueCat SDK → on successful purchase, call your API to set `is\_pro = true`

\---

## Revenue projections

|Users|MRR|
|-|-|
|10 Pro|$290|
|50 Pro|$1,450|
|100 Pro|$2,900|
|500 Pro|$14,500|

Claude API cost at 500 Pro users (heavy usage): \~$200-400/month.
Net margin at 500 users: \~$14,100-14,300/month.

\---

## File structure

```
realtyai/
├── pages/
│   ├── index.js          # Landing page
│   ├── login.js          # Magic link login
│   ├── signup.js         # Signup
│   ├── app.js            # Dashboard (auth-gated)
│   ├── success.js        # Post-payment confirmation
│   └── api/
│       ├── generate/
│       │   ├── listing.js    # Listing generation + usage gate
│       │   ├── cma.js        # CMA generation + usage gate
│       │   └── openhouse.js  # Follow-up generation + usage gate
│       └── billing/
│           ├── checkout.js   # Stripe checkout session
│           └── webhook.js    # Stripe webhook → flip is\_pro
├── components/
│   ├── ListingTool.js    # Listing generator UI
│   ├── CMATool.js        # CMA report UI
│   ├── OpenHouseTool.js  # Open house follow-up UI
│   └── UpgradeModal.js   # Paywall modal
├── lib/
│   ├── supabase.js       # DB clients
│   └── usage.js          # Freemium gate helpers
├── styles/
│   └── globals.css       # Design system
├── supabase-schema.sql   # Run once in Supabase
├── .env.local.example    # Copy → .env.local
├── next.config.js
├── tailwind.config.js
└── package.json
```...

