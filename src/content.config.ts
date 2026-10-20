import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";
import { SpacetimeError, normalizeUtc } from "./lib/spacetime.ts";

const decimal = z
  .string()
  .trim()
  .regex(
    /^-?\d+(\.\d+)?$/,
    "Quote a signed decimal, with no N/S/E/W and no degree sign.",
  );

const image = z.object({
  src: z
    .string()
    .trim()
    .min(1)
    .refine(
      (value) => value.startsWith("/") || value.startsWith("https://"),
      "Image src must be a site path starting with / or an https URL.",
    ),
  alt: z.string().trim().min(1, "Each image needs alt text."),
  caption: z.string().trim().min(1).optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
});

const transients = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/transients" }),
  schema: z
    .strictObject({
      title: z.string().trim().min(1).optional(),
      number: z.number().int().positive().optional(),
      draft: z.boolean().default(false),
      hide_coordinates: z.boolean().default(false),
      latitude: decimal.optional(),
      longitude: decimal.optional(),
      altitude_m: z.number().optional(),
      utc: z.string().optional(),
      local_time: z.string().trim().min(1).optional(),
      timezone: z.string().trim().min(1).optional(),
      place: z.string().trim().min(1).optional(),
      medium: z.string().trim().min(1).optional(),
      source: z
        .string()
        .trim()
        .refine((value) => value.startsWith("https://"), "Source must be an https URL.")
        .optional(),
      images: z.array(image).default([]),
    })
    .superRefine((value, ctx) => {
      if ((value.latitude == null) !== (value.longitude == null)) {
        ctx.addIssue({
          code: "custom",
          message: "Latitude and longitude are written together, or both left out.",
        });
      }
      if (value.utc) {
        try {
          normalizeUtc(value.utc);
        } catch (error) {
          ctx.addIssue({
            code: "custom",
            message:
              error instanceof SpacetimeError
                ? error.message
                : "UTC must be ISO 8601 ending in Z.",
          });
        }
      }
    }),
});

export const collections = { transients };
