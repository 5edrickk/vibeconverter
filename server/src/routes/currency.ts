import { Router } from "express";
import {
  getCurrencies,
  getHistory,
  getLatestRates,
  getRatePair,
  UpstreamError,
} from "../services/frankfurter.js";

const router = Router();

const CODE_RE = /^[A-Za-z]{3}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function handleError(err: unknown, res: import("express").Response) {
  if (err instanceof UpstreamError) {
    return res.status(err.status).json({ error: err.message });
  }
  return res.status(500).json({ error: "Unexpected error" });
}

router.get("/currencies", async (_req, res) => {
  try {
    res.json(await getCurrencies());
  } catch (err) {
    handleError(err, res);
  }
});

router.get("/rates", async (req, res) => {
  const base = String(req.query.base ?? "USD").toUpperCase();
  if (!CODE_RE.test(base)) {
    return res.status(400).json({ error: "`base` must be a 3-letter currency code" });
  }
  try {
    res.json(await getLatestRates(base));
  } catch (err) {
    handleError(err, res);
  }
});

router.get("/convert", async (req, res) => {
  const from = String(req.query.from ?? "").toUpperCase();
  const to = String(req.query.to ?? "").toUpperCase();
  const amount = Number(req.query.amount ?? 1);

  if (!CODE_RE.test(from) || !CODE_RE.test(to)) {
    return res.status(400).json({ error: "`from` and `to` must be 3-letter currency codes" });
  }
  if (!Number.isFinite(amount)) {
    return res.status(400).json({ error: "`amount` must be a number" });
  }

  try {
    if (from === to) {
      return res.json({ from, to, amount, rate: 1, result: amount, date: null });
    }
    const pair = await getRatePair(from, to);
    res.json({
      from,
      to,
      amount,
      rate: pair.rate,
      result: amount * pair.rate,
      date: pair.date,
    });
  } catch (err) {
    handleError(err, res);
  }
});

router.get("/history", async (req, res) => {
  const from = String(req.query.from ?? "").toUpperCase();
  const to = String(req.query.to ?? "").toUpperCase();
  const start = String(req.query.start ?? "");
  const end = String(req.query.end ?? "");

  if (!CODE_RE.test(from) || !CODE_RE.test(to)) {
    return res.status(400).json({ error: "`from` and `to` must be 3-letter currency codes" });
  }
  if (!DATE_RE.test(start) || !DATE_RE.test(end)) {
    return res.status(400).json({ error: "`start` and `end` must be YYYY-MM-DD dates" });
  }

  try {
    res.json(await getHistory(from, to, start, end));
  } catch (err) {
    handleError(err, res);
  }
});

export default router;
