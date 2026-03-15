export default async function handler(req, res) {
  const auth = req.headers.authorization
  const allHeaders = req.headers
  
  return res.status(200).json({
    hasAuthHeader: !!auth,
    authHeader: auth ? auth.substring(0, 20) + '...' : null,
    method: req.method,
    cookies: Object.keys(req.cookies || {}),
  })
}
