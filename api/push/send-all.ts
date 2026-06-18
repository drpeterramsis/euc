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
    // 1. Resolve session and role from various potential frameworks/authenticators
    let userRole = null;
    let userId = null;
    let username = null;

    // A. Parse Authorization Header (e.g. bearer custom token or serialize user object)
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (authHeader && typeof authHeader === "string") {
      const token = authHeader.replace(/^Bearer\s+/i, "").trim();
      try {
        if (token.startsWith("{") && token.endsWith("}")) {
          const session = JSON.parse(token);
          userRole = session.role;
          userId = session.id;
          username = session.username;
        } else {
          username = token;
        }
      } catch (e) {
        // Ignore JSON parsing errors for plain tokens
      }
    }

    // B. Parse Custom Headers (Vite / React client proxies)
    if (req.headers["x-user-role"]) userRole = req.headers["x-user-role"];
    if (req.headers["x-user-id"]) userId = req.headers["x-user-id"];
    if (req.headers["x-user-username"]) username = req.headers["x-user-username"];

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
    const { title, body, url, iconUrl, badgeUrl, imageUrl, adminToken, session } = req.body || {};
    if (session) {
      userRole = userRole || session.role;
      userId = userId || session.id;
      username = username || session.username;
    }

    // Normalize values
    const normalizedRole = userRole ? String(userRole).toLowerCase().trim() : null;

    // Temporary server-side debug log (does not leak credentials)
    const isDebugBypass = process.env.NODE_ENV !== "production" || process.env.DEBUG_BYPASS_AUTH === "true";
    console.log("[Push Send All API Auth Status]:", {
      isDebugBypass,
      hasAuthHeader: !!authHeader,
      resolvedRole: userRole,
      normalizedRole,
      resolvedUserId: userId,
      resolvedUsername: username,
      adminTokenPassed: !!adminToken
    });

    // 2. Validate Authentication & Authorization
    if (!isDebugBypass) {
      // 401 Unauthorized: No credentials could be resolved
      if (!userRole && !username && !adminToken) {
        return res.status(401).json({ error: "Unauthorized: Authentication session not found." });
      }

      // 403 Forbidden: Logged in, but is NOT an admin
      if (normalizedRole !== "admin" && adminToken !== "admin") {
        return res.status(403).json({ error: "Forbidden: Administrative access required." });
      }
    }

    // 3. Minimum fields validation
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
