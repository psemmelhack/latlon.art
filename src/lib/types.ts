export type Photo = {
  src: string;
  alt: string;
  caption?: string;
  width?: number;
  height?: number;
};

export type TransientInput = {
  title?: string;
  number?: number;
  draft: boolean;
  hideCoordinates: boolean;
  latitude?: string;
  longitude?: string;
  altitudeM?: number;
  utc?: string;
  localTime?: string;
  timezone?: string;
  place?: string;
  medium?: string;
  source?: string;
  images: Photo[];
};

export type PublicRecord = {
  id: string;
  href: string;
  heading: string;
  subtitle: string | null;
  draft: boolean;
  hidden: boolean;
  lat: number | null;
  lon: number | null;
  latText: string | null;
  lonText: string | null;
  coordLine: string | null;
  altitudeM: number | null;
  altitudeText: string | null;
  utc: string | null;
  localLine: string | null;
  recordedLocal: string | null;
  place: string | null;
  medium: string | null;
  source: string | null;
  images: Photo[];
  day: string | null;
  dayNumber: number | null;
  timeKind: "utc" | "local" | "none";
  tid: string | null;
  tidPartial: string | null;
};

export type MapPoint = {
  slug: string;
  title: string;
  href: string;
  lat: number;
  lon: number;
  latText: string;
  lonText: string;
  utc: string | null;
  localLine: string | null;
  place: string | null;
  draft: boolean;
  day: number | null;
};
