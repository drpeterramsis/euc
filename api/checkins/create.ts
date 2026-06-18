import { kv } from "@vercel/kv";
import crypto from "crypto";

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// POST /api/checkins/create
// Body: { categoryId: string, title: string, description: string, buttonTitle: string, rolesAllowed: string[], role: string }
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

    const { categoryId, title, description, buttonTitle, rolesAllowed, role } = body || {};

    // Validate admin privilege
    if (role !== "admin") {
      return res.status(403).json({ error: "Forbidden: Only administrators can create check-ins." });
    }

    if (!categoryId || typeof categoryId !== "string" || !categoryId.trim()) {
      return res.status(400).json({ error: "categoryId is required" });
    }

    // Validate category exists and is active
    const category: any = await kv.get(`checkinCat:${categoryId.trim()}`);
    if (!category || category.active !== true) {
      return res.status(400).json({ error: "Category not found or inactive" });
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
      categoryId: categoryId.trim(),
      title: title.trim(),
      description: typeof description === "string" ? description.trim() : "",
      buttonTitle: buttonTitle.trim(),
      rolesAllowed: rolesAllowed.map((r: any) => String(r).trim().toLowerCase()),
      trip: "departure",
      active: true,
      createdAt: Date.now()
    };

    // Store checkin:{id} JSON
    await kv.set(`checkin:${id}`, checkin);
    // SADD checkins:cat:{categoryId} id
    await kv.sadd(`checkins:cat:${categoryId.trim()}`, id);

    return res.status(201).json({ id });
  } catch (err: any) {
    console.error("Error creating check-in:", err);
    return res.status(500).json({ error: err.message || "Failed to create check-in" });
  }
}
