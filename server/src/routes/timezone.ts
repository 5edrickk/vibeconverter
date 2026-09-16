import { Router } from "express";
import {
  convertTimezone,
  getZones,
  TimezoneError,
} from "../services/convertTimezone.js";

const router = Router();

router.get("/zones", (_req, res) => {
  try {
    res.json(getZones());
  } catch {
    res.status(500).json({ error: "Could not list timezones" });
  }
});

router.get("/convert", (req, res) => {
  const from = String(req.query.from ?? "");
  const to = String(req.query.to ?? "");
  const datetime = String(req.query.datetime ?? "");

  if (!from || !to) {
    return res.status(400).json({ error: "`from` and `to` are required" });
  }
  if (!datetime) {
    return res.status(400).json({ error: "`datetime` is required" });
  }

  try {
    res.json(convertTimezone(from, to, datetime));
  } catch (err) {
    if (err instanceof TimezoneError) {
      return res.status(400).json({ error: err.message });
    }
    return res.status(500).json({ error: "Unexpected conversion error" });
  }
});

export default router;
