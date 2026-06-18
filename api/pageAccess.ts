import { kv } from "@vercel/kv";

export default async function handler(req: any, res: any) {
  const method = req.method;
  const action = (req.query.action || (req.body && req.body.action)) as string;

  try {
    if (method === "GET" && action === "checkins.get") {
        const config = await kv.get("setting:checkins.config") || {};
        return res.status(200).json(config);
    }
    if (method === "POST" && action === "checkins.set") {
        const { role, config } = req.body;
        if (role !== "admin") return res.status(403).json({ error: "Forbidden" });
        await kv.set("setting:checkins.config", config);
        return res.status(200).json({ ok: true });
    }
    return res.status(400).json({ error: "Invalid action" });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
