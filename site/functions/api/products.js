import { json, readBody, requireAuth, loadCollection, replaceCollection, slugify } from "./_lib.js";

export async function onRequestGet(context) {
  const list = await loadCollection(context.env.DB, "products");
  return json(200, list);
}

export async function onRequestPut(context) {
  if (!(await requireAuth(context))) return json(401, { error: "需要管理员登录" });
  const payload = await readBody(context.request);
  if (!Array.isArray(payload)) return json(400, { error: "需要数组格式" });

  const normalized = payload.map((item, index) => {
    const id = slugify(item.id || item.name || item.title || `product-${index + 1}`);
    return { ...item, id: id || `product-${index + 1}` };
  });

  await replaceCollection(context.env.DB, "products", normalized, (item) => item.id);
  return json(200, normalized);
}
