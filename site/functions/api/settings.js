import { json, readBody, requireAuth } from "./_lib.js";

// GET: return all settings as a flat object { key: value }
export async function onRequestGet(context) {
  const { results } = await context.env.DB.prepare("SELECT key, value FROM settings ORDER BY rowid").all();
  const settings = {};
  (results || []).forEach((r) => {
    settings[r.key] = r.value;
  });
  return json(200, settings);
}

// PUT: upsert an object { key: value, ... }
export async function onRequestPut(context) {
  if (!(await requireAuth(context))) return json(401, { error: "需要管理员登录" });
  const payload = await readBody(context.request);
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return json(400, { error: "需要对象格式" });
  }
  const db = context.env.DB;
  await db.batch(
    Object.entries(payload).map(([key, value]) =>
      db
        .prepare(
          "INSERT INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now')) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')"
        )
        .bind(key, String(value ?? ""))
    )
  );
  const { results } = await db.prepare("SELECT key, value FROM settings ORDER BY rowid").all();
  const settings = {};
  (results || []).forEach((r) => {
    settings[r.key] = r.value;
  });
  return json(200, settings);
}
