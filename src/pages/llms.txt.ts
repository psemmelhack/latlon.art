import type { APIRoute } from "astro";
import { llmsText, originOf } from "../lib/archive.ts";
import { loadRecords } from "../lib/records.ts";

export const prerender = true;

export const GET: APIRoute = async ({ site }) => {
  const records = await loadRecords();
  return new Response(llmsText(records, originOf(site)), {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
};
