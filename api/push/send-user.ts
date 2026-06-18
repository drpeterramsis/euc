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
    // 1. Resolve session and role from various potential frameworks/authenticators
    let userRole = null;
    let authUserId = null;
    let authUsername = null;

    // A. Parse Authorization Header (e.g. bearer custom token or serialize user object)
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (authHeader && typeof authHeader === "string") {
      const token = authHeader.replace(/^Bearer\s+/i, "").trim();
      try {
        if (token.startsWith("{") && token.endsWith("}")) {
          const session = JSON.parse(token);
          userRole = session.role;
          authUserId = session.id;
          authUsername = session.username;
        } else {
          authUsername = token;
        }
      } catch (e) {
        // Ignore JSON parsing errors for plain tokens
      }
    }

    // B. Parse Custom Headers (Vite / React client proxies)
    if (req.headers["x-user-role"]) userRole = req.headers["x-user-role"];
    if (req.headers["x-user-id"]) authUserId = req.headers["x-user-id"];
    if (req.headers["x-user-username"]) authUsername = req.headers["x-user-username"];

    // C. Parse from Request Cookies (NextAuth / JWT / Custom cookies)
    if (!userRole && req.cookies) {
      const sessionCookie = req.cookies["next-auth.session-token"] || 
                            req.cookies["__Secure-next-auth.session-token"] || 
                            req.cookies["session"];
      if (sessionCookie) {
        // NextAuth or cookie-based check could be completed here
      }
    }

    // D. Extract from request body
    const { userId, title, body, url, iconUrl, badgeUrl, imageUrl, adminToken, session } = req.body || {};
    if (session) {
      userRole = userRole || session.role;
      authUserId = authUserId || session.id;
      authUsername = authUsername || session.username;
    }

    // Normalize values
    const normalizedRole = userRole ? String(userRole).toLowerCase().trim() : null;

    // Temporary server-side debug log (does not leak credentials)
    const isDebugBypass = process.env.NODE_ENV !== "production" || process.env.DEBUG_BYPASS_AUTH === "true";
    console.log("[Push Send User API Auth Status]:", {
      isDebugBypass,
      hasAuthHeader: !!authHeader,
      resolvedRole: userRole,
      normalizedRole,
      resolvedUserId: authUserId,
      resolvedUsername: authUsername,
      adminTokenPassed: !!adminToken
    });

    // 2. Validate Authentication & Authorization
    if (!isDebugBypass) {
      // 401 Unauthorized: No credentials could be resolved
      if (!userRole && !authUsername && !adminToken) {
        return res.status(401).json({ error: "Unauthorized: Authentication session not found." });
      }

      // 403 Forbidden: Logged in, but is NOT an admin
      if (normalizedRole !== "admin" && adminToken !== "admin") {
        return res.status(403).json({ error: "Forbidden: Administrative access required." });
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
