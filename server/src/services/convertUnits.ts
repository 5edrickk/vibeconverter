import { getCategory, UnitDef } from "../data/units.js";

export class ConversionError extends Error {}

interface ConvertResult {
  result: number;
  formula: string;
}

function toCelsius(value: number, unitId: string): number {
  switch (unitId) {
    case "c":
      return value;
    case "f":
      return (value - 32) * (5 / 9);
    case "k":
      return value - 273.15;
    default:
      throw new ConversionError(`Unknown temperature unit "${unitId}"`);
  }
}

function fromCelsius(celsius: number, unitId: string): number {
  switch (unitId) {
    case "c":
      return celsius;
    case "f":
      return celsius * (9 / 5) + 32;
    case "k":
      return celsius + 273.15;
    default:
      throw new ConversionError(`Unknown temperature unit "${unitId}"`);
  }
}

function findUnit(units: UnitDef[], id: string): UnitDef {
  const unit = units.find((u) => u.id === id);
  if (!unit) {
    throw new ConversionError(`Unknown unit "${id}"`);
  }
  return unit;
}

export function convertUnit(
  categoryId: string,
  fromId: string,
  toId: string,
  value: number
): ConvertResult {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new ConversionError("`value` must be a finite number");
  }

  const category = getCategory(categoryId);
  if (!category) {
    throw new ConversionError(`Unknown category "${categoryId}"`);
  }

  const from = findUnit(category.units, fromId);
  const to = findUnit(category.units, toId);

  if (category.id === "temperature") {
    const celsius = toCelsius(value, from.id);
    const result = fromCelsius(celsius, to.id);
    return {
      result,
      formula: `${from.symbol} \u2192 ${to.symbol} via Celsius`,
    };
  }

  const base = value * (from.toBase ?? 1);
  const result = base / (to.toBase ?? 1);
  return {
    result,
    formula: `value \u00d7 ${from.toBase} \u00f7 ${to.toBase} (${category.baseUnit} base)`,
  };
}
