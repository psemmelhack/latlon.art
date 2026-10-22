import type { PublicRecord } from "./types.ts";

// Homepage order: newest first, undated entries last.
export function byNewest(a: PublicRecord, b: PublicRecord): number {
  if (a.dayNumber == null && b.dayNumber == null) return a.id < b.id ? -1 : 1;
  if (a.dayNumber == null) return 1;
  if (b.dayNumber == null) return -1;
  if (a.dayNumber !== b.dayNumber) return b.dayNumber - a.dayNumber;
  const aTime = a.utc ?? "";
  const bTime = b.utc ?? "";
  if (aTime !== bTime) return aTime < bTime ? 1 : -1;
  return a.id < b.id ? -1 : 1;
}

// Neighbours in the homepage list: prev is the entry listed above, next the one below.
export function neighbors<T extends { id: string }>(list: T[], id: string): { prev: T | null; next: T | null } {
  const i = list.findIndex((item) => item.id === id);
  if (i < 0) return { prev: null, next: null };
  return { prev: i > 0 ? list[i - 1] : null, next: i < list.length - 1 ? list[i + 1] : null };
}
