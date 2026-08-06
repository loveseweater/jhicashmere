import { ensureSchema, json, readJson, readPosts, requireAdmin, savePosts } from "../_lib.js";

export async function onRequestGet({ env }) {
  await ensureSchema(env);
  return json(await readPosts(env));
}

export async function onRequestPut({ request, env }) {
  const admin = await requireAdmin(request, env);
  if (!admin) {
    return json({ error: "Admin login required" }, { status: 401 });
  }
  const body = await readJson(request);
  if (!Array.isArray(body)) {
    return json({ error: "Expected an array" }, { status: 400 });
  }
  return json(await savePosts(env, body));
}
