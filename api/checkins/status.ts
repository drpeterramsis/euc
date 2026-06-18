import { kv } from "@vercel/kv";

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// GET /api/checkins/status?checkinId=...
// Headers: x-admin-key
export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    const adminKey = req.headers["x-admin-key"] || req.headers["X-Admin-Key"] || req.headers["x-admin-key".toLowerCase()];
    const expectedKey = process.env.ADMIN_KEY;

    if (!adminKey || !expectedKey || adminKey !== expectedKey) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const checkinId = req.query.checkinId;
    if (!checkinId || typeof checkinId !== "string" || !checkinId.trim()) {
      return res.status(400).json({ error: "checkinId is required" });
    }

    const checkinIdClean = checkinId.trim();

    // Verify it exists in KV
    const checkin: any = await kv.get(`checkin:${checkinIdClean}`);
    if (!checkin) {
      return res.status(404).json({ error: "Check-in not found" });
    }

    const usernames: string[] = await kv.smembers(`checkin:${checkinIdClean}:users`) || [];

    return res.status(200).json({
      count: usernames.length,
      usernames
    });
  } catch (err: any) {
    console.error("Error getting check-in status:", err);
    return res.status(500).json({ error: err.message || "Failed to get check-in status" });
  }
}
