import { getCollection, type CollectionEntry } from "astro:content";
import { present } from "./present.ts";
import { byNewest } from "./sequence.ts";
import type { PublicRecord, TransientInput } from "./types.ts";

export async function loadRecords(): Promise<PublicRecord[]> {
  const entries = await getCollection("transients");
  const records = entries.map((entry) => present(entry.id, toInput(entry)));
  records.sort(byNewest);
  return records;
}

function toInput(entry: CollectionEntry<"transients">): TransientInput {
  return {
    title: entry.data.title,
    number: entry.data.number,
    draft: entry.data.draft,
    hideCoordinates: entry.data.hide_coordinates,
    latitude: entry.data.latitude,
    longitude: entry.data.longitude,
    altitudeM: entry.data.altitude_m,
    utc: entry.data.utc,
    localTime: entry.data.local_time,
    timezone: entry.data.timezone,
    place: entry.data.place,
    medium: entry.data.medium,
    source: entry.data.source,
    images: entry.data.images ?? [],
  };
}
