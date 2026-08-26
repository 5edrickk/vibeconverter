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
};
