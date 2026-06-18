import { kv } from "@vercel/kv";
import { invalidateTripCache } from "../cacheHelper";

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// POST /api/checkinCats/update
// Body: { role: string, catId: string, patch: { emoji?: string, title?: string, details?: string, active?: boolean } }
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

    const { role, catId, patch } = body || {};

    // 1) Validate admin role privilege
    if (role !== "admin") {
      return res.status(403).json({ error: "Forbidden: Only administrators can update categories." });
    }

    if (!catId || typeof catId !== "string" || !catId.trim()) {
      return res.status(400).json({ error: "catId is required and must be a non-empty string" });
    }

    if (!patch || typeof patch !== "object") {
      return res.status(400).json({ error: "patch object is required" });
    }

    // 2) Validate category exists
    const categoryKey = `checkinCat:${catId.trim()}`;
    const category: any = await kv.get(categoryKey);
    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    // 3) Validate and apply patch fields
    if (patch.title !== undefined) {
      if (typeof patch.title !== "string" || !patch.title.trim()) {
        return res.status(400).json({ error: "title must be a non-empty string if provided" });
      }
      category.title = patch.title.trim();
    }

    if (patch.emoji !== undefined) {
      category.emoji = typeof patch.emoji === "string" ? patch.emoji.trim() : "";
    }

    if (patch.details !== undefined) {
      category.details = typeof patch.details === "string" ? patch.details.trim() : "";
    }

    if (patch.active !== undefined) {
      category.active = !!patch.active;
    }

    // 4) Write-modify-read update back to KV store
    await kv.set(categoryKey, category);

    // 5) Invalidate cache for this category's tripId
    const tripId = category.tripId || "departure";
    await invalidateTripCache(tripId);

    return res.status(200).json({ ok: true });
  } catch (err: any) {
    console.error("Error updating checkinCat:", err);
    return res.status(500).json({ error: err.message || "Failed to update category" });
  }
}
