export interface Unit {
  id: string;
  label: string;
  symbol: string;
}

export interface Category {
  id: string;
  label: string;
  baseUnit: string;
  units: Unit[];
}

export interface UnitConvertResult {
  category: string;
  from: string;
  to: string;
  value: number;
  result: number;
  formula: string;
}

export interface Currency {
  code: string;
  name: string;
  symbol: string;
}

export interface CurrencyConvertResult {
  from: string;
  to: string;
  amount: number;
  rate: number;
  result: number;
  date: string | null;
}

export interface LatestRates {
  base: string;
  date: string;
  rates: Record<string, number>;
}

export interface History {
  base: string;
  quote: string;
  start: string;
  end: string;
  points: { date: string; rate: number }[];
}

export interface Zone {
  id: string;
  label: string;
  region: string;
  offset: string;
}

export interface TimezoneConvertResult {
  from: string;
  to: string;
  utc: string;
  datetimeFrom: string;
  datetimeTo: string;
  fromOffset: string;
  toOffset: string;
  fromAbbr: string;
  toAbbr: string;
  differenceMinutes: number;
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const message = (data && (data.error as string)) || `Request failed (${res.status})`;
    throw new Error(message);
  }
  return data as T;
}

export const api = {
  getCategories: () => request<Category[]>("/api/units/categories"),

  convertUnit: (category: string, from: string, to: string, value: number) =>
    request<UnitConvertResult>("/api/units/convert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category, from, to, value }),
    }),

  getCurrencies: () => request<Currency[]>("/api/currency/currencies"),

  convertCurrency: (from: string, to: string, amount: number) =>
    request<CurrencyConvertResult>(
      `/api/currency/convert?from=${from}&to=${to}&amount=${amount}`
    ),

  getRates: (base: string) => request<LatestRates>(`/api/currency/rates?base=${base}`),

  getHistory: (from: string, to: string, start: string, end: string) =>
    request<History>(
      `/api/currency/history?from=${from}&to=${to}&start=${start}&end=${end}`
    ),

  getTimezones: () => request<Zone[]>("/api/timezone/zones"),

  convertTimezone: (from: string, to: string, datetime: string) =>
    request<TimezoneConvertResult>(
      `/api/timezone/convert?from=${encodeURIComponent(from)}&to=${encodeURIComponent(
        to
      )}&datetime=${encodeURIComponent(datetime)}`
    ),
};
