import { kv } from "@vercel/kv";
import { trackCacheKey } from "../cacheHelper";

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// GET /api/checkins/activeByTrip?tripId={tripId}&role={userRole}&username={username}
export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    const tripId = (req.query.tripId || req.query.trip || "departure").trim();
    const role = req.query.role;
    const username = req.query.username;

    if (!role || typeof role !== "string") {
      return res.status(400).json({ error: "role parameter is required" });
    }
    if (!username || typeof username !== "string") {
      return res.status(400).json({ error: "username parameter is required" });
    }

    const roleClean = role.trim().toLowerCase();
    const usernameClean = username.trim().toLowerCase();

    // 1) Serve from Cache if hit (Skip cache for admin to allow real-time reactive editing feedback)
    const cacheKey = `cache:checkins:activeByTrip:${tripId}:role:${roleClean}:user:${usernameClean}`;
    if (roleClean !== "admin") {
      const cachedData = await kv.get(cacheKey);
      if (cachedData) {
        const parsed = typeof cachedData === "string" ? JSON.parse(cachedData) : cachedData;
        return res.status(200).json(parsed);
      }
    }

    // 2) Validate trip existence and status
    const trip: any = await kv.get(`trip:${tripId}`);
    if (!trip) {
      return res.status(404).json({ error: `Trip '${tripId}' not found.` });
    }

    if (trip.active !== true && roleClean !== "admin") {
      return res.status(409).json({ error: `Trip '${trip.title}' is inactive.` });
    }

    // 3) Load active categories scoped to this trip
    const catIds: string[] = await kv.smembers(`checkinCats:trip:${tripId}`) || [];
    const categoriesList: any[] = [];

    for (const catId of catIds) {
      const cat: any = await kv.get(`checkinCat:${catId}`);
      if (cat) {
        const isActiveCat = cat.active === undefined || cat.active === true;
        // Normal user only sees active categories, Admin sees both
        if (isActiveCat || roleClean === "admin") {
          categoriesList.push(cat);
        }
      }
    }

    // Sort categories by creation timestamp (newest first)
    categoriesList.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    const enrichedCategories: any[] = [];
    let totalPending = 0;

    for (const cat of categoriesList) {
      const checkinIds: string[] = await kv.smembers(`checkins:cat:${cat.id}`) || [];
      const checkins: any[] = [];
      let pendingCount = 0;

      for (const checkinId of checkinIds) {
        const checkin: any = await kv.get(`checkin:${checkinId}`);
        if (checkin) {
          const isActiveCheckin = checkin.active === undefined || checkin.active === true;
          // Normal user only sees active check-ins, Admin sees all
          if (isActiveCheckin || roleClean === "admin") {
            const allowedRoles = Array.isArray(checkin.rolesAllowed)
              ? checkin.rolesAllowed.map((r: any) => String(r).trim().toLowerCase())
              : [];

            // Enforce role permission: user can access if their role is in allowedRoles, or they are an admin
            if (allowedRoles.includes(roleClean) || roleClean === "admin") {
              const checked = await kv.sismember(`checkin:${checkinId}:users`, usernameClean) ? true : false;
              
              checkins.push({
                id: checkin.id,
                tripId: checkin.tripId || tripId,
                categoryId: checkin.categoryId,
                title: checkin.title,
                description: checkin.description || "",
                buttonTitle: checkin.buttonTitle,
                rolesAllowed: checkin.rolesAllowed,
                active: isActiveCheckin,
                checked
              });

              if (!checked && isActiveCheckin) {
                pendingCount++;
              }
            }
          }
        }
      }

      // Sort check-ins within the category by title
      checkins.sort((a, b) => a.title.localeCompare(b.title));

      enrichedCategories.push({
        id: cat.id,
        emoji: cat.emoji || "",
        title: cat.title,
        details: cat.details || "",
        active: cat.active === undefined || cat.active === true,
        checkins,
        pendingCount
      });

      totalPending += pendingCount;
    }

    // 4) Assemble structural payload
    const responseData = {
      trip: {
        id: trip.id,
        title: trip.title,
        active: trip.active
      },
      categories: enrichedCategories,
      totalPending
    };

    // 5) Save into the TTL cache and track key for admin actions
    if (roleClean !== "admin") {
      await kv.setex(cacheKey, 10, JSON.stringify(responseData));
      await trackCacheKey(tripId, cacheKey);
    }

    return res.status(200).json(responseData);
  } catch (err: any) {
    console.error("Error in activeByTrip API:", err);
    return res.status(500).json({ error: err.message || "Failed to retrieve check-ins status" });
  }
}
