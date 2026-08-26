# Converter App

A two-section web app:

1. **Units** - local conversions (length, volume, weight, temperature, area).
2. **Currency** - live money conversion via the public [Frankfurter](https://frankfurter.dev/) FX API, plus latest-rates and 30-day history tables.

## Stack

- **Backend:** Node.js + Express + TypeScript (`server/`, port `3001`)
- **Frontend:** Vite + React + TypeScript + Material UI (`client/`, port `5173`)
- npm workspaces at the root

## Getting started

```bash
npm install
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

The Vite dev server proxies `/api` to the backend, so no CORS setup is needed in the browser.

## API

### Units
- `GET /api/units/categories` - categories and their units
- `POST /api/units/convert` - body `{ category, from, to, value }` -> `{ result, formula }`

### Currency (proxied to Frankfurter v2)
- `GET /api/currency/currencies` - supported currency codes
- `GET /api/currency/convert?from=USD&to=EUR&amount=10`
- `GET /api/currency/rates?base=USD` - latest rates
- `GET /api/currency/history?from=USD&to=EUR&start=YYYY-MM-DD&end=YYYY-MM-DD`
