import { kv } from "@vercel/kv";

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// GET /api/checkinCats/list?trip=departure
export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    const trip = req.query.trip || "departure";

    if (trip !== "departure") {
      return res.status(400).json({ error: "Only 'departure' trip is supported." });
    }

    const ids: string[] = await kv.smembers("checkinCats:trip:departure") || [];
    const categories: any[] = [];

    for (const id of ids) {
      const cat: any = await kv.get(`checkinCat:${id}`);
      if (cat && cat.active === true) {
        categories.push(cat);
      }
    }

    // Sort by createdAt desc
    categories.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    return res.status(200).json({ categories });
  } catch (err: any) {
    console.error("Error listing checkinCats:", err);
    return res.status(500).json({ error: err.message || "Failed to list categories" });
  }
}
