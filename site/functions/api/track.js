import { json, readBody } from "./_lib.js";

// Lightweight page-view tracker backed by D1.
export async function onRequestPost(context) {
  const body = await readBody(context.request);
  const path = String((body && body.path) || "/").slice(0, 300);
  await context.env.DB.prepare("INSERT INTO views (path, created_at) VALUES (?, datetime('now'))").bind(path).run();
  return json(200, { ok: true });
}
