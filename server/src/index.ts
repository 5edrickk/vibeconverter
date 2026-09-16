import express from "express";
import cors from "cors";
import unitsRouter from "./routes/units.js";
import currencyRouter from "./routes/currency.js";
import timezoneRouter from "./routes/timezone.js";

const app = express();
const PORT = Number(process.env.PORT) || 3001;

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/units", unitsRouter);
app.use("/api/currency", currencyRouter);
app.use("/api/timezone", timezoneRouter);

app.listen(PORT, () => {
  console.log(`API server listening on http://localhost:${PORT}`);
});
