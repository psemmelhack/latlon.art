import type { APIRoute } from "astro";
import { archiveDocument, originOf } from "../lib/archive.ts";
import { loadRecords } from "../lib/records.ts";

export const prerender = true;

export const GET: APIRoute = async ({ site }) => {
  const records = await loadRecords();
  const body = `${JSON.stringify(archiveDocument(records, originOf(site)), null, 2)}\n`;
  return new Response(body, {
    headers: { "content-type": "application/json; charset=utf-8" },
  });
};
