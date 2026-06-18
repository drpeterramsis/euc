import { kv } from "@vercel/kv";

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// GET /api/checkins/activeByTrip?trip=departure&role={userRole}&username={username}
export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    const trip = req.query.trip || "departure";
    const role = req.query.role;
    const username = req.query.username;

    if (!role || typeof role !== "string") {
      return res.status(400).json({ error: "role parameter is required" });
    }
    if (!username || typeof username !== "string") {
      return res.status(400).json({ error: "username parameter is required" });
    }

    if (trip !== "departure") {
      return res.status(400).json({ error: "Only 'departure' trip is supported" });
    }

    const roleClean = role.trim().toLowerCase();
    const usernameClean = username.trim().toLowerCase();

    // Load active categories
    const catIds: string[] = await kv.smembers("checkinCats:trip:departure") || [];
    const categoriesList: any[] = [];

    for (const catId of catIds) {
      const cat: any = await kv.get(`checkinCat:${catId}`);
      if (cat && cat.active === true) {
        categoriesList.push(cat);
      }
    }

    // Sort categories by creation timestamp (or custom sorting if needed)
    categoriesList.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    const enrichedCategories: any[] = [];
    let totalPending = 0;

    for (const cat of categoriesList) {
      const checkinIds: string[] = await kv.smembers(`checkins:cat:${cat.id}`) || [];
      const checkins: any[] = [];
      let pendingCount = 0;

      for (const checkinId of checkinIds) {
        const checkin: any = await kv.get(`checkin:${checkinId}`);
        if (checkin && checkin.active === true) {
          const allowedRoles = Array.isArray(checkin.rolesAllowed)
            ? checkin.rolesAllowed.map((r: any) => String(r).trim().toLowerCase())
            : [];

          // Enforce role permission: user can access if their role is in allowedRoles, or they are an admin
          if (allowedRoles.includes(roleClean) || roleClean === "admin") {
            // Compute user completion status
            const checked = await kv.sismember(`checkin:${checkinId}:users`, usernameClean) ? true : false;
            
            checkins.push({
              id: checkin.id,
              categoryId: checkin.categoryId,
              title: checkin.title,
              description: checkin.description || "",
              buttonTitle: checkin.buttonTitle,
              rolesAllowed: checkin.rolesAllowed,
              checked
            });

            if (!checked) {
              pendingCount++;
            }
          }
        }
      }

      // Sort check-ins within the category by createdAt desc/asc
      checkins.sort((a, b) => {
        // We can load or assume creation order, default to sort by id or length
        return a.title.localeCompare(b.title);
      });

      enrichedCategories.push({
        id: cat.id,
        emoji: cat.emoji || "",
        title: cat.title,
        details: cat.details || "",
        checkins,
        pendingCount
      });

      totalPending += pendingCount;
    }

    return res.status(200).json({
      categories: enrichedCategories,
      totalPending
    });
  } catch (err: any) {
    console.error("Error in activeByTrip API:", err);
    return res.status(500).json({ error: err.message || "Failed to retrieve check-ins status" });
  }
}
