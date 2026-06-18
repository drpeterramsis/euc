import { kv } from "@vercel/kv";
import { invalidateTripCache } from "../cacheHelper";

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// POST /api/checkins/delete
// Body: { role: string, checkinId: string }
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

    const { role, checkinId } = body || {};

    // 1) Validate admin privilege
    if (role !== "admin") {
      return res.status(403).json({ error: "Forbidden: Only administrators can delete check-ins." });
    }

    if (!checkinId || typeof checkinId !== "string" || !checkinId.trim()) {
      return res.status(400).json({ error: "checkinId is required" });
    }

    const id = checkinId.trim();

    // 2) Load check-in to retrieve categoryId and tripId
    const checkinKey = `checkin:${id}`;
    const checkin: any = await kv.get(checkinKey);
    if (!checkin) {
      return res.status(404).json({ error: "Check-in not found" });
    }

    const categoryId = checkin.categoryId;
    const tripId = checkin.tripId || "departure";

    // 3) Remove from set checkins:cat:{categoryId}
    if (categoryId) {
      await kv.srem(`checkins:cat:${categoryId}`, id);
    }

    // 4) Delete checkin record and checkin responses set
    await kv.del(checkinKey);
    await kv.del(`checkin:${id}:users`);

    // 5) Invalidate cache
    await invalidateTripCache(tripId);

    return res.status(200).json({ ok: true });
  } catch (err: any) {
    console.error("Error deleting check-in:", err);
    return res.status(500).json({ error: err.message || "Failed to delete check-in" });
  }
}
