import { json, requireAuth } from "./_lib.js";

export async function onRequestGet(context) {
  if (!(await requireAuth(context))) return json(401, { error: "需要管理员登录" });

  const db = context.env.DB;
  const viewsRow = await db.prepare("SELECT COUNT(*) AS c FROM views").first();
  const todayRow = await db
    .prepare("SELECT COUNT(*) AS c FROM views WHERE date(created_at) = date('now')")
    .first();
  const productRow = await db.prepare("SELECT COUNT(*) AS c FROM products").first();
  const postRow = await db.prepare("SELECT COUNT(*) AS c FROM posts").first();
  const topRows = await db
    .prepare("SELECT path, COUNT(*) AS c FROM views GROUP BY path ORDER BY c DESC, path ASC LIMIT 10")
    .all();

  return json(200, {
    totalViews: viewsRow ? viewsRow.c : 0,
    todayViews: todayRow ? todayRow.c : 0,
    productCount: productRow ? productRow.c : 0,
    postCount: postRow ? postRow.c : 0,
    topPages: (topRows.results || []).map((r) => ({ path: r.path, views: r.c })),
  });
}
