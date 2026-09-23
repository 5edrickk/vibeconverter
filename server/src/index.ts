import express from "express";
import cors from "cors";
import unitsRouter from "./routes/units.js";
import currencyRouter from "./routes/currency.js";
import timezoneRouter from "./routes/timezone.js";
import { fileURLToPath } from "url";
import { dirname } from "path";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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

app.use(express.static(path.join(__dirname, "../../client/dist")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../../client/dist/index.html"));
});

app.listen(PORT, () => {
  console.log(`API server listening on http://localhost:${PORT}`);
});