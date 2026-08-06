import { ensureSchema, json, trackView } from "../_lib.js";

export async function onRequestPost({ request, env }) {
  await ensureSchema(env);
  const body = await request.json().catch(() => ({}));
  await trackView(env, body.path || new URL(request.url).pathname);
  return json({ ok: true });
}
