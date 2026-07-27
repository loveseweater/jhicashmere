const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const root = __dirname;
const dataDir = path.join(root, "data");
const port = Number(process.env.PORT || 4173);
const adminPassword = process.env.JHI_ADMIN_PASSWORD || "jhi2026";
const sessions = new Set();

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
  json(res, 401, { error: "Admin login required" });
  return false;
}

async function handleApi(req, res, pathname) {
  if (pathname === "/api/login" && req.method === "POST") {
    const body = JSON.parse((await readBody(req)) || "{}");
    if (body.password !== adminPassword) {
      json(res, 403, { error: "Incorrect password" });
      return;
    }
    const token = crypto.randomBytes(24).toString("hex");
    sessions.add(token);
    json(res, 200, { token });
    return;
  }

  const match = pathname.match(/^\/api\/(products|posts)$/);
  if (!match) {
    json(res, 404, { error: "API route not found" });
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
      json(res, 400, { error: "Expected an array" });
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

  json(res, 405, { error: "Method not allowed" });
}

function serveStatic(req, res, pathname) {
  const cleanPath = pathname === "/" ? "/index.html" : decodeURIComponent(pathname);
  const target = path.resolve(root, `.${cleanPath}`);
  if (!target.startsWith(root)) {
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
  console.log(`JHI Cashmere site running at http://localhost:${port}`);
  console.log(`Admin: http://localhost:${port}/admin.html`);
});
