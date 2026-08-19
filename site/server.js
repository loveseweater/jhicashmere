const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const root = __dirname;
const dataDir = path.join(root, "data");
const port = Number(process.env.PORT || 4173);
const adminPassword = process.env.JINHEXI_ADMIN_PASSWORD;
const sessions = new Set();
const views = [];

if (!adminPassword) {
  console.error("请先设置 JINHEXI_ADMIN_PASSWORD，再启动本地后台服务。");
  process.exit(1);
}

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml; charset=utf-8"
};

function send(res, status, body, type = "application/json; charset=utf-8") {
  res.writeHead(status, { "Content-Type": type, "Cache-Control": "no-store" });
  res.end(body);
}

function json(res, status, payload) {
  send(res, status, JSON.stringify(payload, null, 2));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 2_000_000) {
        reject(new Error("Request body is too large"));
      }
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

function readJson(name) {
  const file = path.join(dataDir, `${name}.json`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeJson(name, data) {
  const file = path.join(dataDir, `${name}.json`);
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function buildSitemap() {
  const base = "https://jhicashmere.com";
  const products = readJson("products");
  const posts = readJson("posts");
  const urls = [
    `${base}/`,
    `${base}/collection.html`,
    `${base}/journal.html`,
    ...products.map((product) => `${base}/product.html?id=${encodeURIComponent(product.id || product.name || "")}`),
    ...posts.map((post) => `${base}/journal.html?post=${encodeURIComponent(post.slug || post.id || "")}`)
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((url) => `  <url>\n    <loc>${url}</loc>\n  </url>`).join("\n")}\n</urlset>\n`;
}

function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function getToken(req) {
  const auth = req.headers.authorization || "";
  return auth.startsWith("Bearer ") ? auth.slice(7) : "";
}

function requireAuth(req, res) {
  if (sessions.has(getToken(req))) {
    return true;
  }
  json(res, 401, { error: "需要管理员登录" });
  return false;
}

async function handleApi(req, res, pathname) {
  if (pathname === "/api/login" && req.method === "POST") {
    const body = JSON.parse((await readBody(req)) || "{}");
    if (body.password !== adminPassword) {
      json(res, 403, { error: "密码不正确" });
      return;
    }
    const token = crypto.randomBytes(24).toString("hex");
    sessions.add(token);
    json(res, 200, { token });
    return;
  }

  if (pathname === "/api/track" && req.method === "POST") {
    const body = JSON.parse((await readBody(req)) || "{}");
    views.push({ path: body.path || "/", createdAt: new Date().toISOString() });
    json(res, 200, { ok: true });
    return;
  }

  if (pathname === "/api/stats" && req.method === "GET") {
    const totalViews = views.length;
    const todayPrefix = new Date().toISOString().slice(0, 10);
    const todayViews = views.filter((item) => item.createdAt.startsWith(todayPrefix)).length;
    const productCount = readJson("products").length;
    const postCount = readJson("posts").length;
    const topMap = new Map();
    for (const item of views) {
      topMap.set(item.path, (topMap.get(item.path) || 0) + 1);
    }
    const topPages = [...topMap.entries()]
      .map(([pathName, count]) => ({ path: pathName, views: count }))
      .sort((a, b) => b.views - a.views || a.path.localeCompare(b.path))
      .slice(0, 10);
    json(res, 200, { totalViews, todayViews, productCount, postCount, topPages });
    return;
  }

  const match = pathname.match(/^\/api\/(products|posts)$/);
  if (!match) {
    json(res, 404, { error: "未找到接口" });
    return;
  }

  const name = match[1];
  if (req.method === "GET") {
    json(res, 200, readJson(name));
    return;
  }

  if (!requireAuth(req, res)) {
    return;
  }

  if (req.method === "PUT") {
    const payload = JSON.parse((await readBody(req)) || "[]");
    if (!Array.isArray(payload)) {
      json(res, 400, { error: "需要数组格式" });
      return;
    }
    const normalized = payload.map((item) => ({
      ...item,
      id: slugify(item.id || item.name || item.title || crypto.randomUUID())
    }));
    writeJson(name, normalized);
    json(res, 200, normalized);
    return;
  }

  json(res, 405, { error: "不允许的请求方法" });
}

function handleSpecial(req, res, pathname) {
  if (pathname === "/sitemap.xml") {
    send(res, 200, buildSitemap(), "application/xml; charset=utf-8");
    return true;
  }
  return false;
}

function serveStatic(req, res, pathname) {
  const cleanPath = pathname === "/" ? "/index.html" : decodeURIComponent(pathname);
  const target = path.resolve(root, `.${cleanPath}`);
  const relativeTarget = path.relative(root, target);
  if (relativeTarget.startsWith("..") || path.isAbsolute(relativeTarget)) {
    send(res, 403, "Forbidden", "text/plain; charset=utf-8");
    return;
  }
  fs.readFile(target, (error, data) => {
    if (error) {
      send(res, 404, "Not found", "text/plain; charset=utf-8");
      return;
    }
    const type = mimeTypes[path.extname(target).toLowerCase()] || "application/octet-stream";
    send(res, 200, data, type);
  });
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    if (handleSpecial(req, res, url.pathname)) {
      return;
    }
    if (url.pathname.startsWith("/api/")) {
      await handleApi(req, res, url.pathname);
      return;
    }
    serveStatic(req, res, url.pathname);
  } catch (error) {
    json(res, 500, { error: error.message });
  }
});

server.listen(port, () => {
  console.log(`JINHEXI site running at http://localhost:${port}`);
  console.log(`Admin: http://localhost:${port}/admin.html`);
});
