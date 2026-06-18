import { kv } from "@vercel/kv";

/**
 * Helper to invalidate cached responses for a specific trip.
 * Maintains lists of cache keys in a set: `cacheKeys:trip:{tripId}`
 */
export async function invalidateTripCache(tripId: string) {
  if (!tripId) return;
  try {
    const cacheKeysKey = `cacheKeys:trip:${tripId}`;
    const keys: string[] = await kv.smembers(cacheKeysKey);
    if (keys && keys.length > 0) {
      await Promise.all(keys.map(key => kv.del(key)));
    }
    await kv.del(cacheKeysKey);
  } catch (err) {
    console.error("Error invalidating trip cache:", err);
  }
}

/**
 * Tracks a new cache key under the specified tripId so it can be invalidated.
 */
export async function trackCacheKey(tripId: string, cacheKey: string) {
  if (!tripId || !cacheKey) return;
  try {
    const cacheKeysKey = `cacheKeys:trip:${tripId}`;
    await kv.sadd(cacheKeysKey, cacheKey);
  } catch (err) {
    console.error("Error tracking cache key:", err);
  }
}
