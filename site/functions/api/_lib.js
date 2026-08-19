// Shared helpers for JINHEXI Cloudflare Pages Functions

export function json(status, payload, type = "application/json; charset=utf-8") {
  return new Response(JSON.stringify(payload, null, 2), {
    status,
    headers: { "Content-Type": type, "Cache-Control": "no-store" },
  });
}

export async function readBody(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function b64url(input) {
  return btoa(String.fromCharCode(...new Uint8Array(input)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function b64urlDecode(input) {
  const pad = input.length % 4 === 0 ? "" : "=".repeat(4 - (input.length % 4));
  const b64 = input.replace(/-/g, "+").replace(/_/g, "/") + pad;
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

async function hmac(key, data) {
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, enc.encode(data));
  return b64url(sig);
}

// Stateless signed token: payload.exp + hmac
export async function signToken(secret, ttlSeconds = 7 * 24 * 3600) {
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const payload = b64url(new TextEncoder().encode(JSON.stringify({ role: "admin", exp })));
  const sig = await hmac(secret, payload);
  return `${payload}.${sig}`;
}

export async function verifyToken(secret, token) {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [payload, sig] = parts;
  const expected = await hmac(secret, payload);
  if (expected !== sig) return false;
  try {
    const data = JSON.parse(new TextDecoder().decode(b64urlDecode(payload)));
    if (!data.exp || data.exp < Math.floor(Date.now() / 1000)) return false;
    return data.role === "admin";
  } catch {
    return false;
  }
}

export function getToken(request) {
  const auth = request.headers.get("Authorization") || "";
  return auth.startsWith("Bearer ") ? auth.slice(7) : "";
}

// Returns true if authorized, else writes a 401 response.
export async function requireAuth(context) {
  const secret = context.env.JINHEXI_ADMIN_PASSWORD || "";
  if (!secret) return false;
  const ok = await verifyToken(secret, getToken(context.request));
  if (ok) return true;
  return false;
}

// Load all rows of a collection as parsed JSON array.
export async function loadCollection(db, table) {
  const { results } = await db.prepare(`SELECT data FROM ${table} ORDER BY rowid`).all();
  return (results || []).map((r) => {
    try {
      return JSON.parse(r.data);
    } catch {
      return {};
    }
  });
}

// Replace an entire collection atomically.
export async function replaceCollection(db, table, items, idOf) {
  await db.batch([
    db.prepare(`DELETE FROM ${table}`),
    ...items.map((item) =>
      db
        .prepare(`INSERT OR REPLACE INTO ${table} (id, data) VALUES (?, ?)`)
        .bind(idOf(item), JSON.stringify(item))
    ),
  ]);
}
