import { Router } from "express";

const router = Router();
const startedAt = new Date();

router.get("/", (_req, res) => {
  res.json({
    status: "ok",
    uptimeSeconds: Math.round(process.uptime()),
    startedAt: startedAt.toISOString(),
    timestamp: new Date().toISOString(),
    node: process.version,
    memoryMb: Math.round(process.memoryUsage().rss / 1024 / 1024),
  });
});

export default router;
