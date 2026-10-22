# latlon.art

A static archive of transients by [Peter](https://psem.me/).

A transient is a measurement in spacetime: latitude, longitude, altitude, and a UTC time. Those four together are the unique ID, the TID. The point does not happen twice. Notarism’s medium is spacetime.

The site is a set of Markdown files. After `npm run build` it is static HTML in `dist/`, ready for Vercel or any other static host.

The records in the repo are drafts (`draft: true`). No draft notice is shown on the pages; the flag only keeps them out of search indexes. They are taken from posts on psem.me. Empty fields were not in the source and were not invented. Coordinates that appear only in a photograph are copied from that photograph. Local times are not converted to UTC unless the offset is numeric, or Peter has confirmed the conversion.

## Run it locally

Node.js 22.22 or newer.

```bash
npm install
npm run dev
```

Open http://127.0.0.1:4391

```bash
npm test
npm run check
npm run build
npm run preview
```

## Add a transient

1. Create `src/content/transients/some-name.md`. The filename is the URL: `/t/some-name`. It does not change when you fill in a missing field.
2. Quote latitude, longitude, UTC, and any other text that contains a colon.
3. Leave unknown fields out. Do not write `0` for an altitude you do not have, and do not invent a time zone.
4. Set `draft: false` only when the record is ready to be public. A draft is kept out of search indexes. It is not labeled on the page.
5. Run `npm run build`. A bad coordinate, a bad UTC value, or a latitude without a longitude fails the build.

```yaml
---
title: "Untitled"
number: 22
draft: true
latitude: "38.722300"
longitude: "-9.139300"
altitude_m: 45
utc: "2026-10-20T16:04:00Z"
local_time: "OCTOBER 20 2026 / 05:04PM"
timezone: "WEST"
place: "Lisbon"
medium: "Rubber stamp on grid paper"
source: "https://psem.me/"
images: []
---

What was there, in a few sentences.
```

Every field except the body is optional. `draft` defaults to false and `hide_coordinates` defaults to false, so set them on purpose.

| Field | What to put |
| --- | --- |
| `title` | The name of the work. Omit it only if there is no name. `number` then supplies the heading. |
| `number` | The series number, if it has one. The page says `Transient #21`. |
| `draft` | `true` while Peter has not signed off. |
| `hide_coordinates` | `true` to keep latitude and longitude out of the built site. Use this for a person who was witnessed. Do not publish their name. |
| `latitude`, `longitude` | Quoted signed decimals, latitude first. No N, S, E, W, and no degree sign. `41.045437` and `-72.352898`. Keep the decimals that were recorded: do not pad them. |
| `altitude_m` | Meters, only if you have the number. Omit it when it is unknown. |
| `utc` | Quoted ISO 8601 in Zulu time, with seconds: `"2022-02-22T19:22:22Z"`. Offsets belong in `local_time`, not here. |
| `local_time` | The clock as written. Stamp style is `JULY 14 2022 / 06:11PM`. An on-screen ISO time can be stored as `"2021-03-14T14:26:14-04:00"`. |
| `timezone` | Optional, and not printed. The page shows `local_time` exactly. If the stamp has no zone, omit this field. |
| `place` | The place name, in your own words, or omit it. |
| `medium` | Card, stamp, tape, photograph, notebook. |
| `source` | An `https://` link, usually the post on psem.me. |
| `images` | Optional. See below. |

Do not add a `slug` field. Do not add a name, or coordinates, of someone Peter witnessed.

`hide_coordinates: true` removes latitude and longitude from the HTML, the map, and the TID. The Markdown file still contains them if you wrote them there. If this repository is public, leave the numbers out of the file as well.

### When UTC may be filled in

Fill in `utc` only when the instant is actually known.

- A value that already ends in `Z` is UTC.
- A numeric offset can be converted. `2022-02-22T14:22:22-05:00` is `2022-02-22T19:22:22Z`. Creation Proofs #2 is that case: Tuesday 02/22/22, 02:22:22 PM ET, and ET that day was EST.
- A named zone is not converted, and it is not added to the clock line. Transient #21 is `JULY 14 2022 / 06:11PM`, with no zone and no UTC. The stamp does not name one.
- If the stamp has no zone at all, leave both `timezone` and `utc` out. Paris is that case, and so is Transient #21.

### The TID

Shown on the record. His string is latitude, longitude, then UTC:

```text
40.778451, -73.971842,2021-03-14T18:26:14Z
```

The ID is complete only when altitude is present too. Until then the page says **TID incomplete** and the missing lines are blank. The blank is not a zero.

The page address stays `/t/` plus the filename, including after the TID is complete, so a link does not move when a blank is filled in.

### Local time on the page

Under the four lines, the local clock is the text that was written: `JULY 14 2022 / 06:11PM`. The page does not append a time zone. If you stored an ISO local time, the page also keeps the original string and labels it “As recorded”.

### Images

Put files in `public/transients/` and point at them from the site root. `alt` is required. Strip camera metadata before committing a photograph; phone GPS is not part of the transient unless you write it in the fields.

```yaml
images:
  - src: /transients/lisbon.jpg
    alt: "Stamp on grid paper with the coordinates and the time."
    caption: "The card."
    width: 1200
    height: 800
```

### The drafts

| File | What is recorded |
| --- | --- |
| `transient-21.md` | Transient #21. `41.045437`, `-72.352898`. `JULY 14 2022 / 06:11PM`. No zone, no UTC, no altitude, no place. |
| `paris-2023.md` | `48.856603`, `2.342002`. `SEPT 14 2023 07:31PM`. Paris. No zone, so no UTC. |
| `central-park-2021.md` | `40.778451`, `-73.971842`. Screen time `2021-03-14T14:26:14-04:00`, UTC `2021-03-14T18:26:14Z`. Place from the Measurement post. Altitude not copied. |
| `creation-proofs-2.md` | `2022-02-22T19:22:22Z`, confirmed. No coordinates. |
| `redondo-beach-2026.md` | `33.8344`, `-118.3832`, read from the tag. Time from chat, about 2:46 PM PDT on 2026-10-20, so it is approximate and UTC is left out. No altitude. Photo had no EXIF time or GPS. |
| `redondo-beach-wall-2026.md` | `33.834452`, `-118.383318`, read from the wall. Finished 11:45 AM PDT on 2026-10-22, from chat, so UTC `2026-10-22T18:45:00Z`. No altitude. Photo had no GPS; all metadata stripped. |

Delete a draft, or set `draft: false`, when it has been reviewed. While every record is a draft, the home page is also kept out of search indexes.

## Pages

The home page is the title, one line, and the list. Coordinates and UTC are the text of each entry. `/map` is a grey map with a dot for each public coordinate, and the same list underneath, so it still reads with JavaScript off. The map is the only page that loads a script.

Tiles are [OpenFreeMap](https://openfreemap.org/) Positron, drawn with MapLibre. No API key. The attribution stays on the map.

`/agents`, `/transients.json`, and `/llms.txt` describe the same records for a person or a program. Each transient page includes schema.org JSON-LD. Withheld coordinates are null in the JSON and absent from the text. They are not inferred.

## Map and the list

Dots are only for records with public coordinates. Creation Proofs #2 is in the list, not on the map.

## Deploy to GitHub Pages, on latlon.art

The site is static. Build command: `npm run build`. Output directory: `dist/`. No server, database, or API key. Do not add the `@astrojs/vercel` adapter.

Pushing `main` runs `.github/workflows/pages.yml`. That workflow installs dependencies, runs `npm run build`, and deploys `dist/` to GitHub Pages. In the repository, set **Settings → Pages → Build and deployment → Source** to **GitHub Actions**.

`public/CNAME` contains `latlon.art` and is copied into `dist/`. `public/.nojekyll` is copied too, so a host that runs Jekyll does not drop the `_astro` assets.

At the registrar, point the domain at GitHub Pages. For the apex, use the four A records GitHub shows (currently `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`). For `www`, use a CNAME to the repository's `*.github.io` host. GitHub issues the certificate after the DNS and the CNAME file agree.

Any other static host can serve `dist/` the same way. Keep the map attribution visible.

## Left open

- Whether a finished TID should replace the filename as the public URL.
- Transient #21 has no UTC. The stamp has no time zone.
- Paris has no time zone.
- No altitude is recorded for these four. Central Park’s screen shows a figure that might be altitude; the label cannot be read.
- Meters are assumed when `altitude_m` is set. The page does not name a datum.
- Photographs in `public/transients/` are copies of images already on psem.me, with camera metadata removed and neutral filenames.
- No license is set. The footer links to psem.me until Peter chooses one.
