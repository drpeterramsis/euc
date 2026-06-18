import { kv } from "@vercel/kv";

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// POST /api/trips/create
// Body: { role: "admin", tripId: string, title: string }
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

    const { role, tripId, title } = body || {};

    if (role !== "admin") {
      return res.status(403).json({ error: "Forbidden: Admin privilege required" });
    }

    if (!tripId || typeof tripId !== "string" || !tripId.trim()) {
      return res.status(400).json({ error: "tripId is required and must be a non-empty string" });
    }

    // Validate slug (letters/numbers/dash/underscore)
    const slugRegex = /^[a-zA-Z0-9\-_]+$/;
    const cleanId = tripId.trim();
    if (!slugRegex.test(cleanId)) {
      return res.status(400).json({ error: "tripId must only contain alphanumeric characters, dashes, or underscores" });
    }

    if (!title || typeof title !== "string" || !title.trim()) {
      return res.status(400).json({ error: "title is required and must be a non-empty string" });
    }

    // Check if trip already exists
    const tripKey = `trip:${cleanId}`;
    const existing = await kv.get(tripKey);
    if (existing) {
      return res.status(409).json({ error: "Conflict: Tripy segment already exists under this ID" });
    }

    const tripData = {
      id: cleanId,
      title: title.trim(),
      active: true,
      createdAt: Date.now()
    };

    // Store in KV
    await kv.set(tripKey, tripData);
    await kv.sadd("trips:index", cleanId);

    return res.status(201).json({ id: cleanId });
  } catch (err: any) {
    console.error("Error creating trip:", err);
    return res.status(500).json({ error: err.message || "Failed to create trip" });
  }
}
