export const FREE_LIMITS = {
  listing: 3,
  cma: 1,
  openhouse: 10,
}

export const TOOLS = ['listing', 'cma', 'openhouse']

export function canUse(profile, tool) {
  if (!profile) return false
  if (profile.is_pro) return true
  return (profile[`usage_${tool}`] || 0) < FREE_LIMITS[tool]
}

export function usageLeft(profile, tool) {
  if (!profile) return 0
  if (profile.is_pro) return Infinity
  return Math.max(0, FREE_LIMITS[tool] - (profile[`usage_${tool}`] || 0))
}

export function usagePct(profile, tool) {
  if (!profile || profile.is_pro) return 0
  return Math.min(100, ((profile[`usage_${tool}`] || 0) / FREE_LIMITS[tool]) * 100)
}
