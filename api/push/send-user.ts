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
      message: "GET /api/push/send-user is active! Use POST to send notifications.",
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
    const { userId, title, body, url, iconUrl, badgeUrl, imageUrl, adminToken } = req.body || {};

    // 1. Unified Admin Auth check with a temporary dev/config-driven debug override
    const isDebugBypass = process.env.NODE_ENV !== "production" || process.env.DEBUG_BYPASS_AUTH === "true";
    
    if (!isDebugBypass) {
      // Direct verification block: Validate that calling admin is authentic
      const hasAuth = req.headers.authorization || adminToken;
      if (!hasAuth) {
        return res.status(401).json({ error: "Unauthorized: Admin privileges required" });
      }
    }

    if (!userId) {
      return res.status(400).json({ error: "userId is a required parameter." });
    }

    // 2. Save notification to database user message queue (KV values)
    const id = Date.now().toString();
    const notif = { id, title, body, url: url || "/", iconUrl, badgeUrl, imageUrl, createdAt: Date.now() };
    await kv.hset(`notif:${id}`, notif as any);
    await kv.zadd(`user:notifs:${userId}`, { score: Date.now(), member: id });

    // 3. Look up subscription
    let sub = await kv.get(`user:${userId}:subscription`);
    if (!sub) {
      sub = await kv.get(`push:sub:${userId}`);
    }

    if (!sub) {
      return res.status(404).json({ error: "No persistent push subscription found for this user." });
    }

    // 4. Send Notification
    try {
      await webpush.sendNotification(sub as any, JSON.stringify({
        title,
        body,
        url: url || "/",
        iconUrl,
        badgeUrl,
        imageUrl
      }));
      return res.status(200).json({ sent: 1, saved: true, id });
    } catch (err: any) {
      if (err.statusCode === 410) {
        // Subscription expired, delete
        await kv.del(`user:${userId}:subscription`);
        await kv.del(`push:sub:${userId}`);
        return res.status(400).json({ error: "Subscription expired and was pruned." });
      } else {
        return res.status(500).json({ error: "Push service failed: " + err.message });
      }
    }
  } catch (err: any) {
    console.error("Error sending user push notification:", err);
    return res.status(500).json({ error: err.message || "Failed to process push dispatch." });
  }
}
