/**
 * Sliding Window In-Memory / Distributed Rate Limiter
 * Can be backed by Upstash Redis or local memory in serverless/edge environments.
 */

interface RateLimitConfig {
  key: string;
  limit: number;
  windowSecs: number;
}

// In-memory sliding window cache (for edge/development fallback)
const memoryStore = new Map<string, number[]>();

export async function checkRateLimit({
  key,
  limit,
  windowSecs
}: RateLimitConfig): Promise<boolean> {
  const now = Date.now();
  const windowMs = windowSecs * 1000;
  const threshold = now - windowMs;

  let timestamps = memoryStore.get(key) || [];

  // Evict timestamps older than sliding window
  timestamps = timestamps.filter(ts => ts > threshold);

  if (timestamps.length >= limit) {
    memoryStore.set(key, timestamps);
    return false; // Rate limit exceeded
  }

  // Record current request
  timestamps.push(now);
  memoryStore.set(key, timestamps);

  // Periodically clean stale keys
  if (memoryStore.size > 10000) {
    for (const [k, tsList] of memoryStore.entries()) {
      if (!tsList.some(ts => ts > threshold)) {
        memoryStore.delete(k);
      }
    }
  }

  return true;
}
