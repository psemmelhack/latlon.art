// @ts-check
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
  site: "https://latlon.art",
  output: "static",
  trailingSlash: "never",
  vite: {
    worker: {
      format: "es",
    },
  },
});
