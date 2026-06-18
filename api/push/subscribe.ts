import { kv } from "@vercel/kv";

export default async function handler(req: any, res: any) {
  if (req.method === "GET") {
    return res.status(200).json({
      status: "debug",
      message: "GET /api/push/subscribe OK. Use POST to subscribe."
    });
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST", "GET"]);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    const { userId, username, subscription } = req.body || {};

    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ error: "Subscription object with endpoint is required." });
    }

    const key = userId || username || "anonymous";

    // Set under both subscription key schemas to be safe and compatible with both server.ts and api/index.ts
    await kv.set(`user:${key}:subscription`, subscription);
    await kv.set(`push:sub:${key}`, subscription);

    // Track active subscriber keys
    await kv.sadd("push:subscribers", key);
    if (userId) await kv.sadd("push:subscribers", userId);
    if (username) await kv.sadd("push:subscribers", username);

    return res.status(200).json({ success: true, ok: true });
  } catch (err: any) {
    console.error("Error subscribing user to push:", err);
    return res.status(500).json({ error: err.message || "Failed to subscribe." });
  }
}
