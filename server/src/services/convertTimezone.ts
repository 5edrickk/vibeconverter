export class TimezoneError extends Error {}

const DATETIME_RE = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/;

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

interface ZoneParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

function listZoneIds(): string[] {
  const supported = (
    Intl as unknown as { supportedValuesOf?: (key: string) => string[] }
  ).supportedValuesOf;
  if (typeof supported === "function") {
    return supported("timeZone");
  }
  // Fallback for runtimes without supportedValuesOf.
  return ["UTC"];
}

function isValidZone(id: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: id });
    return true;
  } catch {
    return false;
  }
}

/** Wall-clock components of a given UTC instant within a timezone. */
function getZoneParts(timeZone: string, instant: Date): ZoneParts {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts: Record<string, string> = {};
  for (const p of dtf.formatToParts(instant)) {
    if (p.type !== "literal") parts[p.type] = p.value;
  }
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    // "24" can appear at midnight in some environments; normalize to 0.
    hour: Number(parts.hour) % 24,
    minute: Number(parts.minute),
    second: Number(parts.second),
  };
}

/** Offset (in minutes) of a timezone at a given UTC instant. */
function getOffsetMinutes(timeZone: string, instant: Date): number {
  const p = getZoneParts(timeZone, instant);
  const asUTC = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return Math.round((asUTC - instant.getTime()) / 60000);
}

/** Convert a naive wall-clock datetime in a zone into a UTC instant. */
function wallTimeToInstant(timeZone: string, wall: ZoneParts): Date {
  const guess = Date.UTC(
    wall.year,
    wall.month - 1,
    wall.day,
    wall.hour,
    wall.minute,
    wall.second
  );
  // First approximation using the offset at the guessed instant.
  let offset = getOffsetMinutes(timeZone, new Date(guess));
  let instant = guess - offset * 60000;
  // Refine once so DST transitions resolve correctly.
  offset = getOffsetMinutes(timeZone, new Date(instant));
  instant = guess - offset * 60000;
  return new Date(instant);
}

function formatOffset(minutes: number): string {
  const sign = minutes >= 0 ? "+" : "-";
  const abs = Math.abs(minutes);
  const hh = String(Math.floor(abs / 60)).padStart(2, "0");
  const mm = String(abs % 60).padStart(2, "0");
  return `${sign}${hh}:${mm}`;
}

function getAbbreviation(timeZone: string, instant: Date): string {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "short",
    hour: "2-digit",
  });
  const part = dtf.formatToParts(instant).find((p) => p.type === "timeZoneName");
  return part?.value ?? "";
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function partsToString(p: ZoneParts): string {
  return `${p.year}-${pad(p.month)}-${pad(p.day)}T${pad(p.hour)}:${pad(
    p.minute
  )}:${pad(p.second)}`;
}

function humanLabel(id: string): string {
  const segment = id.split("/").pop() ?? id;
  return segment.replace(/_/g, " ");
}

function regionOf(id: string): string {
  const region = id.split("/")[0];
  return region ?? id;
}

export function getZones(): Zone[] {
  const now = new Date();
  return listZoneIds()
    .map((id) => ({
      id,
      label: humanLabel(id),
      region: regionOf(id),
      offset: formatOffset(getOffsetMinutes(id, now)),
    }))
    .sort((a, b) => a.id.localeCompare(b.id));
}

export function convertTimezone(
  from: string,
  to: string,
  datetime: string
): TimezoneConvertResult {
  if (!isValidZone(from)) {
    throw new TimezoneError(`Unknown timezone "${from}"`);
  }
  if (!isValidZone(to)) {
    throw new TimezoneError(`Unknown timezone "${to}"`);
  }

  const match = DATETIME_RE.exec(datetime);
  if (!match) {
    throw new TimezoneError("`datetime` must be formatted as YYYY-MM-DDTHH:mm");
  }

  const wall: ZoneParts = {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
    hour: Number(match[4]),
    minute: Number(match[5]),
    second: Number(match[6] ?? "0"),
  };

  if (
    wall.month < 1 ||
    wall.month > 12 ||
    wall.day < 1 ||
    wall.day > 31 ||
    wall.hour > 23 ||
    wall.minute > 59 ||
    wall.second > 59
  ) {
    throw new TimezoneError("`datetime` contains an out-of-range value");
  }

  const instant = wallTimeToInstant(from, wall);
  if (Number.isNaN(instant.getTime())) {
    throw new TimezoneError("Could not resolve the provided datetime");
  }

  const fromOffsetMin = getOffsetMinutes(from, instant);
  const toOffsetMin = getOffsetMinutes(to, instant);
  const toParts = getZoneParts(to, instant);

  return {
    from,
    to,
    utc: instant.toISOString(),
    datetimeFrom: partsToString(wall),
    datetimeTo: partsToString(toParts),
    fromOffset: formatOffset(fromOffsetMin),
    toOffset: formatOffset(toOffsetMin),
    fromAbbr: getAbbreviation(from, instant),
    toAbbr: getAbbreviation(to, instant),
    differenceMinutes: toOffsetMin - fromOffsetMin,
  };
}
