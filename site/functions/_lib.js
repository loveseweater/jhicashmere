import { defaultPosts, defaultProducts } from "./_defaults.js";

const encoder = new TextEncoder();
let schemaReady = false;
let seedReady = false;

function base64UrlEncode(input) {
  const bytes = input instanceof Uint8Array ? input : encoder.encode(String(input));
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function base64UrlDecode(input) {
  const normalized = String(input).replaceAll("-", "+").replaceAll("_", "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function hmac(secret, message) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return base64UrlEncode(new Uint8Array(sig));
}

export function json(data, init = {}) {
  return new Response(JSON.stringify(data, null, 2), {
    status: init.status || 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...(init.headers || {})
    }
  });
}

export async function readJson(request) {
  const text = await request.text();
  return text ? JSON.parse(text) : {};
}

export function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export async function createToken(payload, secret) {
  const body = base64UrlEncode(JSON.stringify(payload));
  const sig = await hmac(secret, body);
  return `${body}.${sig}`;
}

export async function verifyToken(token, secret) {
  const [body, sig] = String(token || "").split(".");
  if (!body || !sig) return null;
  const expected = await hmac(secret, body);
  if (expected !== sig) return null;
  const payload = JSON.parse(new TextDecoder().decode(base64UrlDecode(body)));
  if (payload.exp && Date.now() > payload.exp) return null;
  return payload;
}

export async function requireAdmin(request, env) {
  const secret = env.ADMIN_PASSWORD || "jinhexi2026";
  const auth = request.headers.get("Authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  return verifyToken(token, secret);
}

function rowToProduct(row) {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    colors: row.colors,
    description: row.description,
    price: row.price,
    status: row.status,
    amazonUrl: row.amazonUrl || "",
    amazonLabel: row.amazonLabel || "View on Amazon",
    tone: row.tone || "ivory",
    image: row.image || "assets/products/cashmere-ivory.svg"
  };
}

function rowToPost(row) {
  return {
    id: row.id,
    slug: row.slug || row.id,
    title: row.title,
    date: row.date,
    excerpt: row.excerpt,
    content: row.content,
    seoTitle: row.seoTitle || "",
    seoDescription: row.seoDescription || ""
  };
}

export async function ensureSchema(env) {
  if (schemaReady || !env.DB) return;
  await env.DB.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      colors TEXT NOT NULL,
      description TEXT NOT NULL,
      price TEXT NOT NULL,
      status TEXT NOT NULL,
      amazonUrl TEXT NOT NULL DEFAULT '',
      amazonLabel TEXT NOT NULL DEFAULT 'View on Amazon',
      tone TEXT NOT NULL DEFAULT 'ivory',
      image TEXT NOT NULL DEFAULT 'assets/products/cashmere-ivory.svg'
    );
    CREATE TABLE IF NOT EXISTS posts (
      id TEXT PRIMARY KEY,
      slug TEXT NOT NULL DEFAULT '',
      title TEXT NOT NULL,
      date TEXT NOT NULL,
      excerpt TEXT NOT NULL,
      content TEXT NOT NULL,
      seoTitle TEXT NOT NULL DEFAULT '',
      seoDescription TEXT NOT NULL DEFAULT ''
    );
    CREATE TABLE IF NOT EXISTS views (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      path TEXT NOT NULL,
      createdAt TEXT NOT NULL
    );
  `);
  schemaReady = true;
}

export async function seedIfNeeded(env) {
  if (seedReady || !env.DB) return;
  const productCount = await env.DB.prepare("SELECT COUNT(*) AS count FROM products").first();
  const postCount = await env.DB.prepare("SELECT COUNT(*) AS count FROM posts").first();
  if ((productCount?.count || 0) === 0) {
    for (const product of defaultProducts) {
      await env.DB.prepare(`
        INSERT OR REPLACE INTO products
        (id, name, category, colors, description, price, status, amazonUrl, amazonLabel, tone, image)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        product.id,
        product.name,
        product.category,
        product.colors,
        product.description,
        product.price,
        product.status,
        product.amazonUrl || "",
        product.amazonLabel || "View on Amazon",
        product.tone || "ivory",
        product.image || "assets/products/cashmere-ivory.svg"
      ).run();
    }
  }
  if ((postCount?.count || 0) === 0) {
    for (const post of defaultPosts) {
      await env.DB.prepare(`
        INSERT OR REPLACE INTO posts
        (id, slug, title, date, excerpt, content, seoTitle, seoDescription)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        post.id,
        post.slug || post.id,
        post.title,
        post.date,
        post.excerpt,
        post.content,
        post.seoTitle || "",
        post.seoDescription || ""
      ).run();
    }
  }
  seedReady = true;
}

export async function readProducts(env) {
  if (!env.DB) return defaultProducts;
  await ensureSchema(env);
  await seedIfNeeded(env);
  const { results } = await env.DB.prepare("SELECT * FROM products ORDER BY rowid ASC").all();
  return results.map(rowToProduct);
}

export async function readPosts(env) {
  if (!env.DB) return defaultPosts;
  await ensureSchema(env);
  await seedIfNeeded(env);
  const { results } = await env.DB.prepare("SELECT * FROM posts ORDER BY date DESC, rowid ASC").all();
  return results.map(rowToPost);
}

export async function readPostBySlug(env, slug) {
  if (!env.DB) {
    return defaultPosts.find((post) => (post.slug || post.id) === slug) || null;
  }
  await ensureSchema(env);
  await seedIfNeeded(env);
  const row = await env.DB.prepare("SELECT * FROM posts WHERE slug = ? OR id = ? LIMIT 1").bind(slug, slug).first();
  return row ? rowToPost(row) : null;
}

export async function saveProducts(env, payload) {
  await ensureSchema(env);
  const normalized = payload.map((item) => ({
    ...item,
    id: slugify(item.id || item.name)
  }));
  await env.DB.batch(
    normalized.map((item) =>
      env.DB.prepare(`
        INSERT OR REPLACE INTO products
        (id, name, category, colors, description, price, status, amazonUrl, amazonLabel, tone, image)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        item.id,
        item.name || "Untitled Product",
        item.category || "Knitwear",
        item.colors || "",
        item.description || "",
        item.price || "",
        item.status || "Draft",
        item.amazonUrl || "",
        item.amazonLabel || "View on Amazon",
        item.tone || "ivory",
        item.image || "assets/products/cashmere-ivory.svg"
      )
    )
  );
  return normalized;
}

export async function savePosts(env, payload) {
  await ensureSchema(env);
  const normalized = payload.map((item) => ({
    ...item,
    id: slugify(item.id || item.title),
    slug: slugify(item.slug || item.title)
  }));
  await env.DB.batch(
    normalized.map((item) =>
      env.DB.prepare(`
        INSERT OR REPLACE INTO posts
        (id, slug, title, date, excerpt, content, seoTitle, seoDescription)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        item.id,
        item.slug || item.id,
        item.title || "Untitled Post",
        item.date || new Date().toISOString().slice(0, 10),
        item.excerpt || "",
        item.content || "",
        item.seoTitle || "",
        item.seoDescription || ""
      )
    )
  );
  return normalized;
}

export async function trackView(env, path) {
  if (!env.DB) return;
  await ensureSchema(env);
  await env.DB.prepare(
    "INSERT INTO views (path, createdAt) VALUES (?, ?)"
  ).bind(path || "/", new Date().toISOString()).run();
}

export async function readStats(env) {
  if (!env.DB) {
    return {
      totalViews: 0,
      todayViews: 0,
      productCount: defaultProducts.length,
      postCount: defaultPosts.length,
      topPages: []
    };
  }
  await ensureSchema(env);
  await seedIfNeeded(env);
  const totalViewsRow = await env.DB.prepare("SELECT COUNT(*) AS count FROM views").first();
  const todayPrefix = new Date().toISOString().slice(0, 10);
  const todayViewsRow = await env.DB.prepare("SELECT COUNT(*) AS count FROM views WHERE createdAt LIKE ?").bind(`${todayPrefix}%`).first();
  const productCountRow = await env.DB.prepare("SELECT COUNT(*) AS count FROM products").first();
  const postCountRow = await env.DB.prepare("SELECT COUNT(*) AS count FROM posts").first();
  const { results } = await env.DB.prepare(`
    SELECT path, COUNT(*) AS views
    FROM views
    GROUP BY path
    ORDER BY views DESC, path ASC
    LIMIT 10
  `).all();
  return {
    totalViews: Number(totalViewsRow?.count || 0),
    todayViews: Number(todayViewsRow?.count || 0),
    productCount: Number(productCountRow?.count || 0),
    postCount: Number(postCountRow?.count || 0),
    topPages: results || []
  };
}
