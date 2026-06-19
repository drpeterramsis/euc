import path from "path";
import fs from "fs";

export default async function handler(req: any, res: any) {
  const method = req.method;
  const id = req.query.id as string;

  if (method !== "GET" && method !== "PUT" && method !== "PATCH") {
    res.setHeader("Allow", ["GET", "PUT", "PATCH"]);
    return res.status(405).json({ error: `Method ${method} Not Allowed` });
  }

  const filePath = path.join(process.cwd(), "data", "users.json");

  try {
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "Users database file not found" });
    }

    const fileContent = fs.readFileSync(filePath, "utf-8");
    let users = [];
    try {
      users = JSON.parse(fileContent);
    } catch (e) {
      return res.status(500).json({ error: "Failed to parse users data" });
    }

    if (method === "GET") {
      if (!id) {
        return res.status(400).json({ error: "User ID is required" });
      }
      const user = users.find((u: any) => u.id === id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      return res.status(200).json({ user });
    }

    if (method === "PUT" || method === "PATCH") {
      if (!id) {
        return res.status(400).json({ error: "User ID is required" });
      }
      const updatedUser = req.body;
      const idx = users.findIndex((u: any) => u.id === id);
      if (idx !== -1) {
        users[idx] = { ...users[idx], ...updatedUser };
      } else {
        users.push(updatedUser);
      }

      fs.writeFileSync(filePath, JSON.stringify(users, null, 2), "utf-8");
      return res.status(200).json({ success: true, user: users[idx] || updatedUser });
    }
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
