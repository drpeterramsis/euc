import { kv } from "@vercel/kv";
import { invalidateTripCache } from "./cacheHelper";

export default async function handler(req: any, res: any) {
  const method = req.method;
  const action = (req.query.action || (req.body && req.body.action)) as string;

  try {
    if (method === "GET" && action === "list") {
      let tripIds: string[] = await kv.smembers("trips:index") || [];
      if (tripIds.length === 0) {
        const defaultId = "departure";
        await kv.set(`trip:${defaultId}`, { id: defaultId, title: "Departure Trip (Prague)", active: true, createdAt: 1779176556000 });
        await kv.sadd("trips:index", defaultId);
        tripIds = [defaultId];
      }
      const trips = await Promise.all(tripIds.map(id => kv.get(`trip:${id}`)));
      return res.status(200).json({ trips: trips.filter(Boolean).sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0)) });
    }

    if (method === "POST") {
      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      const { role, tripId, title, patch, cascade } = body;

      if (role !== "admin") return res.status(403).json({ error: "Forbidden: Admin privilege required" });

      if (action === "create") {
         const tripKey = `trip:${tripId}`;
         if (await kv.get(tripKey)) return res.status(409).json({ error: "Conflict: ID exists" });
         await kv.set(tripKey, { id: tripId, title, active: true, createdAt: Date.now() });
         await kv.sadd("trips:index", tripId);
         return res.status(201).json({ id: tripId });
      } else if (action === "update") {
         const trip: any = await kv.get(`trip:${tripId}`);
         if (!trip) return res.status(404).json({ error: "Not found" });
         Object.assign(trip, patch);
         await kv.set(`trip:${tripId}`, trip);
         await invalidateTripCache(tripId);
         return res.status(200).json({ ok: true });
      } else if (action === "delete") {
         await kv.srem("trips:index", tripId);
         await kv.del(`trip:${tripId}`);
         if (cascade) {
            const catIds: string[] = await kv.smembers(`checkinCats:trip:${tripId}`) || [];
            for (const catId of catIds) {
               const checkinIds: string[] = await kv.smembers(`checkins:cat:${catId}`) || [];
               await Promise.all(checkinIds.map(async (cId) => { await kv.del(`checkin:${cId}`); await kv.del(`checkin:${cId}:users`); }));
               await kv.del(`checkins:cat:${catId}`);
               await kv.del(`checkinCat:${catId}`);
            }
            await kv.del(`checkinCats:trip:${tripId}`);
         }
         await invalidateTripCache(tripId);
         return res.status(200).json({ ok: true });
      } else if (action === "reset") {
          let cleared = 0;
          const catIds: string[] = await kv.smembers(`checkinCats:trip:${tripId}`) || [];
          for (const catId of catIds) {
            const checkinIds: string[] = await kv.smembers(`checkins:cat:${catId}`) || [];
            for (const checkinId of checkinIds) {
              if (await kv.exists(`checkin:${checkinId}:users`)) { await kv.del(`checkin:${checkinId}:users`); cleared++; }
            }
          }
          await invalidateTripCache(tripId);
          return res.status(200).json({ ok: true, cleared });
      }
    }
    return res.status(400).json({ error: "Invalid action" });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
