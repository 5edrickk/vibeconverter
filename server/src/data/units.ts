export interface UnitDef {
  id: string;
  label: string;
  symbol: string;
  /**
   * Multiplicative factor to the category's canonical base unit
   * (base = factor * value). Not used for temperature.
   */
  toBase?: number;
}

export interface CategoryDef {
  id: string;
  label: string;
  baseUnit: string;
  units: UnitDef[];
}

export const CATEGORIES: CategoryDef[] = [
  {
    id: "length",
    label: "Length",
    baseUnit: "m",
    units: [
      { id: "mm", label: "Millimeter", symbol: "mm", toBase: 0.001 },
      { id: "cm", label: "Centimeter", symbol: "cm", toBase: 0.01 },
      { id: "m", label: "Meter", symbol: "m", toBase: 1 },
      { id: "km", label: "Kilometer", symbol: "km", toBase: 1000 },
      { id: "in", label: "Inch", symbol: "in", toBase: 0.0254 },
      { id: "ft", label: "Foot", symbol: "ft", toBase: 0.3048 },
      { id: "yd", label: "Yard", symbol: "yd", toBase: 0.9144 },
      { id: "mi", label: "Mile", symbol: "mi", toBase: 1609.344 },
    ],
  },
  {
    id: "volume",
    label: "Volume",
    baseUnit: "L",
    units: [
      { id: "ml", label: "Milliliter", symbol: "mL", toBase: 0.001 },
      { id: "l", label: "Liter", symbol: "L", toBase: 1 },
      { id: "floz", label: "Fluid ounce (US)", symbol: "fl oz", toBase: 0.0295735 },
      { id: "cup", label: "Cup (US)", symbol: "cup", toBase: 0.236588 },
      { id: "pt", label: "Pint (US)", symbol: "pt", toBase: 0.473176 },
      { id: "qt", label: "Quart (US)", symbol: "qt", toBase: 0.946353 },
      { id: "gal", label: "Gallon (US)", symbol: "gal", toBase: 3.785411784 },
    ],
  },
  {
    id: "weight",
    label: "Weight",
    baseUnit: "kg",
    units: [
      { id: "mg", label: "Milligram", symbol: "mg", toBase: 0.000001 },
      { id: "g", label: "Gram", symbol: "g", toBase: 0.001 },
      { id: "kg", label: "Kilogram", symbol: "kg", toBase: 1 },
      { id: "t", label: "Metric ton", symbol: "t", toBase: 1000 },
      { id: "oz", label: "Ounce", symbol: "oz", toBase: 0.028349523125 },
      { id: "lb", label: "Pound", symbol: "lb", toBase: 0.45359237 },
      { id: "st", label: "Stone", symbol: "st", toBase: 6.35029318 },
    ],
  },
  {
    id: "temperature",
    label: "Temperature",
    baseUnit: "C",
    units: [
      { id: "c", label: "Celsius", symbol: "\u00b0C" },
      { id: "f", label: "Fahrenheit", symbol: "\u00b0F" },
      { id: "k", label: "Kelvin", symbol: "K" },
    ],
  },
  {
    id: "area",
    label: "Area",
    baseUnit: "m\u00b2",
    units: [
      { id: "cm2", label: "Square centimeter", symbol: "cm\u00b2", toBase: 0.0001 },
      { id: "m2", label: "Square meter", symbol: "m\u00b2", toBase: 1 },
      { id: "ha", label: "Hectare", symbol: "ha", toBase: 10000 },
      { id: "km2", label: "Square kilometer", symbol: "km\u00b2", toBase: 1000000 },
      { id: "ft2", label: "Square foot", symbol: "ft\u00b2", toBase: 0.09290304 },
      { id: "yd2", label: "Square yard", symbol: "yd\u00b2", toBase: 0.83612736 },
      { id: "acre", label: "Acre", symbol: "acre", toBase: 4046.8564224 },
    ],
  },
];

export function getCategory(id: string): CategoryDef | undefined {
  return CATEGORIES.find((c) => c.id === id);
}
