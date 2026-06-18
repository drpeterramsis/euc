import { kv } from "@vercel/kv";
import { invalidateTripCache } from "../cacheHelper";

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// POST /api/checkins/update
// Body: { role: string, checkinId: string, patch: { title?: string, description?: string, buttonTitle?: string, rolesAllowed?: string[], active?: boolean } }
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

    const { role, checkinId, patch } = body || {};

    // 1) Validate admin privilege
    if (role !== "admin") {
      return res.status(403).json({ error: "Forbidden: Only administrators can update check-ins." });
    }

    if (!checkinId || typeof checkinId !== "string" || !checkinId.trim()) {
      return res.status(400).json({ error: "checkinId is required" });
    }

    if (!patch || typeof patch !== "object") {
      return res.status(400).json({ error: "patch object is required" });
    }

    // 2) Validate check-in exists
    const checkinKey = `checkin:${checkinId.trim()}`;
    const checkin: any = await kv.get(checkinKey);
    if (!checkin) {
      return res.status(404).json({ error: "Check-in not found" });
    }

    // 3) Validate fields if provided in patch
    if (patch.title !== undefined) {
      if (typeof patch.title !== "string" || !patch.title.trim()) {
        return res.status(400).json({ error: "title must be a non-empty string" });
      }
      checkin.title = patch.title.trim();
    }

    if (patch.buttonTitle !== undefined) {
      if (typeof patch.buttonTitle !== "string" || !patch.buttonTitle.trim()) {
        return res.status(400).json({ error: "buttonTitle must be a non-empty string" });
      }
      checkin.buttonTitle = patch.buttonTitle.trim();
    }

    if (patch.rolesAllowed !== undefined) {
      if (!Array.isArray(patch.rolesAllowed) || patch.rolesAllowed.length === 0) {
        return res.status(400).json({ error: "rolesAllowed must be a non-empty array of strings" });
      }
      checkin.rolesAllowed = patch.rolesAllowed.map((r: any) => String(r).trim().toLowerCase());
    }

    if (patch.description !== undefined) {
      checkin.description = typeof patch.description === "string" ? patch.description.trim() : "";
    }

    if (patch.active !== undefined) {
      checkin.active = !!patch.active;
    }

    // 4) Save back to KV store
    await kv.set(checkinKey, checkin);

    // 5) Invalidate cache
    const tripId = checkin.tripId || "departure";
    await invalidateTripCache(tripId);

    return res.status(200).json({ ok: true });
  } catch (err: any) {
    console.error("Error updating check-in:", err);
    return res.status(500).json({ error: err.message || "Failed to update check-in" });
  }
}
