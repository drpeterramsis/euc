import "dotenv/config";
import express from "express";
import path from "path";
import { kv } from "@vercel/kv";
import { createServer as createViteServer } from "vite";
import webpush from "web-push";

webpush.setVapidDetails(
  "mailto:contact@euc.app",
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware to parse incoming request bodies as JSON
  app.use(express.json());

  // API endpoints for notifications
  app.get("/api/push/vapidPublicKey", (req, res) => {
    res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
  });

  app.get("/api/admin/routes", (req, res) => {
    // Basic allowlist of routes
    const routes = [
      { label: "Dashboard", path: "/dashboard" },
      { label: "Staff Directory", path: "/staff" },
      { label: "Messages", path: "/messages" },
      { label: "Check-ins", path: "/checkins" },
    ];
    res.json(routes);
  });

  app.post("/api/push/subscribe", async (req, res) => {
    const { userId, subscription } = req.body;
    await kv.set(`user:${userId}:subscription`, subscription);
    res.status(200).json({ success: true });
  });

  app.post("/api/push/send-all", async (req, res) => {
    const { title, body, url, iconUrl, badgeUrl, imageUrl } = req.body;
    const usernames = await kv.smembers("users:index");
    const results = { sent: 0, failed: 0, expired: 0 };
    
    for (const username of usernames) {
      const sub = await kv.get(`user:${username}:subscription`);
      if (sub) {
        try {
          await webpush.sendNotification(sub as any, JSON.stringify({ title, body, url, iconUrl, badgeUrl, imageUrl }));
          results.sent++;
        } catch (err: any) {
          if (err.statusCode === 410) {
            await kv.del(`user:${username}:subscription`);
            results.expired++;
          } else {
            results.failed++;
          }
        }
      }
    }
    res.status(200).json(results);
  });

  app.post("/api/push/send-user", async (req, res) => {
    const { userId, title, body, url, iconUrl, badgeUrl, imageUrl } = req.body;
    const sub = await kv.get(`user:${userId}:subscription`);
    if (!sub) return res.status(404).json({ error: "No subscription found" });

    try {
      await webpush.sendNotification(sub as any, JSON.stringify({ title, body, url, iconUrl, badgeUrl, imageUrl }));
      res.status(200).json({ sent: 1 });
    } catch (err: any) {
      if (err.statusCode === 410) {
        await kv.del(`user:${userId}:subscription`);
        res.status(400).json({ error: "Subscription expired" });
      } else {
        res.status(500).json({ error: "Failed to send" });
      }
    }
  });

  // Consolidated Vercel Gateway Handler matching /api/index.ts
  app.all("/api/index", async (req, res) => {
    try {
      const handler = (await import("./api/index.ts")).default;
      await handler(req, res);
    } catch (err: any) {
      console.error("Local gateway error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Backward compatibility legacy redirects (transparently mapping legacy REST requests to the consolidated gateway)
  app.all("/api/trips*", async (req, res, next) => {
    const subpath = req.path.replace(/^\/api\/trips\/?/, "");
    if (subpath === "list") {
      req.query.path = "trips/list";
    } else {
      req.query.path = "trips/" + subpath;
    }
    req.body.path = req.query.path;
    try {
      const handler = (await import("./api/index.ts")).default;
      await handler(req, res);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.all("/api/checkins*", async (req, res, next) => {
    const subpath = req.path.replace(/^\/api\/checkins\/?/, "");
    req.query.path = "checkins/" + subpath;
    req.body.path = req.query.path;
    try {
      const handler = (await import("./api/index.ts")).default;
      await handler(req, res);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.all("/api/pageAccess*", async (req, res, next) => {
    req.query.path = "pageAccess/checkins/get";
    req.body.path = req.query.path;
    try {
      const handler = (await import("./api/index.ts")).default;
      await handler(req, res);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 1) Create user
  app.post("/api/users", async (req, res) => {
    try {
      const { username, fullname, role } = req.body;

      if (!username || typeof username !== "string") {
        return res.status(400).json({ error: "username is required and must be a string" });
      }
      const trimmedUsername = username.trim();
      if (!trimmedUsername || /\s/.test(trimmedUsername)) {
        return res.status(400).json({ error: "username must not contain whitespace" });
      }

      if (!fullname || typeof fullname !== "string" || !fullname.trim()) {
        return res.status(400).json({ error: "fullname is required" });
      }

      if (!role || typeof role !== "string" || !role.trim()) {
        return res.status(400).json({ error: "role is required" });
      }

      const lowerUsername = trimmedUsername.toLowerCase();

      // Check if user exists in the set index
      const exists = await kv.sismember("users:index", lowerUsername);
      if (exists) {
        return res.status(409).json({ error: "User already exists" });
      }

      const userData = {
        username: lowerUsername,
        fullname: fullname.trim(),
        role: role.trim(),
      };

      // Set user record hash
      await kv.hset(`user:${lowerUsername}`, userData);
      // Add to users index set
      await kv.sadd("users:index", lowerUsername);

      return res.status(201).json({ user: userData });
    } catch (err: any) {
      console.error("Error creating user:", err);
      return res.status(500).json({ error: err.message || "Failed to create user" });
    }
  });

  // 2) List users
  app.get("/api/users", async (req, res) => {
    try {
      // Read all usernames
      const usernames: string[] = await kv.smembers("users:index");
      const users: any[] = [];

      for (const username of usernames) {
        const user = await kv.hgetall(`user:${username}`);
        if (user) {
          users.push(user);
        }
      }

      return res.status(200).json({ users });
    } catch (err: any) {
      console.error("Error listing users:", err);
      return res.status(500).json({ error: err.message || "Failed to list users" });
    }
  });

  // 3) Get user (base + dynamic data)
  app.get("/api/users/:username", async (req, res) => {
    try {
      const { username } = req.params;
      const lowerUsername = username.trim().toLowerCase();

      const exists = await kv.sismember("users:index", lowerUsername);
      if (!exists) {
        return res.status(404).json({ error: "User not found" });
      }

      const user = await kv.hgetall(`user:${lowerUsername}`);
      if (!user) {
        return res.status(404).json({ error: "User data missing" });
      }

      const dynamicData = (await kv.hgetall(`user:${lowerUsername}:data`)) || {};

      return res.status(200).json({
        user,
        data: dynamicData,
      });
    } catch (err: any) {
      console.error("Error getting user:", err);
      return res.status(500).json({ error: err.message || "Failed to get user" });
    }
  });

  // 4) Update base fields (fullname, role)
  app.patch("/api/users/:username", async (req, res) => {
    try {
      const { username } = req.params;
      const { fullname, role } = req.body;
      const lowerUsername = username.trim().toLowerCase();

      const exists = await kv.sismember("users:index", lowerUsername);
      if (!exists) {
        return res.status(404).json({ error: "User not found" });
      }

      const user: any = await kv.hgetall(`user:${lowerUsername}`);
      if (!user) {
        return res.status(404).json({ error: "User data missing" });
      }

      const updates: any = {};
      if (fullname !== undefined) {
        if (typeof fullname !== "string" || !fullname.trim()) {
          return res.status(400).json({ error: "fullname cannot be empty" });
        }
        updates.fullname = fullname.trim();
        user.fullname = updates.fullname;
      }

      if (role !== undefined) {
        if (typeof role !== "string" || !role.trim()) {
          return res.status(400).json({ error: "role cannot be empty" });
        }
        updates.role = role.trim();
        user.role = updates.role;
      }

      if (Object.keys(updates).length > 0) {
        await kv.hset(`user:${lowerUsername}`, updates);
      }

      return res.status(200).json(user);
    } catch (err: any) {
      console.error("Error updating user:", err);
      return res.status(500).json({ error: err.message || "Failed to update user" });
    }
  });

  // 5) Update dynamic columns (cells)
  app.patch("/api/users/:username/data", async (req, res) => {
    try {
      const { username } = req.params;
      const { values } = req.body;
      const lowerUsername = username.trim().toLowerCase();

      const exists = await kv.sismember("users:index", lowerUsername);
      if (!exists) {
        return res.status(404).json({ error: "User not found" });
      }

      if (!values || typeof values !== "object") {
        return res.status(400).json({ error: "values object is required" });
      }

      // Filter and sanitize values
      const updates: Record<string, string> = {};
      for (const [key, val] of Object.entries(values)) {
        const trimmedKey = key.trim();
        if (trimmedKey && !/\s/.test(trimmedKey)) {
          updates[trimmedKey] = typeof val === "string" ? val : String(val);
        }
      }

      if (Object.keys(updates).length > 0) {
        await kv.hset(`user:${lowerUsername}:data`, updates);
      }

      const updatedData = (await kv.hgetall(`user:${lowerUsername}:data`)) || {};

      return res.status(200).json(updatedData);
    } catch (err: any) {
      console.error("Error updating dynamic columns:", err);
      return res.status(500).json({ error: err.message || "Failed to update dynamic columns" });
    }
  });

  // Setup Vite middleware or serve static files
  if (process.env.NODE_ENV !== "production") {
    // Gracefully handle stale browser/ServiceWorker requests to "/src/pages/admin" or "/src/pages/Admin" folders
    // (without TS extensions) to avoid esbuild loader crashes ("Invalid loader value: admin")
    app.use((req, res, next) => {
      const url = req.url || "";
      if (
        (url.includes("/src/pages/admin") || url.includes("/src/pages/Admin")) &&
        !url.includes(".tsx") &&
        !url.includes(".ts") &&
        !url.includes(".js") &&
        !url.includes(".json") &&
        !url.includes("/AdminFeaturePages") &&
        !url.includes("/AdminGalleries") &&
        !url.includes("/AdminMessages") &&
        !url.includes("/AdminPlaceholder")
      ) {
        return res.status(404).send("Not found");
      }
      next();
    });

    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
