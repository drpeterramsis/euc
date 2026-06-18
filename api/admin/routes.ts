export default async function handler(req: any, res: any) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.setHeader("Allow", ["GET", "HEAD"]);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const routes = [
    { label: "Dashboard", path: "/dashboard" },
    { label: "Staff Directory", path: "/staff" },
    { label: "Messages", path: "/messages" },
    { label: "Check-ins", path: "/checkins" },
  ];

  return res.status(200).json(routes);
}
