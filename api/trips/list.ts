import { kv } from "@vercel/kv";

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// GET /api/trips/list
export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    let tripIds: string[] = await kv.smembers("trips:index") || [];

    // Bootstrap default departure trip if the trips list is empty
    if (tripIds.length === 0) {
      const defaultId = "departure";
      const defaultTrip = {
        id: defaultId,
        title: "Departure Trip (Prague)",
        active: true,
        createdAt: 1779176556000
      };
      await kv.set(`trip:${defaultId}`, defaultTrip);
      await kv.sadd("trips:index", defaultId);
      tripIds = [defaultId];

      // Also migration of older checkinCats list to this trip if empty
      const existingCatsIndex = await kv.smembers("checkinCats:trip:departure") || [];
      if (existingCatsIndex.length === 0) {
        // Let's see if we can find older general categories or if we need to copy them
        // For older records we may find category checkinCats:trip:departure if loaded earlier.
      }
    }

    const trips: any[] = [];
    for (const id of tripIds) {
      const trip: any = await kv.get(`trip:${id}`);
      if (trip) {
        trips.push(trip);
      }
    }

    // Sort by createdAt desc if possible
    trips.sort((a, b) => {
      const timeA = a.createdAt || 0;
      const timeB = b.createdAt || 0;
      return timeB - timeA;
    });

    return res.status(200).json({ trips });
  } catch (err: any) {
    console.error("Error listing trips:", err);
    return res.status(500).json({ error: err.message || "Failed to list trips" });
  }
}
