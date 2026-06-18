import { kv } from "@vercel/kv";
import { invalidateTripCache } from "../cacheHelper";

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// POST /api/trips/update
// Body: { role: "admin", tripId: string, patch: { title?: string, active?: boolean } }
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

    const { role, tripId, patch } = body || {};

    if (role !== "admin") {
      return res.status(403).json({ error: "Forbidden: Admin privilege required" });
    }

    if (!tripId || typeof tripId !== "string" || !tripId.trim()) {
      return res.status(400).json({ error: "tripId is required" });
    }

    if (!patch || typeof patch !== "object") {
      return res.status(400).json({ error: "patch object is required" });
    }

    const cleanId = tripId.trim();
    const tripKey = `trip:${cleanId}`;

    const trip: any = await kv.get(tripKey);
    if (!trip) {
      return res.status(404).json({ error: "Trip not found" });
    }

    // Apply patch
    if (patch.title !== undefined) {
      if (typeof patch.title !== "string" || !patch.title.trim()) {
        return res.status(400).json({ error: "title must be a non-empty string" });
      }
      trip.title = patch.title.trim();
    }

    if (patch.active !== undefined) {
      trip.active = !!patch.active;
    }

    await kv.set(tripKey, trip);

    // Invalidate cached endpoints for this trip
    await invalidateTripCache(cleanId);

    return res.status(200).json({ ok: true });
  } catch (err: any) {
    console.error("Error updating trip:", err);
    return res.status(500).json({ error: err.message || "Failed to update trip" });
  }
}
