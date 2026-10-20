import type { PublicRecord } from "./types.ts";

export const SITE_DESCRIPTION = "An archive of transients.";

const CREATOR = {
  "@type": "Person",
  name: "Peter Semmelhack",
  url: "https://psem.me/",
} as const;

export function originOf(site: URL | undefined): string {
  return (site ?? new URL("https://latlon.art")).origin;
}

export function absolute(site: string, path: string): string {
  return new URL(path, site.endsWith("/") ? site : `${site}/`).href;
}

export function creativeWork(record: PublicRecord, site: string, description?: string): Record<string, unknown> {
  const url = absolute(site, record.href);
  const node: Record<string, unknown> = {
    "@type": "VisualArtwork",
    "@id": url,
    name: record.heading,
    url,
    creator: CREATOR,
  };
  if (record.subtitle) node.alternateName = record.subtitle;
  if (description) node.description = description;
  if (record.utc) node.dateCreated = record.utc;
  if (record.medium) node.artMedium = record.medium;
  if (record.place) node.locationCreated = record.place;
  if (record.lat != null && record.lon != null) {
    const geo: Record<string, unknown> = {
      "@type": "GeoCoordinates",
      latitude: record.lat,
      longitude: record.lon,
    };
    if (record.altitudeM != null) geo.elevation = record.altitudeM;
    node.contentLocation = {
      "@type": "Place",
      ...(record.place ? { name: record.place } : {}),
      geo,
    };
  }
  if (record.tid) node.identifier = record.tid;
  if (record.source) node.isBasedOn = record.source;
  if (record.images.length > 0) {
    node.image = record.images.map((image) => ({
      "@type": "ImageObject",
      contentUrl: absolute(site, image.src),
      ...(image.caption ? { caption: image.caption } : {}),
    }));
  }
  return node;
}

export function siteGraph(records: PublicRecord[], site: string): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${absolute(site, "/")}#site`,
        url: absolute(site, "/"),
        name: "latlon.art",
        description: SITE_DESCRIPTION,
        creator: CREATOR,
        hasPart: [
          { "@type": "WebPage", url: absolute(site, "/agents"), name: "Agents start here" },
          { "@type": "WebPage", url: absolute(site, "/map"), name: "Map" },
        ],
      },
      {
        "@type": "ItemList",
        name: "Transients",
        itemListOrder: "https://schema.org/ItemListOrderDescending",
        numberOfItems: records.length,
        itemListElement: records.map((record, index) => ({
          "@type": "ListItem",
          position: index + 1,
          item: creativeWork(record, site),
        })),
      },
    ],
  };
}

export function recordGraph(record: PublicRecord, site: string, description: string): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    ...creativeWork(record, site, description),
  };
}

export type ArchiveTransient = {
  id: string;
  url: string;
  heading: string;
  title: string | null;
  draft: boolean;
  coordinates_withheld: boolean;
  latitude: string | null;
  longitude: string | null;
  altitude_m: number | null;
  utc: string | null;
  local_time: string | null;
  recorded_local: string | null;
  place: string | null;
  medium: string | null;
  source: string | null;
  tid: string | null;
  images: { src: string; alt: string }[];
};

export function archiveDocument(records: PublicRecord[], site: string): {
  name: string;
  url: string;
  description: string;
  creator: string;
  transients: ArchiveTransient[];
} {
  return {
    name: "latlon.art",
    url: absolute(site, "/"),
    description: SITE_DESCRIPTION,
    creator: "Peter Semmelhack",
    transients: records.map((record) => ({
      id: record.id,
      url: absolute(site, record.href),
      heading: record.heading,
      title: record.subtitle,
      draft: record.draft,
      coordinates_withheld: record.hidden,
      latitude: record.latText,
      longitude: record.lonText,
      altitude_m: record.altitudeM,
      utc: record.utc,
      local_time: record.localLine,
      recorded_local: record.recordedLocal,
      place: record.place,
      medium: record.medium,
      source: record.source,
      tid: record.tid,
      images: record.images.map((image) => ({ src: image.src, alt: image.alt })),
    })),
  };
}

export function llmsText(records: PublicRecord[], site: string): string {
  const lines = [
    "# latlon.art",
    "",
    "> An archive of transients by Peter Semmelhack.",
    "",
    "A transient is one point in spacetime: latitude, longitude, altitude, and a UTC time. Those four together are the TID. A missing field is left out. It is not zero.",
    "",
    "The HTML works without JavaScript. /map is the only page that loads a script.",
    "",
    "Do not treat a blank as a measurement.",
    "",
    "## Index",
    "",
    `- [Home](${absolute(site, "/")})`,
    `- [JSON](${absolute(site, "/transients.json")}): one object per transient. Hidden coordinates are null.`,
    `- [Map](${absolute(site, "/map")})`,
    `- [Agents](${absolute(site, "/agents")})`,
    "",
    "## Records",
    "",
  ];

  for (const record of records) {
    const parts: string[] = [];
    if (record.subtitle) parts.push(record.subtitle);
    if (record.hidden) parts.push("coordinates withheld");
    else if (record.coordLine) parts.push(record.coordLine);
    else parts.push("no coordinates");
    if (record.altitudeText) parts.push(record.altitudeText);
    if (record.utc) parts.push(record.utc);
    else if (record.localLine) parts.push(record.localLine);
    if (record.place) parts.push(record.place);
    lines.push(`- [${record.heading}](${absolute(site, record.href)}): ${parts.join(". ")}.`);
  }

  lines.push(
    "",
    "## Privacy",
    "",
    "Do not publish the name or the coordinates of a person who was witnessed. If coordinates_withheld is true, latitude and longitude are absent. Do not infer them.",
    "",
  );
  return lines.join("\n");
}

export function jsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
