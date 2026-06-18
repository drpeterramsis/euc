import { kv } from "@vercel/kv";
import { invalidateTripCache } from "./cacheHelper";

export default async function handler(req: any, res: any) {
  const method = req.method;
  const action = (req.query.action || (req.body && req.body.action)) as string;

  try {
    // GET ACTIONS
    if (method === "GET") {
      if (action === "active") {
         const { role, trip } = req.query;
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
      if (action === "activeByTrip") {
         const { tripId, role, username } = req.query;
         // Simplified logic assuming trip/categories exist
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
         return res.status(200).json({ categories: categories.filter(c => c.active !== false) });
      }
      if (action === "status") {
        const { checkinId, role } = req.query;
        if (role !== "admin" && role !== "staff") return res.status(403).json({ error: "Forbidden" });
        const users: string[] = await kv.smembers(`checkin:${checkinId}:users`) || [];
        return res.status(200).json({ count: users.length, usernames: users });
      }
      if (action === "categories.list") {
        const { tripId } = req.query;
        const catIds: string[] = await kv.smembers(`checkinCats:trip:${tripId}`) || [];
        const cats = await Promise.all(catIds.map(id => kv.get(`checkinCat:${id}`)));
        return res.status(200).json({ categories: cats.filter(Boolean) });
      }
    }

    // POST ACTIONS
    if (method === "POST") {
      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      const { role, action: postAction, checkinId, catId, patch, ...data } = body;
      
      if (postAction === "categories.create") {
         if (role !== "admin") return res.status(403).json({ error: "Forbidden" });
         const newCatId = Date.now().toString();
         await kv.set(`checkinCat:${newCatId}`, { id: newCatId, ...data, active: true, createdAt: Date.now() });
         await kv.sadd(`checkinCats:trip:${data.tripId}`, newCatId);
         return res.status(201).json({ id: newCatId });
      }
      if (postAction === "categories.update") {
         if (role !== "admin") return res.status(403).json({ error: "Forbidden" });
         const cat = await kv.get(`checkinCat:${catId}`) as any;
         if (!cat) return res.status(404).json({ error: "Not found" });
         await kv.set(`checkinCat:${catId}`, { ...cat, ...patch });
         return res.status(200).json({ ok: true });
      }
      if (postAction === "checkins.create") {
         if (role !== "admin") return res.status(403).json({ error: "Forbidden" });
         const cId = Date.now().toString();
         await kv.set(`checkin:${cId}`, { id: cId, ...data, active: true });
         await kv.sadd(`checkins:cat:${data.categoryId}`, cId);
         return res.status(201).json({ id: cId });
      }
      if (postAction === "checkins.update") {
         if (role !== "admin") return res.status(403).json({ error: "Forbidden" });
         const item = await kv.get(`checkin:${checkinId}`) as any;
         if (!item) return res.status(404).json({ error: "Not found" });
         await kv.set(`checkin:${checkinId}`, { ...item, ...patch });
         return res.status(200).json({ ok: true });
      }
      if (postAction === "checkins.delete") {
         if (role !== "admin") return res.status(403).json({ error: "Forbidden" });
         const item: any = await kv.get(`checkin:${checkinId}`);
         if (!item) return res.status(404).json({ error: "Not found" });
         await kv.del(`checkin:${checkinId}`);
         await kv.del(`checkin:${checkinId}:users`);
         await kv.srem(`checkins:cat:${item.categoryId}`, checkinId);
         return res.status(200).json({ ok: true });
      }
      if (postAction === "checkins.check") {
         await kv.sadd(`checkin:${checkinId}:users`, data.username);
         return res.status(200).json({ ok: true });
      }
      if (postAction === "checkins.uncheck") {
         await kv.srem(`checkin:${checkinId}:users`, data.username);
         return res.status(200).json({ ok: true });
      }
      if (postAction === "checkins.respond") {
         await kv.sadd(`checkin:${checkinId}:users`, data.username);
         return res.status(200).json({ ok: true });
      }
      return res.status(400).json({ error: "Invalid action" });
    }
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
