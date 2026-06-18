import { kv } from "@vercel/kv";
import { invalidateTripCache } from "../cacheHelper";

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// POST /api/trips/delete
// Body: { role: "admin", tripId: string, cascade?: boolean }
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

    const { role, tripId, cascade } = body || {};

    if (role !== "admin") {
      return res.status(403).json({ error: "Forbidden: Admin privilege required" });
    }

    if (!tripId || typeof tripId !== "string" || !tripId.trim()) {
      return res.status(400).json({ error: "tripId is required" });
    }

    const cleanId = tripId.trim();

    // 1) Remove from trips list and destroy trip metadata
    await kv.srem("trips:index", cleanId);
    await kv.del(`trip:${cleanId}`);

    // 2) Run cascade deletions if specified
    if (cascade === true) {
      const catIds: string[] = await kv.smembers(`checkinCats:trip:${cleanId}`) || [];
      for (const catId of catIds) {
        const checkinIds: string[] = await kv.smembers(`checkins:cat:${catId}`) || [];
        for (const checkinId of checkinIds) {
          await kv.del(`checkin:${checkinId}`);
          await kv.del(`checkin:${checkinId}:users`);
        }
        await kv.del(`checkins:cat:${catId}`);
        await kv.del(`checkinCat:${catId}`);
      }
      await kv.del(`checkinCats:trip:${cleanId}`);
    }

    // 3) Evacuate cache
    await invalidateTripCache(cleanId);

    return res.status(200).json({ ok: true });
  } catch (err: any) {
    console.error("Error deleting trip:", err);
    return res.status(500).json({ error: err.message || "Failed to delete trip" });
  }
}
