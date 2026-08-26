import { Router } from "express";
import { CATEGORIES } from "../data/units.js";
import { convertUnit, ConversionError } from "../services/convertUnits.js";

const router = Router();

router.get("/categories", (_req, res) => {
  res.json(
    CATEGORIES.map((c) => ({
      id: c.id,
      label: c.label,
      baseUnit: c.baseUnit,
      units: c.units.map((u) => ({ id: u.id, label: u.label, symbol: u.symbol })),
    }))
  );
});

router.post("/convert", (req, res) => {
  const { category, from, to, value } = req.body ?? {};

  if (
    typeof category !== "string" ||
    typeof from !== "string" ||
    typeof to !== "string"
  ) {
    return res.status(400).json({ error: "`category`, `from`, and `to` are required strings" });
  }

  const numericValue = typeof value === "number" ? value : Number(value);

  try {
    const { result, formula } = convertUnit(category, from, to, numericValue);
    return res.json({ category, from, to, value: numericValue, result, formula });
  } catch (err) {
    if (err instanceof ConversionError) {
      return res.status(400).json({ error: err.message });
    }
    return res.status(500).json({ error: "Unexpected conversion error" });
  }
});

export default router;
