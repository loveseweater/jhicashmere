import { ensureSchema, json, readStats } from "../_lib.js";

export async function onRequestGet({ request, env, url }) {
  await ensureSchema(env);
  return json(await readStats(env));
}
