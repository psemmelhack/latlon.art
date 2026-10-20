import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import test from "node:test";
import { archiveDocument, llmsText } from "../src/lib/archive.ts";
import { present } from "../src/lib/present.ts";
import {
  coordLine,
  parseLocalDay,
  stampFromIso,
  tidString,
  toUtcZ,
} from "../src/lib/spacetime.ts";

test("converts an explicit offset and refuses a bare zone name", () => {
  assert.equal(toUtcZ("2022-02-22T14:22:22-05:00"), "2022-02-22T19:22:22Z");
  assert.equal(toUtcZ("2021-03-14T14:26:14-04:00"), "2021-03-14T18:26:14Z");
  assert.throws(() => toUtcZ("2022-07-14T18:11:00 EST"), /numeric offset/);
});

test("prints signed decimals and the published TID shape", () => {
  assert.equal(coordLine("41.045437", "-72.352898"), "41.045437, -72.352898");
  assert.equal(
    tidString("34.0170201", "-118.4918021", "2024-01-18T23:32:13Z"),
    "34.0170201, -118.4918021,2024-01-18T23:32:13Z",
  );
  assert.equal(stampFromIso("2021-03-14T14:26:14-04:00"), "MARCH 14 2021 / 02:26:14PM");
  assert.equal(parseLocalDay("SEPT 14 2023 07:31PM"), "2023-09-14");
  assert.equal(parseLocalDay("JULY 14 2022 / 06:11PM"), "2022-07-14");
});

test("a privacy flag removes coordinates from the public record", () => {
  const hidden = present("person", {
    draft: true,
    hideCoordinates: true,
    latitude: "41.045437",
    longitude: "-72.352898",
    altitudeM: 12,
    utc: "2022-02-22T19:22:22Z",
    images: [],
  });
  assert.equal(hidden.hidden, true);
  assert.equal(hidden.coordLine, null);
  assert.equal(hidden.lat, null);
  assert.equal(hidden.lon, null);
  assert.equal(hidden.tid, null);
  assert.equal(JSON.stringify(hidden).includes("41.045437"), false);
  assert.equal(JSON.stringify(hidden).includes("-72.352898"), false);
  const stamped = present("transient-21", {
    draft: true,
    hideCoordinates: false,
    latitude: "41.045437",
    longitude: "-72.352898",
    localTime: "JULY 14 2022 / 06:11PM",
    timezone: "EST",
    images: [],
  });
  assert.equal(stamped.localLine, "JULY 14 2022 / 06:11PM");
  assert.equal(stamped.utc, null);
  const screen = present("central-park", {
    draft: true,
    hideCoordinates: false,
    localTime: "2021-03-14T14:26:14-04:00",
    timezone: "-04:00",
    utc: "2021-03-14T18:26:14Z",
    images: [],
  });
  assert.equal(screen.localLine, "MARCH 14 2021 / 02:26:14PM");
  assert.equal(screen.recordedLocal, "2021-03-14T14:26:14-04:00");
  const published = JSON.stringify(archiveDocument([hidden], "https://latlon.art"));
  assert.equal(published.includes("41.045437"), false);
  assert.equal(published.includes("-72.352898"), false);
  assert.equal(llmsText([hidden], "https://latlon.art").includes("41.045437"), false);
});

test("draft files match the published sources and stay unmarked as guesses", () => {
  const files = Object.fromEntries(
    readdirSync("src/content/transients")
      .filter((name: string) => name.endsWith(".md"))
      .map((name: string) => [name, readFileSync(`src/content/transients/${name}`, "utf8")]),
  );
  assert.deepEqual(Object.keys(files).sort(), [
    "central-park-2021.md",
    "creation-proofs-2.md",
    "paris-2023.md",
    "redondo-beach-2026.md",
    "transient-21.md",
  ]);

  for (const text of Object.values(files)) {
    assert.match(text, /^draft:\s*true\s*$/m);
    assert.doesNotMatch(text, /i see you/i);
  }

  assert.match(files["creation-proofs-2.md"], /utc:\s*"2022-02-22T19:22:22Z"/);
  assert.match(files["creation-proofs-2.md"], /FEBRUARY 22 2022 \/ 02:22:22PM/);
  assert.doesNotMatch(files["creation-proofs-2.md"], /latitude:/);
  assert.doesNotMatch(files["transient-21.md"], /^utc:/m);
  assert.doesNotMatch(files["transient-21.md"], /^timezone:/m);
  assert.match(files["transient-21.md"], /JULY 14 2022 \/ 06:11PM/);
  assert.doesNotMatch(files["transient-21.md"], /EST/);
  assert.doesNotMatch(files["creation-proofs-2.md"], /^timezone:/m);
  assert.doesNotMatch(files["central-park-2021.md"], /^timezone:/m);
  assert.match(files["transient-21.md"], /latitude:\s*"41\.045437"/);
  assert.match(files["transient-21.md"], /longitude:\s*"-72\.352898"/);
  assert.doesNotMatch(files["paris-2023.md"], /^timezone:/m);
  assert.match(files["paris-2023.md"], /latitude:\s*"48\.856603"/);
  assert.match(files["paris-2023.md"], /longitude:\s*"2\.342002"/);
  assert.match(files["central-park-2021.md"], /utc:\s*"2021-03-14T18:26:14Z"/);
  assert.match(files["central-park-2021.md"], /latitude:\s*"40\.778451"/);
  assert.doesNotMatch(files["central-park-2021.md"], /altitude_m:/);
  assert.match(files["redondo-beach-2026.md"], /latitude:\s*"33\.8344"/);
  assert.match(files["redondo-beach-2026.md"], /longitude:\s*"-118\.3832"/);
  assert.doesNotMatch(files["redondo-beach-2026.md"], /^utc:/m);
  assert.doesNotMatch(files["redondo-beach-2026.md"], /altitude_m:/);

  const readme = readFileSync("README.md", "utf8");
  const sources = [
    ...readme,
    ...readdirSync("src", { recursive: true }).map((name) =>
      String(name).endsWith(".md") || String(name).endsWith(".astro") || String(name).endsWith(".ts")
        ? readFileSync(`src/${name}`, "utf8")
        : "",
    ),
  ].join("\n");
  assert.doesNotMatch(sources, /i see you/i);
  assert.match(readme, /2022-02-22T19:22:22Z/);
  assert.doesNotMatch(sources, /Draft, pending Petrus/);
  assert.equal(readFileSync("public/CNAME", "utf8").trim(), "latlon.art");
  readFileSync("public/.nojekyll");
  const workflow = readFileSync(".github/workflows/pages.yml", "utf8");
  assert.match(workflow, /npm run build/);
  assert.match(workflow, /path: dist/);

  const layout = readFileSync("src/layouts/Base.astro", "utf8");
  assert.match(layout, /ui-monospace, Menlo, Consolas/);
  assert.doesNotMatch(layout, /Silkscreen|graph paper|punch/);
  assert.doesNotMatch(sources, /class="punch"|class="sheet"/);
});
