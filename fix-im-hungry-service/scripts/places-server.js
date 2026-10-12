// Google panel hosting and static preview. No restaurant proxy or location logs.
const http = require("node:http");
const fs = require("node:fs/promises");
const path = require("node:path");
try {
  process.loadEnvFile(path.resolve(__dirname, "../.env"));
} catch (error) {
  if (error.code !== "ENOENT") throw new Error("FIX .env could not be loaded");
}
const { publicConfig } = require("./google-config.js");
const { accountConfig } = require("./account-config.js");
const foodLabels = require("../public/business/foods.json");
const root = path.resolve(__dirname, "../dist");
function send(res, code, data) {
  res.writeHead(code, {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(data));
}
const server = http.createServer(async (req, res) => {
  const origin = req.headers.origin;
  // Render's canonical HTTPS origin is also the origin of the hosted WKWebView.
  // Keep exact comparisons: an arbitrary remote origin must remain denied.
  const ownOrigin = process.env.RENDER_EXTERNAL_URL
    ? new URL(process.env.RENDER_EXTERNAL_URL).origin
    : `http://${req.headers.host}`;
  const permitted =
    !origin ||
    origin === ownOrigin ||
    /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) ||
    (process.env.FIX_ALLOWED_ORIGIN &&
      origin === process.env.FIX_ALLOWED_ORIGIN);
  if (!permitted) return send(res, 403, { error: "origin_denied" });
  if (origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    return res.end();
  }
  let pathname;
  try {
    // Route by path: React Native adds ?_=timestamp to cache:no-store requests.
    pathname = decodeURIComponent(
      new URL(req.url, "http://localhost").pathname,
    );
  } catch {
    return send(res, 400, { error: "invalid_url" });
  }
  if (pathname === "/api/account-config" && req.method === "GET") {
    const config = accountConfig();
    const lang = new URL(req.url, "http://localhost").searchParams.get("lang");
    return send(res, 200, {
      ...config,
      ...(config.enabled ? { foods: foodLabels[lang] || foodLabels.en } : {}),
    });
  }
  if (pathname === "/api/google-config" && req.method === "GET")
    return send(res, 200, publicConfig());
  if (pathname === "/api/nearby")
    return send(res, 410, { error: "google_only", provider: "Google Maps" });
  if (pathname === "/api/health")
    return send(res, 200, { ok: true, provider: "Google Maps" });
  if (req.method !== "GET" && req.method !== "HEAD")
    return send(res, 405, { error: "method" });
  try {
    const googleFiles = {
      "/business/account.html": path.resolve(
        __dirname,
        "../public/business/account.html",
      ),
      "/business/account.js": path.resolve(
        __dirname,
        "../public/business/account.js",
      ),
      "/business/account.css": path.resolve(
        __dirname,
        "../public/business/account.css",
      ),
      "/business/model.js": path.resolve(
        __dirname,
        "../public/business/model.js",
      ),
      "/legal/terms.html": path.resolve(
        __dirname,
        "../public/legal/terms.html",
      ),
      "/legal/privacy.html": path.resolve(
        __dirname,
        "../public/legal/privacy.html",
      ),
      "/google/nearby.html": path.resolve(
        __dirname,
        "../public/google/nearby.html",
      ),
      "/google/panel.js": path.resolve(__dirname, "../public/google/panel.js"),
      "/google/plan.js": path.resolve(__dirname, "../src/google-plan.js"),
    };
    const file =
      googleFiles[pathname] ||
      path.resolve(root, "." + (pathname === "/" ? "/index.html" : pathname));
    if (!googleFiles[pathname] && !file.startsWith(root + path.sep))
      return send(res, 403, { error: "path" });
    const bytes = await fs.readFile(file);
    const types = {
      ".html": "text/html; charset=utf-8",
      ".css": "text/css; charset=utf-8",
      ".js": "text/javascript; charset=utf-8",
      ".json": "application/json",
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".ttf": "font/ttf",
      ".svg": "image/svg+xml",
    };
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "no-referrer");
    if (pathname.startsWith("/business/"))
      res.setHeader(
        "Content-Security-Policy",
        "default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self' https://*.supabase.co; img-src 'self' blob: https://*.supabase.co; form-action 'none'; base-uri 'none'; frame-ancestors 'self'",
      );
    res.writeHead(200, {
      "Content-Type": types[path.extname(file)] || "application/octet-stream",
      "Cache-Control": "no-cache",
    });
    res.end(req.method === "HEAD" ? undefined : bytes);
  } catch {
    send(res, 404, { error: "not_found" });
  }
});
if (require.main === module) {
  const port = Number(process.env.PORT || 8081);
  server.listen(port, process.env.FIX_BIND || "127.0.0.1", () =>
    console.log(`FIX preview + Google service ready on port ${port}`),
  );
  // Optional alias serves the same Google panel and static preview routes.
  const companion = Number(process.env.FIX_COMPANION_PORT || 0);
  if (companion && companion !== port) {
    const alias = http.createServer(server.listeners("request")[0]);
    alias.on("error", () =>
      console.log(
        "FIX companion port unavailable; main preview remains running.",
      ),
    );
    alias.listen(companion, "127.0.0.1", () =>
      console.log(`FIX companion API ready on port ${companion}`),
    );
  }
}
module.exports = { server };
