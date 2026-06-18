import { kv } from "@vercel/kv";
import crypto from "crypto";

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// POST /api/checkins/create
// Body: { title: string, rolesAllowed: string[], trip: "departure", role: string }
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

    const { title, rolesAllowed, trip, role } = body || {};

    // Validate admin role
    if (role !== "admin") {
      return res.status(403).json({ error: "Forbidden: Only administrators can create check-ins" });
    }

    // Validate inputs
    if (!title || typeof title !== "string" || !title.trim()) {
      return res.status(400).json({ error: "title is required and must be a non-empty string" });
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
      rolesAllowed: rolesAllowed.map((r: any) => String(r).trim().toLowerCase()),
      trip,
      active: true,
      createdAt: Date.now()
    };

    // Store checkin:{id} JSON in Vercel KV
    await kv.set(`checkin:${id}`, checkin);
    // Add checkin ID to the departure trip index Set
    await kv.sadd(`checkins:trip:${trip}`, id);

    return res.status(201).json({ id });
  } catch (err: any) {
    console.error("Error creating check-in:", err);
    return res.status(500).json({ error: err.message || "Failed to create check-in" });
  }
}
