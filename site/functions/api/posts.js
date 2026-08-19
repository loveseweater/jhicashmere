import { json, readBody, requireAuth, loadCollection, replaceCollection, slugify } from "./_lib.js";

export async function onRequestGet(context) {
  const list = await loadCollection(context.env.DB, "posts");
  return json(200, list);
}

export async function onRequestPut(context) {
  if (!(await requireAuth(context))) return json(401, { error: "需要管理员登录" });
  const payload = await readBody(context.request);
  if (!Array.isArray(payload)) return json(400, { error: "需要数组格式" });

  const normalized = payload.map((item, index) => {
    const id = slugify(item.slug || item.id || item.title || `post-${index + 1}`);
    return { ...item, slug: id || `post-${index + 1}` };
  });

  await replaceCollection(context.env.DB, "posts", normalized, (item) => item.slug);
  return json(200, normalized);
}
