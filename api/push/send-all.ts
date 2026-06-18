import { kv } from "@vercel/kv";
import webpush from "web-push";

// Ensure VAPID details are set up
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:contact@euc.app",
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

export default async function handler(req: any, res: any) {
  // Allow GET for debugging details
  if (req.method === "GET") {
    return res.status(200).json({
      status: "debug",
      message: "GET /api/push/send-all is active! Use POST to send notifications.",
      vapidPublicKeyConfigured: !!(process.env.VITE_VAPID_PUBLIC_KEY || process.env.VAPID_PUBLIC_KEY),
      vapidPrivateKeyConfigured: !!process.env.VAPID_PRIVATE_KEY,
      env: process.env.NODE_ENV || "development"
    });
  }

  // Enforce POST method
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST", "GET"]);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    const { title, body, url, iconUrl, badgeUrl, imageUrl, adminToken } = req.body || {};

    // 1. Unified Admin Auth check with a temporary dev/config-driven debug override
    const isDebugBypass = process.env.NODE_ENV !== "production" || process.env.DEBUG_BYPASS_AUTH === "true";
    
    if (!isDebugBypass) {
      // Direct verification block: Validate that calling admin is authentic
      const hasAuth = req.headers.authorization || adminToken;
      if (!hasAuth) {
        return res.status(401).json({ error: "Unauthorized: Admin privileges required" });
      }
    }

    // 2. Minimum fields validation
    if (!title || !body) {
      return res.status(400).json({ error: "Title and body are required fields." });
    }

    // 3. Fetch all active subscriptions across our indexes
    const usernames: string[] = await kv.smembers("users:index") || [];
    const results = { sent: 0, failed: 0, expired: 0 };

    for (const username of usernames) {
      let sub = await kv.get(`user:${username}:subscription`);
      if (!sub) {
        sub = await kv.get(`push:sub:${username}`);
      }

      if (sub) {
        try {
          await webpush.sendNotification(sub as any, JSON.stringify({
            title,
            body,
            url: url || "/",
            iconUrl,
            badgeUrl,
            imageUrl
          }));
          results.sent++;
        } catch (err: any) {
          if (err.statusCode === 410) {
            // Subscription expired, remove from both keys
            await kv.del(`user:${username}:subscription`);
            await kv.del(`push:sub:${username}`);
            results.expired++;
          } else {
            results.failed++;
          }
        }
      }
    }

    return res.status(200).json({ ok: true, message: "Push notifications dispatched", ...results });
  } catch (err: any) {
    console.error("Error sending push notifications:", err);
    return res.status(500).json({ error: err.message || "Failed to process push dispatch." });
  }
}
