import { kv } from "@vercel/kv";
import crypto from "crypto";

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// POST /api/checkinCats/create
// Body: { emoji: string, title: string, details: string, role: string }
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

    const { emoji, title, details, role } = body || {};

    // Validate admin privilege
    if (role !== "admin") {
      return res.status(403).json({ error: "Forbidden: Only administrators can create categories." });
    }

    if (!title || typeof title !== "string" || !title.trim()) {
      return res.status(400).json({ error: "Title is required and must be a non-empty string" });
    }

    const id = crypto.randomUUID();
    const category = {
      id,
      emoji: typeof emoji === "string" ? emoji.trim() : "",
      title: title.trim(),
      details: typeof details === "string" ? details.trim() : "",
      trip: "departure",
      active: true,
      createdAt: Date.now()
    };

    // Store checkinCat:{id} JSON
    await kv.set(`checkinCat:${id}`, category);
    // Add to Set
    await kv.sadd("checkinCats:trip:departure", id);

    return res.status(201).json({ id });
  } catch (err: any) {
    console.error("Error creating checkinCat:", err);
    return res.status(500).json({ error: err.message || "Failed to create category" });
  }
}
