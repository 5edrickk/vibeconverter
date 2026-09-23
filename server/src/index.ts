import express from "express";
import cors from "cors";
import { logger, requestLogger } from "./logger.js";
import healthRouter from "./routes/health.js";
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
app.use(requestLogger);

// `/health` for probes hitting the server directly, `/api/health` for the Vite proxy.
app.use("/health", healthRouter);
app.use("/api/health", healthRouter);

app.use("/api/units", unitsRouter);
app.use("/api/currency", currencyRouter);
app.use("/api/timezone", timezoneRouter);

app.use(express.static(path.join(__dirname, "../../client/dist")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../../client/dist/index.html"));
});

app.listen(PORT, () => {
  logger.info(`API server listening on http://localhost:${PORT}`, {
    node: process.version,
    env: process.env.NODE_ENV ?? "development",
  });
});

process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled promise rejection", { reason: String(reason) });
});

process.on("uncaughtException", (err) => {
  logger.error("Uncaught exception, shutting down", { error: err.stack ?? err.message });
  process.exit(1);
});
