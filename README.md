# Converter App

![Vibe Converter advertisement](assets/vibeconverter_ad.gif)

A three-section converter web app. The React frontend never calls a third-party
service directly: every conversion goes through the Express API, which owns the
unit tables, the timezone math and the cached calls to the FX provider.

1. **Units** - offline conversions for length, volume, weight, temperature and
   area. Every category converts through a canonical base unit, and the API
   returns the formula it used alongside the result.
2. **Currency** - live money conversion backed by the public
   [Frankfurter](https://frankfurter.dev/) FX API, plus a latest-rates panel and
   a history range with a sparkline and a daily table. Upstream responses are
   cached in memory (1 hour for rates, 1 day for the currency list).
3. **Time** - convert a wall-clock date and time between IANA timezones using
   the native `Intl` API (no extra dependencies), with DST handled per date,
   plus a live world clock for major cities.

## Stack

- **Backend:** Node.js + Express + TypeScript (`server/`, port `3001`)
- **Frontend:** Vite + React + TypeScript + Material UI (`client/`, port `5173`)
- npm workspaces at the root

## Requirements

- Node.js 20 or newer (the timezone service uses `Intl.supportedValuesOf`)
- npm 9 or newer (workspaces)

## Getting started

```bash
git clone https://github.com/5edrickk/vibeconverter.git
cd vibeconverter
npm install   # installs both workspaces from the root
npm run dev   # starts the API and the frontend together
```

- Frontend: [http://localhost:5173](http://localhost:5173)
- Backend API: [http://localhost:3001](http://localhost:3001)

The Vite dev server proxies `/api` to the backend, so no CORS setup is needed in
the browser.

### Scripts

| Command                        | What it does                                       |
| ------------------------------ | -------------------------------------------------- |
| `npm run dev`                  | Runs server and client together via `concurrently` |
| `npm run dev:server`           | API only, with reload on change (`tsx watch`)      |
| `npm run dev:client`           | Vite dev server only                               |
| `npm run build`                | Type-checks and builds both workspaces             |
| `npm start --workspace server` | Runs the compiled API from `server/dist`           |

The API port can be overridden with the `PORT` environment variable.

## Project layout

```
server/src
  data/units.ts              unit tables (add a category here)
  services/convertUnits.ts   base-unit conversion + temperature formulas
  services/frankfurter.ts    FX provider client with in-memory cache
  services/convertTimezone.ts  Intl-based timezone math
  routes/                    units.ts, currency.ts, timezone.ts
client/src
  pages/                     UnitsPage, CurrencyPage, TimezonePage
  api.ts                     typed fetch wrapper for every endpoint
  theme.ts                   shared colors, fonts and MUI theme
```

## API

### Units

- `GET /api/units/categories` - categories and their units
- `POST /api/units/convert` - body `{ category, from, to, value }` -> `{ result, formula }`

### Currency (proxied to Frankfurter v2)

- `GET /api/currency/currencies` - supported currency codes
- `GET /api/currency/convert?from=USD&to=EUR&amount=10`
- `GET /api/currency/rates?base=USD` - latest rates
- `GET /api/currency/history?from=USD&to=EUR&start=YYYY-MM-DD&end=YYYY-MM-DD`

### Timezone

- `GET /api/timezone/zones` - IANA timezone list with current UTC offsets
- `GET /api/timezone/convert?from=America/New_York&to=Europe/Paris&datetime=YYYY-MM-DDTHH:mm` - convert a wall-clock datetime between zones

### Health

- `GET /health` (also `/api/health`, for the Vite proxy) ->
  `{ status: "ok", uptimeSeconds, startedAt, timestamp, node, memoryMb }`

To check that the app is up, run `npm run health` (defaults to
`http://localhost:3001/health`) or pass another URL:
`npm run health -- http://<host>:3001/health`. It prints `HEALTHY` and exits
`0`, or prints `UNHEALTHY`/`UNREACHABLE` and exits `1`.

### Logging

The server writes one timestamped line per request (method, path, status,
duration). 4xx responses are logged as `WARN` and 5xx as `ERROR`; startup,
unhandled rejections and uncaught exceptions are logged too. On the VM, read
them with `pm2 logs vibeconverter`.

## Recent changes

**Time section (new)** - a third page and a `/api/timezone` router convert a
date and time between any two IANA zones, resolving the UTC offset for that
specific date so DST is respected, and show a live world clock.

**Currency page fixes** - four bugs were fixed on the currency page:

- the conversion now re-runs while the amount is being typed (`amount` was
  missing from the effect's dependency array);
- slow API responses can no longer overwrite a newer result: the convert, rates
  and history effects cancel their stale responses;
- dates are built in the browser's timezone instead of UTC, so the range no
  longer jumps to tomorrow in the evening;
- the history range is validated - an inverted range or a future end date shows
  a warning, disables **Load** and skips the request.

heroku

azure (umas 4)

aws

oracles
