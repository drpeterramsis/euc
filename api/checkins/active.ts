import { kv } from "@vercel/kv";

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// GET /api/checkins/active?role={role}&trip=departure
export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    const role = req.query.role;
    const trip = req.query.trip;

    if (!role || typeof role !== "string" || !role.trim()) {
      return res.status(400).json({ error: "role is required" });
    }

    if (!trip || typeof trip !== "string" || !trip.trim()) {
      return res.status(400).json({ error: "trip is required" });
    }

    const tripClean = trip.trim();
    const roleClean = role.trim();

    // Read IDs from set index checkins:trip:{trip}
    const ids: string[] = await kv.smembers(`checkins:trip:${tripClean}`) || [];
    const checkins: any[] = [];

    for (const id of ids) {
      const checkin: any = await kv.get(`checkin:${id}`);
      if (checkin) {
        if (checkin.active === true && Array.isArray(checkin.rolesAllowed) && checkin.rolesAllowed.includes(roleClean)) {
          // Check if user has already responded to this check-in
          // We don't do that check inside active, but the frontend needs to know or we can let active list them
          checkins.push(checkin);
        }
      }
    }

    // Sort by createdAt desc if possible
    checkins.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    return res.status(200).json({ checkins });
  } catch (err: any) {
    console.error("Error retrieving active check-ins:", err);
    return res.status(500).json({ error: err.message || "Failed to retrieve active check-ins" });
  }
}
