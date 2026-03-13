import { cookies } from 'next/headers';
import { getDb } from '@/lib/db';

/**
 * Verify the admin/staff session from the antico_session cookie.
 * Returns the staff record if authenticated, null otherwise.
 */
export async function getStaffFromSession() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('antico_session')?.value;
    if (!token) return null;

    const decoded = Buffer.from(token, 'base64').toString();
    const parts = decoded.split(':');
    if (parts.length < 2) return null;

    const staffId = parseInt(parts[0]);
    if (isNaN(staffId) || staffId <= 0) return null;

    const db = getDb();
    const staff = db.prepare('SELECT id, username, name, role FROM staff WHERE id = ?').get(staffId);
    return staff || null;
  } catch {
    return null;
  }
}

/**
 * In-memory rate limiter.
 * Tracks request counts per key within a sliding time window.
 * 
 * Usage:
 *   if (rateLimiter.isLimited(clientIP)) {
 *     return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
 *   }
 */
class RateLimiter {
  constructor({ windowMs = 60000, maxRequests = 20 } = {}) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
    this.hits = new Map(); // key -> { count, resetAt }
  }

  isLimited(key) {
    const now = Date.now();
    const entry = this.hits.get(key);

    if (!entry || now > entry.resetAt) {
      this.hits.set(key, { count: 1, resetAt: now + this.windowMs });
      return false;
    }

    entry.count++;
    if (entry.count > this.maxRequests) {
      return true;
    }
    return false;
  }

  // Cleanup old entries periodically (call every ~5 min)
  cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.hits) {
      if (now > entry.resetAt) this.hits.delete(key);
    }
  }
}

// Singleton rate limiters for different endpoints
// Gift card lookup: 20 attempts per minute per IP
export const gcLookupLimiter = new RateLimiter({ windowMs: 60000, maxRequests: 20 });

// Gift card redeem: 10 attempts per minute per IP (stricter)
export const gcRedeemLimiter = new RateLimiter({ windowMs: 60000, maxRequests: 10 });

// Gift card purchase: 5 per minute per IP
export const gcPurchaseLimiter = new RateLimiter({ windowMs: 60000, maxRequests: 5 });

// Cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    gcLookupLimiter.cleanup();
    gcRedeemLimiter.cleanup();
    gcPurchaseLimiter.cleanup();
  }, 5 * 60 * 1000);
}

/**
 * Extract a client identifier for rate limiting.
 * Uses X-Forwarded-For header (set by proxies/Vercel), falls back to a generic key.
 */
export function getClientKey(request) {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp;
  return 'unknown-client';
}
