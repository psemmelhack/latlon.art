/**
 * Display and identity rules for a transient.
 * A TID is complete only when latitude, longitude, altitude, and UTC are all present.
 * Local clock times are not converted to UTC unless a numeric offset is part of the value.
 */

export class SpacetimeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SpacetimeError";
  }
}

const UTC_RE = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(\.\d+)?Z$/;
const OFFSET_RE = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2}):(\d{2})(Z|[+-]\d{2}:\d{2})$/;
const DECIMAL_RE = /^-?\d+(\.\d+)?$/;

const MONTHS: Record<string, number> = {
  JAN: 1,
  JANUARY: 1,
  FEB: 2,
  FEBRUARY: 2,
  MAR: 3,
  MARCH: 3,
  APR: 4,
  APRIL: 4,
  MAY: 5,
  JUN: 6,
  JUNE: 6,
  JUL: 7,
  JULY: 7,
  AUG: 8,
  AUGUST: 8,
  SEP: 9,
  SEPT: 9,
  SEPTEMBER: 9,
  OCT: 10,
  OCTOBER: 10,
  NOV: 11,
  NOVEMBER: 11,
  DEC: 12,
  DECEMBER: 12,
};

const MONTH_NAMES = [
  "JANUARY",
  "FEBRUARY",
  "MARCH",
  "APRIL",
  "MAY",
  "JUNE",
  "JULY",
  "AUGUST",
  "SEPTEMBER",
  "OCTOBER",
  "NOVEMBER",
  "DECEMBER",
];

export function normalizeUtc(input: string): string {
  const value = input.trim();
  const match = UTC_RE.exec(value);
  if (!match) {
    throw new SpacetimeError(
      `UTC must be ISO 8601 in Zulu time with seconds, for example 2022-02-22T19:22:22Z. Received "${input}".`,
    );
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hours = Number(match[4]);
  const minutes = Number(match[5]);
  const seconds = Number(match[6]);
  const fraction = canonicalFraction(match[7]);
  assertClock(hours, minutes, seconds, value);
  assertDate(year, month, day, value);

  const date = `${match[1]}-${match[2]}-${match[3]}`;
  const hh = String(hours).padStart(2, "0");
  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");
  return `${date}T${hh}:${mm}:${ss}${fraction}Z`;
}

/** Convert an ISO timestamp that already carries Z or a numeric offset. Named zones such as EST are refused. */
export function toUtcZ(input: string): string {
  const value = input.trim();
  const match = OFFSET_RE.exec(value);
  if (!match) {
    throw new SpacetimeError(
      `A numeric offset is required to convert to UTC, for example 2022-02-22T14:22:22-05:00. Received "${input}".`,
    );
  }
  if (match[5] === "Z") return normalizeUtc(value);
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) {
    throw new SpacetimeError(`UTC date does not exist: ${value}`);
  }
  const date = new Date(parsed);
  const y = date.getUTCFullYear();
  const mo = String(date.getUTCMonth() + 1).padStart(2, "0");
  const da = String(date.getUTCDate()).padStart(2, "0");
  const hh = String(date.getUTCHours()).padStart(2, "0");
  const mm = String(date.getUTCMinutes()).padStart(2, "0");
  const ss = String(date.getUTCSeconds()).padStart(2, "0");
  return normalizeUtc(`${y}-${mo}-${da}T${hh}:${mm}:${ss}Z`);
}

export function decimalText(input: string): string {
  const value = input.trim();
  if (!DECIMAL_RE.test(value)) {
    throw new SpacetimeError(
      `Coordinates are signed decimals with no hemisphere letters and no degree sign. Received "${input}".`,
    );
  }
  return value;
}

export function coordLine(latitude: string, longitude: string): string {
  return `${decimalText(latitude)}, ${decimalText(longitude)}`;
}

export function canonicalAltitude(meters: number): string {
  if (!Number.isFinite(meters)) {
    throw new SpacetimeError("Altitude must be a finite number of meters.");
  }
  const rounded = Math.round(meters * 1000) / 1000;
  if (Object.is(rounded, -0) || rounded === 0) return "0";
  const negative = rounded < 0;
  const text = trimFixed(Math.abs(rounded), 3);
  return negative ? `-${text}` : text;
}

export function formatAltitude(meters: number): string {
  return `${canonicalAltitude(meters)} m`;
}

/** His published string is `lat, lon,utc`. Altitude is required for the ID to be complete, and is kept on its own line. */
export function tidString(latitude: string, longitude: string, utc: string): string {
  return `${coordLine(latitude, longitude)},${normalizeUtc(utc)}`;
}

export function stampFromIso(input: string): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/.exec(input.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hours = Number(match[4]);
  const minutes = Number(match[5]);
  const seconds = Number(match[6]);
  if (month < 1 || month > 12 || hours > 23 || minutes > 59 || seconds > 59) return null;
  return stampParts(year, month, day, hours, minutes, seconds);
}

export function parseLocalDay(input: string | undefined): string | null {
  if (!input) return null;
  const value = input.trim();
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (iso) {
    const year = Number(iso[1]);
    const month = Number(iso[2]);
    const day = Number(iso[3]);
    try {
      assertDate(year, month, day, value);
    } catch {
      return null;
    }
    return `${iso[1]}-${iso[2]}-${iso[3]}`;
  }

  const written = /^([A-Za-z]+)\s+(\d{1,2})\s+(\d{4})/.exec(value);
  if (!written) return null;
  const month = MONTHS[written[1].toUpperCase()];
  const day = Number(written[2]);
  const year = Number(written[3]);
  if (!month) return null;
  try {
    assertDate(year, month, day, value);
  } catch {
    return null;
  }
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function dayNumber(isoDay: string): number {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDay);
  if (!match) throw new SpacetimeError(`Expected a calendar day, received "${isoDay}".`);
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  assertDate(year, month, day, isoDay);
  return Math.floor(Date.UTC(year, month - 1, day) / 86400000);
}

export function labelFromDayNumber(day: number): string {
  const date = new Date(day * 86400000);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const da = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${da}`;
}

function stampParts(
  year: number,
  month: number,
  day: number,
  hours: number,
  minutes: number,
  seconds: number,
): string {
  const monthName = MONTH_NAMES[month - 1] ?? "";
  const clock = twelveHour(hours, minutes, seconds);
  return `${monthName} ${day} ${year} / ${clock}`;
}

function twelveHour(hours: number, minutes: number, seconds: number): string {
  const suffix = hours >= 12 ? "PM" : "AM";
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  const hh = String(hour12).padStart(2, "0");
  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");
  return seconds === 0 ? `${hh}:${mm}${suffix}` : `${hh}:${mm}:${ss}${suffix}`;
}

function canonicalFraction(fraction: string | undefined): string {
  if (!fraction) return "";
  const digits = fraction.slice(1).replace(/0+$/, "");
  return digits.length > 0 ? `.${digits}` : "";
}

function trimFixed(value: number, digits: number): string {
  return value
    .toFixed(digits)
    .replace(/0+$/, "")
    .replace(/\.$/, "");
}

function assertClock(hours: number, minutes: number, seconds: number, value: string): void {
  if (hours > 23 || minutes > 59 || seconds > 59) {
    throw new SpacetimeError(`UTC time is out of range: ${value}`);
  }
}

function assertDate(year: number, month: number, day: number, value: string): void {
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    throw new SpacetimeError(`UTC date does not exist: ${value}`);
  }
}
