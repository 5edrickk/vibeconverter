// Checks that the API answers on /health. Exits 0 when healthy, 1 otherwise,
// so it can be used by hand, in CI, or after a PM2 restart.
// Usage: node scripts/healthcheck.mjs [url]   (default: http://localhost:$PORT/health)

const url = process.argv[2] ?? `http://localhost:${process.env.PORT || 3001}/health`;
const timeoutMs = 5000;

try {
  const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
  const body = await res.json().catch(() => null);
  if (res.ok && body?.status === "ok") {
    console.log(`HEALTHY ${url} (uptime ${body.uptimeSeconds}s)`);
    process.exit(0);
  }
  console.error(`UNHEALTHY ${url} -> HTTP ${res.status}`, body ?? "");
} catch (err) {
  console.error(`UNREACHABLE ${url} -> ${err.message}`);
}
process.exit(1);
