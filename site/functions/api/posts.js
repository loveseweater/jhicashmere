import { ensureSchema, json, readJson, readPosts, requireAdmin, savePosts } from "../_lib.js";

export async function onRequestGet({ env }) {
  await ensureSchema(env);
  return json(await readPosts(env));
}

export async function onRequestPut({ request, env }) {
  const admin = await requireAdmin(request, env);
  if (!admin) {
    return json({ error: "需要管理员登录" }, { status: 401 });
  }
  const body = await readJson(request);
  if (!Array.isArray(body)) {
    return json({ error: "需要数组格式" }, { status: 400 });
  }
  return json(await savePosts(env, body));
}
