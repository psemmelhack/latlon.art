import { LngLatBounds, Map as MapLibreMap, Marker, NavigationControl, setWorkerUrl } from "maplibre-gl";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";
import "maplibre-gl/dist/maplibre-gl.css";

setWorkerUrl(workerUrl);

const STYLE = "https://tiles.openfreemap.org/styles/positron";

type Point = {
  slug: string;
  title: string;
  href: string;
  lat: number;
  lon: number;
};

export function mountMap(el: HTMLElement): void {
  if (el.dataset.mounted === "true") return;
  el.dataset.mounted = "true";

  let points: Point[] = [];
  try {
    points = JSON.parse(el.dataset.points || "[]") as Point[];
  } catch {
    return;
  }
  if (points.length === 0) return;

  const focus = points.find((point) => point.slug === location.hash.replace(/^#/, ""));
  el.hidden = false;

  const map = new MapLibreMap({
    container: el,
    style: STYLE,
    center: focus ? [focus.lon, focus.lat] : [0, 20],
    zoom: focus ? 11 : 1.2,
    minZoom: 0.8,
    maxZoom: 16,
    cooperativeGestures: true,
    dragRotate: false,
    pitchWithRotate: false,
    touchPitch: false,
    maxPitch: 0,
  });

  map.addControl(new NavigationControl({ showCompass: false }), "top-right");

  for (const point of points) {
    const link = document.createElement("a");
    link.className = "dot";
    link.href = point.href;
    link.title = point.title;
    link.setAttribute("aria-label", point.title);
    new Marker({ element: link, anchor: "center" }).setLngLat([point.lon, point.lat]).addTo(map);
  }

  const status = document.querySelector<HTMLElement>("[data-map-status]");
  const failTimer = window.setTimeout(() => {
    if (!status || el.classList.contains("is-ready")) return;
    status.hidden = false;
  }, 12000);

  map.once("load", () => {
    window.clearTimeout(failTimer);
    el.classList.add("is-ready");
    map.resize();
    if (!focus) {
      if (points.length === 1) {
        map.jumpTo({ center: [points[0].lon, points[0].lat], zoom: 11 });
      } else {
        const bounds = new LngLatBounds();
        for (const point of points) bounds.extend([point.lon, point.lat]);
        map.fitBounds(bounds, { padding: 48, maxZoom: 4, duration: 0 });
      }
    }
  });
}
