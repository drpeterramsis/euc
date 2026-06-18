import { kv } from "@vercel/kv";
import crypto from "crypto";
import { invalidateTripCache } from "../cacheHelper";

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// POST /api/checkins/create
// Body: { role: string, tripId: string, categoryId: string, title: string, description: string, buttonTitle: string, rolesAllowed: string[] }
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

    const { role, tripId, categoryId, title, description, buttonTitle, rolesAllowed } = body || {};

    // Validate admin privilege
    if (role !== "admin") {
      return res.status(403).json({ error: "Forbidden: Only administrators can create check-ins." });
    }

    if (!tripId || typeof tripId !== "string" || !tripId.trim()) {
      return res.status(400).json({ error: "tripId is required" });
    }

    const cleanTripId = tripId.trim();

    if (!categoryId || typeof categoryId !== "string" || !categoryId.trim()) {
      return res.status(400).json({ error: "categoryId is required" });
    }

    const cleanCatId = categoryId.trim();

    // Validate category exists
    const category: any = await kv.get(`checkinCat:${cleanCatId}`);
    if (!category) {
      return res.status(400).json({ error: "Category not found" });
    }

    // Ensure category is mapped to this trip
    const catTripId = category.tripId || "departure";
    if (catTripId !== cleanTripId) {
      return res.status(400).json({ error: `Category trip scope mismatch: Category belongs to '${catTripId}', not '${cleanTripId}'` });
    }

    if (!title || typeof title !== "string" || !title.trim()) {
      return res.status(400).json({ error: "title is required and must be a non-empty string" });
    }

    if (!buttonTitle || typeof buttonTitle !== "string" || !buttonTitle.trim()) {
      return res.status(400).json({ error: "buttonTitle is required and must be a non-empty string" });
    }

    if (!Array.isArray(rolesAllowed) || rolesAllowed.length === 0) {
      return res.status(400).json({ error: "rolesAllowed must be a non-empty array of strings" });
    }

    const id = crypto.randomUUID();
    const checkin = {
      id,
      tripId: cleanTripId,
      categoryId: cleanCatId,
      title: title.trim(),
      description: typeof description === "string" ? description.trim() : "",
      buttonTitle: buttonTitle.trim(),
      rolesAllowed: rolesAllowed.map((r: any) => String(r).trim().toLowerCase()),
      active: true,
      createdAt: Date.now()
    };

    // Store checkin:{id} JSON
    await kv.set(`checkin:${id}`, checkin);
    
    // Add to categories index
    await kv.sadd(`checkins:cat:${cleanCatId}`, id);

    // Invalidate cached results for this trip
    await invalidateTripCache(cleanTripId);

    return res.status(201).json({ id });
  } catch (err: any) {
    console.error("Error creating check-in:", err);
    return res.status(500).json({ error: err.message || "Failed to create check-in" });
  }
}
