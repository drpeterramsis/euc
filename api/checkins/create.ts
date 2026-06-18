import { kv } from "@vercel/kv";
import crypto from "crypto";

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// POST /api/checkins/create
// Headers: x-admin-key
// Body: { "title": string, "rolesAllowed": string[], "trip": "departure" }
export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    const adminKey = req.headers["x-admin-key"] || req.headers["X-Admin-Key"] || req.headers["x-admin-key".toLowerCase()];
    const expectedKey = process.env.ADMIN_KEY;

    if (!adminKey || !expectedKey || adminKey !== expectedKey) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    let body = req.body;
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch (e) {
        return res.status(400).json({ error: "Invalid JSON body" });
      }
    }

    const { title, rolesAllowed, trip } = body || {};

    if (!title || typeof title !== "string" || !title.trim()) {
      return res.status(400).json({ error: "title is required and must be a string" });
    }

    if (!Array.isArray(rolesAllowed) || rolesAllowed.length === 0) {
      return res.status(400).json({ error: "rolesAllowed must be a non-empty array of strings" });
    }

    if (trip !== "departure") {
      return res.status(400).json({ error: "trip must be 'departure'" });
    }

    const id = crypto.randomUUID();
    const checkin = {
      id,
      title: title.trim(),
      rolesAllowed: rolesAllowed.map((r: any) => String(r).trim()),
      trip,
      active: true,
      createdAt: Date.now()
    };

    // Store JSON in KV
    await kv.set(`checkin:${id}`, checkin);
    // Add to trip index set
    await kv.sadd(`checkins:trip:${trip}`, id);

    return res.status(201).json({ id });
  } catch (err: any) {
    console.error("Error creating check-in:", err);
    return res.status(500).json({ error: err.message || "Failed to create check-in" });
  }
}
