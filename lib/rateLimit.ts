interface RateLimitEntry {
  count: number
  resetAt: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000 // 10 minutes
const RATE_LIMIT_MAX_REQUESTS = 30

export function checkRateLimit(identifier: string): {
  allowed: boolean
  remaining: number
  resetAt: number
} {
  const now = Date.now()
  const entry = rateLimitStore.get(identifier)

  // Clean up expired entries periodically
  if (Math.random() < 0.01) {
    cleanupExpiredEntries(now)
  }

  if (!entry || entry.resetAt < now) {
    // Create new entry
    const newEntry: RateLimitEntry = {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    }
    rateLimitStore.set(identifier, newEntry)
    return {
      allowed: true,
      remaining: RATE_LIMIT_MAX_REQUESTS - 1,
      resetAt: newEntry.resetAt,
    }
  }

  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
    }
  }

  entry.count++
  return {
    allowed: true,
    remaining: RATE_LIMIT_MAX_REQUESTS - entry.count,
    resetAt: entry.resetAt,
  }
}

function cleanupExpiredEntries(now: number): void {
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key)
    }
  }
}

export function getClientIdentifier(request: Request): string {
  // Try to get IP from various headers (Vercel, CF, etc.)
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const cfConnectingIp = request.headers.get('cf-connecting-ip')

  const ip = cfConnectingIp || realIp || forwardedFor?.split(',')[0] || 'unknown'
  return ip.trim()
}
