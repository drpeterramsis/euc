import { kv } from "@vercel/kv";
import { invalidateTripCache } from "../cacheHelper";

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// POST /api/trips/reset
// Body: { role: "admin", tripId: string }
export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    let body = req.body;
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch (e) {
        return res.status(400).json({ error: "Invalid JSON body" });
      }
    }

    const { role, tripId } = body || {};

    if (role !== "admin") {
      return res.status(403).json({ error: "Forbidden: Admin privilege required" });
    }

    if (!tripId || typeof tripId !== "string" || !tripId.trim()) {
      return res.status(400).json({ error: "tripId is required" });
    }

    const cleanId = tripId.trim();
    let clearedCount = 0;

    // Load category ids scoped to this trip
    const catIds: string[] = await kv.smembers(`checkinCats:trip:${cleanId}`) || [];
    for (const catId of catIds) {
      // Load checkin ids in this category
      const checkinIds: string[] = await kv.smembers(`checkins:cat:${catId}`) || [];
      for (const checkinId of checkinIds) {
        const responseKey = `checkin:${checkinId}:users`;
        const exists = await kv.exists(responseKey);
        if (exists) {
          await kv.del(responseKey);
          clearedCount++;
        }
      }
    }

    // Invalidate caches
    await invalidateTripCache(cleanId);

    return res.status(200).json({ ok: true, cleared: clearedCount });
  } catch (err: any) {
    console.error("Error resetting trip responses:", err);
    return res.status(500).json({ error: err.message || "Failed to reset trip response status" });
  }
}
