const BASE_URL = "https://api.frankfurter.dev/v2";

export class UpstreamError extends Error {
  status: number;
  constructor(message: string, status = 502) {
    super(message);
    this.status = status;
  }
}

interface CacheEntry<T> {
  value: T;
  expires: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

async function cachedFetch<T>(url: string, ttlMs: number): Promise<T> {
  const hit = cache.get(url);
  if (hit && hit.expires > Date.now()) {
    return hit.value as T;
  }

  let res: Response;
  try {
    res = await fetch(url);
  } catch {
    throw new UpstreamError("Could not reach the exchange-rate service");
  }

  if (!res.ok) {
    let detail = "";
    try {
      const body = (await res.json()) as { message?: string };
      detail = body?.message ? `: ${body.message}` : "";
    } catch {
      /* ignore parse errors */
    }
    // 422 from the upstream means a bad currency/date supplied by the caller.
    throw new UpstreamError(
      `Exchange-rate service returned ${res.status}${detail}`,
      res.status === 422 || res.status === 404 ? 400 : 502
    );
  }

  const value = (await res.json()) as T;
  cache.set(url, { value, expires: Date.now() + ttlMs });
  return value;
}

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

// Raw upstream shapes -------------------------------------------------------

interface RawCurrency {
  iso_code: string;
  name: string;
  symbol: string;
}

interface RawRate {
  date: string;
  base: string;
  quote: string;
  rate: number;
}

// Normalized shapes returned to the client ----------------------------------

export interface Currency {
  code: string;
  name: string;
  symbol: string;
}

export interface LatestRates {
  base: string;
  date: string;
  rates: Record<string, number>;
}

export interface RatePair {
  base: string;
  quote: string;
  rate: number;
  date: string;
}

export interface HistoryPoint {
  date: string;
  rate: number;
}

export interface History {
  base: string;
  quote: string;
  start: string;
  end: string;
  points: HistoryPoint[];
}

export async function getCurrencies(): Promise<Currency[]> {
  const raw = await cachedFetch<RawCurrency[]>(`${BASE_URL}/currencies`, DAY);
  return raw
    .map((c) => ({ code: c.iso_code, name: c.name, symbol: c.symbol }))
    .sort((a, b) => a.code.localeCompare(b.code));
}

export async function getLatestRates(base: string): Promise<LatestRates> {
  const raw = await cachedFetch<RawRate[]>(
    `${BASE_URL}/rates?base=${encodeURIComponent(base)}`,
    HOUR
  );
  const rates: Record<string, number> = {};
  let date = "";
  for (const row of raw) {
    rates[row.quote] = row.rate;
    date = row.date;
  }
  return { base, date, rates };
}

export async function getRatePair(from: string, to: string): Promise<RatePair> {
  const data = await cachedFetch<RawRate>(
    `${BASE_URL}/rate/${encodeURIComponent(from)}/${encodeURIComponent(to)}`,
    HOUR
  );
  return { base: data.base, quote: data.quote, rate: data.rate, date: data.date };
}

export async function getHistory(
  from: string,
  to: string,
  start: string,
  end: string
): Promise<History> {
  const url =
    `${BASE_URL}/rates?base=${encodeURIComponent(from)}` +
    `&quotes=${encodeURIComponent(to)}` +
    `&from=${encodeURIComponent(start)}&to=${encodeURIComponent(end)}`;
  const raw = await cachedFetch<RawRate[]>(url, HOUR);
  const points = raw
    .map((row) => ({ date: row.date, rate: row.rate }))
    .sort((a, b) => a.date.localeCompare(b.date));
  return { base: from, quote: to, start, end, points };
}
