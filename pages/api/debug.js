export default async function handler(req, res) {
  const { createClient } = require('@supabase/supabase-js')
  
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  // Try to verify the token if provided
  let authResult = null
  const authHeader = req.headers.authorization
  if (authHeader && url && anon) {
    const token = authHeader.replace('Bearer ', '').trim()
    const supabase = createClient(url, anon, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    })
    const { data, error } = await supabase.auth.getUser()
    authResult = { user: data?.user?.email, error: error?.message }
  }

  return res.status(200).json({
    hasUrl: !!url,
    urlPreview: url ? url.substring(0, 30) : null,
    hasAnon: !!anon,
    anonPreview: anon ? anon.substring(0, 20) : null,
    hasService: !!service,
    servicePreview: service ? service.substring(0, 20) : null,
    authResult,
  })
}
