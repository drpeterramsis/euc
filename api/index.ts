import { kv } from "@vercel/kv";

/**
 * Helper to invalidate cached responses for a specific trip.
 */
async function invalidateTripCache(tripId: string) {
  if (!tripId) return;
  try {
    const cacheKeysKey = `cacheKeys:trip:${tripId}`;
    const keys: string[] = await kv.smembers(cacheKeysKey) || [];
    if (keys && keys.length > 0) {
      await Promise.all(keys.map(key => kv.del(key)));
    }
    await kv.del(cacheKeysKey);
  } catch (err) {
    console.error("Error invalidating trip cache:", err);
  }
}

export default async function handler(req: any, res: any) {
  const method = req.method;
  
  // Extract configuration path
  let path = "";
  let query = req.query || {};
  let body = req.body || {};

  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch (e) {
      // Ignored
    }
  }

  if (method === "GET") {
    path = (query.path || "") as string;
  } else {
    path = (body.path || "") as string;
  }

  try {
    // ----------------------------------------------------
    // GET ACTIONS
    // ----------------------------------------------------
    if (method === "GET") {
      if (path === "trips/list") {
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

      if (path === "checkins/active") {
        const { role, trip } = query;
        const catIds: string[] = await kv.smembers(`checkinCats:trip:${trip}`) || [];
        const allCheckins: any[] = [];
        for (const catId of catIds) {
          const checkinIds: string[] = await kv.smembers(`checkins:cat:${catId}`) || [];
          for (const cId of checkinIds) {
            const c: any = await kv.get(`checkin:${cId}`);
            if (c && c.active && c.rolesAllowed?.includes(role)) {
              allCheckins.push(c);
            }
          }
        }
        return res.status(200).json({ checkins: allCheckins });
      }

      if (path === "checkins/activeByTrip") {
        const { tripId, role, username } = query;
        const catIds: string[] = await kv.smembers(`checkinCats:trip:${tripId}`) || [];
        const categories = await Promise.all(catIds.map(async (catId) => {
          const cat = await kv.get(`checkinCat:${catId}`) as any;
          const checkinIds: string[] = await kv.smembers(`checkins:cat:${catId}`) || [];
          const checkins = await Promise.all(checkinIds.map(async (cId) => {
            const c = await kv.get(`checkin:${cId}`) as any;
            if (!c) return null;
            const checked = await kv.sismember(`checkin:${cId}:users`, username);
            return { ...c, checked };
          }));
          return { ...cat, checkins: checkins.filter(Boolean) };
        }));
        return res.status(200).json({ categories: categories.filter(c => c && c.active !== false) });
      }

      if (path === "checkins/status") {
        const { checkinId, role } = query;
        if (role !== "admin" && role !== "staff") return res.status(403).json({ error: "Forbidden" });
        const users: string[] = await kv.smembers(`checkin:${checkinId}:users`) || [];
        return res.status(200).json({ count: users.length, usernames: users });
      }

      if (path === "categories/list") {
        const { tripId } = query;
        const catIds: string[] = await kv.smembers(`checkinCats:trip:${tripId}`) || [];
        const cats = await Promise.all(catIds.map(id => kv.get(`checkinCat:${id}`)));
        return res.status(200).json({ categories: cats.filter(Boolean) });
      }

      if (path === "pageAccess/checkins/get") {
        const config = await kv.get("setting:checkins.config") || {};
        return res.status(200).json(config);
      }
    }

    // ----------------------------------------------------
    // POST ACTIONS
    // ----------------------------------------------------
    if (method === "POST") {
      const { role } = body;

      if (path === "trips/create") {
        if (role !== "admin") return res.status(403).json({ error: "Forbidden: Admin privilege required" });
        const { tripId, title } = body;
        const tripKey = `trip:${tripId}`;
        if (await kv.get(tripKey)) return res.status(409).json({ error: "Conflict: ID exists" });
        await kv.set(tripKey, { id: tripId, title, active: true, createdAt: Date.now() });
        await kv.sadd("trips:index", tripId);
        return res.status(201).json({ id: tripId });
      }

      if (path === "trips/update") {
        if (role !== "admin") return res.status(403).json({ error: "Forbidden: Admin privilege required" });
        const { tripId, patch } = body;
        const trip: any = await kv.get(`trip:${tripId}`);
        if (!trip) return res.status(404).json({ error: "Not found" });
        Object.assign(trip, patch);
        await kv.set(`trip:${tripId}`, trip);
        await invalidateTripCache(tripId);
        return res.status(200).json({ ok: true });
      }

      if (path === "trips/delete") {
        if (role !== "admin") return res.status(403).json({ error: "Forbidden: Admin privilege required" });
        const { tripId, cascade } = body;
        await kv.srem("trips:index", tripId);
        await kv.del(`trip:${tripId}`);
        if (cascade) {
          const catIds: string[] = await kv.smembers(`checkinCats:trip:${tripId}`) || [];
          for (const catId of catIds) {
            const checkinIds: string[] = await kv.smembers(`checkins:cat:${catId}`) || [];
            await Promise.all(checkinIds.map(async (cId) => {
              await kv.del(`checkin:${cId}`);
              await kv.del(`checkin:${cId}:users`);
            }));
            await kv.del(`checkins:cat:${catId}`);
            await kv.del(`checkinCat:${catId}`);
          }
          await kv.del(`checkinCats:trip:${tripId}`);
        }
        await invalidateTripCache(tripId);
        return res.status(200).json({ ok: true });
      }

      if (path === "trips/reset") {
        if (role !== "admin") return res.status(403).json({ error: "Forbidden: Admin privilege required" });
        const { tripId } = body;
        let cleared = 0;
        const catIds: string[] = await kv.smembers(`checkinCats:trip:${tripId}`) || [];
        for (const catId of catIds) {
          const checkinIds: string[] = await kv.smembers(`checkins:cat:${catId}`) || [];
          for (const checkinId of checkinIds) {
            if (await kv.exists(`checkin:${checkinId}:users`)) {
              await kv.del(`checkin:${checkinId}:users`);
              cleared++;
            }
          }
        }
        await invalidateTripCache(tripId);
        return res.status(200).json({ ok: true, cleared });
      }

      if (path === "categories/create") {
         if (role !== "admin") return res.status(403).json({ error: "Forbidden" });
         const { tripId, title, ...data } = body;
         const newCatId = Date.now().toString();
         await kv.set(`checkinCat:${newCatId}`, { id: newCatId, tripId, title, ...data, active: true, createdAt: Date.now() });
         await kv.sadd(`checkinCats:trip:${tripId}`, newCatId);
         return res.status(201).json({ id: newCatId });
      }

      if (path === "categories/update") {
         if (role !== "admin") return res.status(403).json({ error: "Forbidden" });
         const { catId, patch } = body;
         const cat = await kv.get(`checkinCat:${catId}`) as any;
         if (!cat) return res.status(404).json({ error: "Not found" });
         await kv.set(`checkinCat:${catId}`, { ...cat, ...patch });
         return res.status(200).json({ ok: true });
      }

      if (path === "checkins/create") {
         if (role !== "admin") return res.status(403).json({ error: "Forbidden" });
         const { categoryId, ...data } = body;
         const cId = Date.now().toString();
         await kv.set(`checkin:${cId}`, { id: cId, categoryId, ...data, active: true });
         await kv.sadd(`checkins:cat:${categoryId}`, cId);
         return res.status(201).json({ id: cId });
      }

      if (path === "checkins/update") {
         if (role !== "admin") return res.status(403).json({ error: "Forbidden" });
         const { checkinId, patch } = body;
         const item = await kv.get(`checkin:${checkinId}`) as any;
         if (!item) return res.status(404).json({ error: "Not found" });
         await kv.set(`checkin:${checkinId}`, { ...item, ...patch });
         return res.status(200).json({ ok: true });
      }

      if (path === "checkins/delete") {
         if (role !== "admin") return res.status(403).json({ error: "Forbidden" });
         const { checkinId } = body;
         const item: any = await kv.get(`checkin:${checkinId}`);
         if (!item) return res.status(404).json({ error: "Not found" });
         await kv.del(`checkin:${checkinId}`);
         await kv.del(`checkin:${checkinId}:users`);
         await kv.srem(`checkins:cat:${item.categoryId}`, checkinId);
         return res.status(200).json({ ok: true });
      }

      if (path === "checkins/check") {
         const { checkinId, username } = body;
         await kv.sadd(`checkin:${checkinId}:users`, username);
         return res.status(200).json({ ok: true });
      }

      if (path === "checkins/uncheck") {
         const { checkinId, username } = body;
         await kv.srem(`checkin:${checkinId}:users`, username);
         return res.status(200).json({ ok: true });
      }

      if (path === "checkins/respond") {
         const { checkinId, username } = body;
         await kv.sadd(`checkin:${checkinId}:users`, username);
         return res.status(200).json({ ok: true });
      }

      if (path === "pageAccess/checkins/set") {
         if (role !== "admin") return res.status(403).json({ error: "Forbidden" });
         const { config } = body;
         await kv.set("setting:checkins.config", config);
         return res.status(200).json({ ok: true });
      }
    }

    return res.status(400).json({ error: "Invalid action or path" });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
