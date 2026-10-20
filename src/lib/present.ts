import {
  coordLine,
  dayNumber,
  decimalText,
  formatAltitude,
  normalizeUtc,
  parseLocalDay,
  stampFromIso,
  tidString,
} from "./spacetime.ts";
import type { MapPoint, PublicRecord, TransientInput } from "./types.ts";

export function present(id: string, input: TransientInput): PublicRecord {
  const hidden = input.hideCoordinates;
  const latitude = input.latitude ? decimalText(input.latitude) : null;
  const longitude = input.longitude ? decimalText(input.longitude) : null;
  const utc = input.utc ? normalizeUtc(input.utc) : null;
  const altitudeText = input.altitudeM == null ? null : formatAltitude(input.altitudeM);
  const local = localDisplay(input.localTime);
  const when = recorded(utc, input.localTime);
  const names = headingFor(input);
  const showPosition = !hidden && latitude != null && longitude != null;
  const partial =
    showPosition && utc
      ? tidString(latitude, longitude, utc)
      : showPosition
        ? coordLine(latitude, longitude)
        : utc;

  return {
    id,
    href: `/t/${id}`,
    heading: names.heading,
    subtitle: names.subtitle,
    draft: input.draft,
    hidden,
    lat: showPosition ? Number(latitude) : null,
    lon: showPosition ? Number(longitude) : null,
    latText: showPosition ? latitude : null,
    lonText: showPosition ? longitude : null,
    coordLine: showPosition ? coordLine(latitude, longitude) : null,
    altitudeM: hidden || input.altitudeM == null ? null : input.altitudeM,
    altitudeText: hidden ? null : altitudeText,
    utc,
    localLine: local.line,
    recordedLocal: local.recorded,
    place: input.place ?? null,
    medium: input.medium ?? null,
    source: input.source ?? null,
    images: input.images,
    day: when?.day ?? null,
    dayNumber: when ? dayNumber(when.day) : null,
    timeKind: when?.kind ?? "none",
    tid:
      showPosition && utc && input.altitudeM != null ? tidString(latitude, longitude, utc) : null,
    tidPartial: partial,
  };
}

export function toMapPoint(record: PublicRecord): MapPoint | null {
  if (record.lat == null || record.lon == null || record.latText == null || record.lonText == null) {
    return null;
  }
  return {
    slug: record.id,
    title: record.heading,
    href: record.href,
    lat: record.lat,
    lon: record.lon,
    latText: record.latText,
    lonText: record.lonText,
    utc: record.utc,
    localLine: record.localLine,
    place: record.place,
    draft: record.draft,
    day: record.dayNumber,
  };
}

export function summarize(record: PublicRecord, body: string | undefined): string {
  const lead = record.draft ? "Draft, pending Petrus's review. " : "";
  const text = plain(body);
  const point = [record.coordLine, record.altitudeText, record.utc, record.localLine, record.place]
    .filter((part): part is string => Boolean(part))
    .join(", ");
  const core = text || point || record.heading;
  return clip(`${lead}${core}`, 200);
}

function headingFor(input: TransientInput): { heading: string; subtitle: string | null } {
  if (input.number != null) {
    const heading = `Transient #${input.number}`;
    const subtitle = input.title && input.title !== heading ? input.title : null;
    return { heading, subtitle };
  }
  return { heading: input.title?.trim() || "Untitled", subtitle: null };
}

function localDisplay(localTime: string | undefined): { line: string | null; recorded: string | null } {
  const raw = localTime?.trim() ?? "";
  if (!raw) return { line: null, recorded: null };
  const stamped = stampFromIso(raw);
  const line = stamped ?? raw;
  const recorded = stamped && stamped !== raw ? raw : null;
  return { line: line || null, recorded };
}

function recorded(
  utc: string | null,
  localTime: string | undefined,
): { day: string; kind: "utc" | "local" } | null {
  if (utc) return { day: utc.slice(0, 10), kind: "utc" };
  const day = parseLocalDay(localTime);
  return day ? { day, kind: "local" } : null;
}

function plain(body: string | undefined): string {
  if (!body) return "";
  return body
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)]\([^)]*\)/g, "$1")
    .replace(/[#>*_`]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function clip(value: string, max: number): string {
  const clean = value.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).trimEnd()}…`;
}
