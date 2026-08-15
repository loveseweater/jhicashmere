import { defaultPosts, defaultProducts } from "./_defaults.js";

const encoder = new TextEncoder();
const contentVersion = "20260815d";
let schemaReady = false;
let seedReady = false;
const defaultProductById = new Map(defaultProducts.map((item) => [item.id, item]));
const defaultPostById = new Map(defaultPosts.map((item) => [item.id, item]));
const defaultProductIds = new Set(defaultProducts.map((item) => item.id));
const defaultPostIds = new Set(defaultPosts.map((item) => item.id));

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
  const secret = env.ADMIN_PASSWORD;
  if (!secret) return null;
  const auth = request.headers.get("Authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  return verifyToken(token, secret);
}

function rowToProduct(row) {
  const fallback = defaultProductById.get(row.id) || {};
  const image = isPlaceholderImage(row.image) ? fallback.image || row.image || "" : row.image || fallback.image || "";
  const gallery = normalizeGallery(row.gallery, image);
  const fallbackGallery = Array.isArray(fallback.gallery) ? fallback.gallery : [];
  return {
    id: row.id,
    name: row.name,
    sku: row.sku || "",
    category: row.category,
    channel: row.channel || "both",
    colors: row.colors,
    subtitle: row.subtitle || "",
    description: row.description,
    bullets: normalizeLines(row.bullets),
    material: row.material || "",
    sizeRange: row.sizeRange || "",
    fit: row.fit || "",
    care: row.care || "",
    occasion: row.occasion || "",
    searchKeywords: row.searchKeywords || "",
    seoDescription: row.seoDescription || "",
    price: row.price,
    status: row.status,
    amazonUrl: row.amazonUrl || "",
    amazonLabel: row.amazonLabel || "View on Amazon",
    tone: row.tone || "ivory",
    image,
    gallery: gallery.length && !gallery.every(isPlaceholderImage) ? gallery : (fallbackGallery.length ? fallbackGallery : gallery)
  };
}

function normalizeLines(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === "string" && value.trim().startsWith("[")) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // fall through to newline parsing
    }
  }
  if (typeof value === "string" && value.trim()) {
    return value
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

function normalizeGallery(value, fallbackImage) {
  if (Array.isArray(value) && value.length) return value;
  if (typeof value === "string" && value.trim().startsWith("[")) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed) && parsed.length) return parsed;
    } catch {
      // fall through to newline parsing
    }
  }
  if (typeof value === "string" && value.trim()) {
    return value
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [fallbackImage];
}

async function ensureColumn(env, table, column, definition) {
  const info = await env.DB.prepare(`PRAGMA table_info(${table})`).all();
  const exists = (info.results || []).some((item) => item.name === column);
  if (!exists) {
    await env.DB.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

function rowToPost(row) {
  const fallback = defaultPostById.get(row.id) || {};
  return {
    id: row.id,
    slug: row.slug || row.id,
    title: row.title,
    date: row.date,
    excerpt: row.excerpt,
    content: row.content,
    seoTitle: row.seoTitle || "",
    seoDescription: row.seoDescription || "",
    image: isPlaceholderImage(row.image) ? fallback.image || row.image || "assets/jni-cashmere-hero.png" : row.image || fallback.image || "assets/jni-cashmere-hero.png",
    imageAlt: row.imageAlt || row.title || ""
  };
}

function isPlaceholderImage(value) {
  const src = String(value || "").trim();
  return !src || src.startsWith("assets/");
}

export async function ensureSchema(env) {
  if (schemaReady || !env.DB) return;
  await env.DB.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      sku TEXT NOT NULL DEFAULT '',
      category TEXT NOT NULL,
      channel TEXT NOT NULL DEFAULT 'both',
      colors TEXT NOT NULL,
      subtitle TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL,
      bullets TEXT NOT NULL DEFAULT '',
      material TEXT NOT NULL DEFAULT '',
      sizeRange TEXT NOT NULL DEFAULT '',
      fit TEXT NOT NULL DEFAULT '',
      care TEXT NOT NULL DEFAULT '',
      occasion TEXT NOT NULL DEFAULT '',
      searchKeywords TEXT NOT NULL DEFAULT '',
      seoDescription TEXT NOT NULL DEFAULT '',
      price TEXT NOT NULL,
      status TEXT NOT NULL,
      amazonUrl TEXT NOT NULL DEFAULT '',
      amazonLabel TEXT NOT NULL DEFAULT 'View on Amazon',
      tone TEXT NOT NULL DEFAULT 'ivory',
      image TEXT NOT NULL DEFAULT 'assets/real-cashmere-hero-jinhexi.webp',
      gallery TEXT NOT NULL DEFAULT ''
    );
    CREATE TABLE IF NOT EXISTS posts (
      id TEXT PRIMARY KEY,
      slug TEXT NOT NULL DEFAULT '',
      title TEXT NOT NULL,
      date TEXT NOT NULL,
      excerpt TEXT NOT NULL,
      content TEXT NOT NULL,
      seoTitle TEXT NOT NULL DEFAULT '',
      seoDescription TEXT NOT NULL DEFAULT '',
      image TEXT NOT NULL DEFAULT 'assets/jni-cashmere-hero.png',
      imageAlt TEXT NOT NULL DEFAULT ''
    );
    CREATE TABLE IF NOT EXISTS views (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      path TEXT NOT NULL,
      createdAt TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
  await ensureColumn(env, "products", "channel", "TEXT NOT NULL DEFAULT 'both'");
  await ensureColumn(env, "products", "category", "TEXT NOT NULL DEFAULT 'others'");
  await ensureColumn(env, "products", "gallery", "TEXT NOT NULL DEFAULT ''");
  await ensureColumn(env, "products", "sku", "TEXT NOT NULL DEFAULT ''");
  await ensureColumn(env, "products", "subtitle", "TEXT NOT NULL DEFAULT ''");
  await ensureColumn(env, "products", "bullets", "TEXT NOT NULL DEFAULT ''");
  await ensureColumn(env, "products", "material", "TEXT NOT NULL DEFAULT ''");
  await ensureColumn(env, "products", "sizeRange", "TEXT NOT NULL DEFAULT ''");
  await ensureColumn(env, "products", "fit", "TEXT NOT NULL DEFAULT ''");
  await ensureColumn(env, "products", "care", "TEXT NOT NULL DEFAULT ''");
  await ensureColumn(env, "products", "occasion", "TEXT NOT NULL DEFAULT ''");
  await ensureColumn(env, "products", "searchKeywords", "TEXT NOT NULL DEFAULT ''");
  await ensureColumn(env, "products", "seoDescription", "TEXT NOT NULL DEFAULT ''");
  await ensureColumn(env, "posts", "slug", "TEXT NOT NULL DEFAULT ''");
  await ensureColumn(env, "posts", "seoTitle", "TEXT NOT NULL DEFAULT ''");
  await ensureColumn(env, "posts", "seoDescription", "TEXT NOT NULL DEFAULT ''");
  await ensureColumn(env, "posts", "image", "TEXT NOT NULL DEFAULT 'assets/jni-cashmere-hero.png'");
  await ensureColumn(env, "posts", "imageAlt", "TEXT NOT NULL DEFAULT ''");
  schemaReady = true;
}

export async function seedIfNeeded(env) {
  if (seedReady || !env.DB) return;
  const productCount = await env.DB.prepare("SELECT COUNT(*) AS count FROM products").first();
  const postCount = await env.DB.prepare("SELECT COUNT(*) AS count FROM posts").first();
  const versionRow = await env.DB.prepare("SELECT value FROM meta WHERE key = ? LIMIT 1").bind("content_version").first();
  const productRows = await env.DB.prepare("SELECT id FROM products").all();
  const postRows = await env.DB.prepare("SELECT id FROM posts").all();
  const productIds = new Set((productRows.results || []).map((row) => row.id));
  const postIds = new Set((postRows.results || []).map((row) => row.id));
  const needsReset =
    (versionRow?.value || "") !== contentVersion ||
    !defaultProductIds.size ||
    !defaultPostIds.size ||
    !defaultProducts.every((item) => productIds.has(item.id)) ||
    !defaultPosts.every((item) => postIds.has(item.id));
  if (needsReset || (productCount?.count || 0) === 0) {
    await env.DB.prepare("DELETE FROM products").run();
    await env.DB.prepare("DELETE FROM posts").run();
    for (const product of defaultProducts) {
      await env.DB.prepare(`
        INSERT OR IGNORE INTO products
        (id, name, sku, category, channel, colors, subtitle, description, bullets, material, sizeRange, fit, care, occasion, searchKeywords, seoDescription, price, status, amazonUrl, amazonLabel, tone, image, gallery)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        product.id,
        product.name,
        product.sku || "",
        product.category,
        product.channel || "both",
        product.colors,
        product.subtitle || "",
        product.description,
        JSON.stringify(normalizeLines(product.bullets)),
        product.material || "",
        product.sizeRange || "",
        product.fit || "",
        product.care || "",
        product.occasion || "",
        product.searchKeywords || "",
        product.seoDescription || "",
        product.price,
        product.status,
        product.amazonUrl || "",
        product.amazonLabel || "View on Amazon",
        product.tone || "ivory",
        product.image || "assets/real-cashmere-hero-jinhexi.webp",
        JSON.stringify(normalizeGallery(product.gallery, product.image || "assets/real-cashmere-hero-jinhexi.webp"))
      ).run();
    }
    for (const post of defaultPosts) {
      await env.DB.prepare(`
        INSERT OR REPLACE INTO posts
        (id, slug, title, date, excerpt, content, seoTitle, seoDescription, image, imageAlt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        post.id,
        post.slug || post.id,
        post.title,
        post.date,
        post.excerpt,
        post.content,
        post.seoTitle || "",
        post.seoDescription || "",
        post.image || "assets/jni-cashmere-hero.png",
        post.imageAlt || post.title || ""
      ).run();
    }
    await env.DB.prepare("INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)").bind("content_version", contentVersion).run();
  } else if ((postCount?.count || 0) === 0) {
    for (const post of defaultPosts) {
      await env.DB.prepare(`
        INSERT OR REPLACE INTO posts
        (id, slug, title, date, excerpt, content, seoTitle, seoDescription, image, imageAlt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        post.id,
        post.slug || post.id,
        post.title,
        post.date,
        post.excerpt,
        post.content,
        post.seoTitle || "",
        post.seoDescription || "",
        post.image || "assets/jni-cashmere-hero.png",
        post.imageAlt || post.title || ""
      ).run();
    }
    await env.DB.prepare("INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)").bind("content_version", contentVersion).run();
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
    id: slugify(item.id || item.name),
    gallery: normalizeGallery(item.gallery, item.image || "assets/real-cashmere-hero-jinhexi.webp"),
    bullets: normalizeLines(item.bullets)
  }));
  await env.DB.prepare("DELETE FROM products").run();
  await env.DB.batch(
    normalized.map((item) =>
      env.DB.prepare(`
        INSERT OR REPLACE INTO products
        (id, name, sku, category, channel, colors, subtitle, description, bullets, material, sizeRange, fit, care, occasion, searchKeywords, seoDescription, price, status, amazonUrl, amazonLabel, tone, image, gallery)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        item.id,
        item.name || "Untitled Product",
        item.sku || "",
        item.category || "Knitwear",
        item.channel || "both",
        item.colors || "",
        item.subtitle || "",
        item.description || "",
        JSON.stringify(item.bullets || []),
        item.material || "",
        item.sizeRange || "",
        item.fit || "",
        item.care || "",
        item.occasion || "",
        item.searchKeywords || "",
        item.seoDescription || "",
        item.price || "",
        item.status || "Draft",
        item.amazonUrl || "",
        item.amazonLabel || "View on Amazon",
        item.tone || "ivory",
        item.image || "assets/real-cashmere-hero-jinhexi.webp",
        JSON.stringify(item.gallery || [])
      )
    )
  );
  await env.DB.prepare("INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)").bind("content_version", contentVersion).run();
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
        (id, slug, title, date, excerpt, content, seoTitle, seoDescription, image, imageAlt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        item.id,
        item.slug || item.id,
        item.title || "Untitled Post",
        item.date || new Date().toISOString().slice(0, 10),
        item.excerpt || "",
        item.content || "",
        item.seoTitle || "",
        item.seoDescription || "",
        item.image || "assets/jni-cashmere-hero.png",
        item.imageAlt || item.title || ""
      )
    )
  );
  await env.DB.prepare("INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)").bind("content_version", contentVersion).run();
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
