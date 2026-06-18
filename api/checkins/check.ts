import { kv } from "@vercel/kv";

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// POST /api/checkins/check
// Body: { checkinId: string, username: string, fullname: string, role: string }
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

    const { checkinId, username, fullname, role } = body || {};

    if (!checkinId || typeof checkinId !== "string" || !checkinId.trim()) {
      return res.status(400).json({ error: "checkinId is required" });
    }

    if (!username || typeof username !== "string" || !username.trim() || /\s/.test(username.trim())) {
      return res.status(400).json({ error: "username is required and must not contain spaces" });
    }

    if (!fullname || typeof fullname !== "string" || !fullname.trim()) {
      return res.status(400).json({ error: "fullname is required" });
    }

    if (!role || typeof role !== "string" || !role.trim()) {
      return res.status(400).json({ error: "role is required" });
    }

    const checkinIdClean = checkinId.trim();
    const lowerUsername = username.trim().toLowerCase();
    const roleClean = role.trim().toLowerCase();

    // Ensure check-in exists and is active
    const checkin: any = await kv.get(`checkin:${checkinIdClean}`);
    if (!checkin) {
      return res.status(404).json({ error: "Check-in not found" });
    }

    if (checkin.active !== true) {
      return res.status(409).json({ error: "Check-in is no longer active" });
    }

    // Ensure role is allowed
    const allowedRoles = Array.isArray(checkin.rolesAllowed)
      ? checkin.rolesAllowed.map((r: any) => String(r).trim().toLowerCase())
      : [];

    if (!allowedRoles.includes(roleClean) && roleClean !== "admin") {
      return res.status(403).json({ error: "Your role is not authorized to respond to this check-in" });
    }

    // Auto-create user row if not indexed
    const userExists = await kv.sismember("users:index", lowerUsername);
    if (!userExists) {
      const userData = {
        username: lowerUsername,
        fullname: fullname.trim(),
        role: role.trim()
      };
      await kv.hset(`user:${lowerUsername}`, userData);
      await kv.sadd("users:index", lowerUsername);
    }

    // Add to KV Set: checkin:{id}:users
    const isNew = await kv.sadd(`checkin:${checkinIdClean}:users`, lowerUsername);
    if (!isNew) {
      return res.status(409).json({ error: "Conflict: Already checked-in" });
    }

    return res.status(200).json({ ok: true });
  } catch (err: any) {
    console.error("Error executing check-in:", err);
    return res.status(500).json({ error: err.message || "Failed to submit check-in response" });
  }
}
