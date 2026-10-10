// Small, configurable, rate-limited OSM proxy + static preview. No access logs or disk location cache.
const http = require("node:http");
const fs = require("node:fs/promises");
const path = require("node:path");
try {
  process.loadEnvFile(path.resolve(__dirname, "../.env"));
} catch (error) {
  if (error.code !== "ENOENT") throw new Error("FIX .env could not be loaded");
}
const { publicConfig } = require("./google-config.js");
const { validPoint } = require("../src/geo-point.js");
const root = path.resolve(__dirname, "../dist");
const nominatim =
  process.env.FIX_NOMINATIM_URL || "https://nominatim.openstreetmap.org";
const overpass =
  process.env.FIX_OVERPASS_URL || "https://overpass-api.de/api/interpreter";
const agent =
  process.env.FIX_OSM_USER_AGENT ||
  "FIX-Im-Hungry/1.0 (personal restaurant discovery prototype)";
const cache = new Map();
const providerCooldown = new Map();
let geoQueue = Promise.resolve(),
  lastGeo = 0,
  active = 0;
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
function cached(key, ttl, load) {
  const existing = cache.get(key);
  if (existing && existing.until > Date.now()) return existing.promise;
  const promise = load().catch((error) => {
    cache.delete(key);
    throw error;
  });
  cache.set(key, { until: Date.now() + ttl, promise });
  if (cache.size > 100) cache.delete(cache.keys().next().value);
  return promise;
}
async function jsonRequest(url, options = {}, timeout = 40000) {
  const provider = new URL(url).origin;
  if ((providerCooldown.get(provider) || 0) > Date.now())
    throw new Error("provider_rate_limited");
  const response = await fetch(url, {
    ...options,
    headers: {
      "User-Agent": agent,
      Accept: "application/json",
      ...options.headers,
    },
    signal: AbortSignal.timeout(timeout),
  });
  if ([429, 406].includes(response.status)) {
    const retry = response.headers.get("retry-after");
    const seconds = Number(retry);
    const delay =
      retry && Number.isFinite(seconds)
        ? seconds * 1000
        : Date.parse(retry || "") - Date.now();
    providerCooldown.set(provider, Date.now() + Math.max(30000, delay || 0));
    throw new Error("provider_rate_limited");
  }
  if (!response.ok) {
    const error = new Error("provider_unavailable");
    error.status = response.status;
    throw error;
  }
  try {
    return await response.json();
  } catch {
    throw new Error("provider_invalid_json");
  }
}
function providerFailure(error) {
  if (
    [
      "provider_rate_limited",
      "provider_invalid_json",
      "provider_unavailable",
    ].includes(error?.message)
  )
    return error.message;
  const code =
    error?.cause?.code || error?.cause?.errors?.[0]?.code || error?.code;
  return [
    "ENOTFOUND",
    "EAI_AGAIN",
    "ENETUNREACH",
    "ECONNREFUSED",
    "ETIMEDOUT",
    "CERT_HAS_EXPIRED",
    "UNABLE_TO_VERIFY_LEAF_SIGNATURE",
    "UND_ERR_CONNECT_TIMEOUT",
  ].includes(code)
    ? code
    : "provider_network";
}
function geocode(lat, lon, locale) {
  return cached(`geo:${lat}:${lon}:${locale}`, 3600000, () => {
    const task = geoQueue.then(async () => {
      await pause(Math.max(0, lastGeo + 1100 - Date.now()));
      lastGeo = Date.now();
      const params = new URLSearchParams({
        format: "jsonv2",
        lat,
        lon,
        zoom: "12",
        addressdetails: "1",
        "accept-language": locale,
      });
      return jsonRequest(`${nominatim}/reverse?${params}`);
    });
    geoQueue = task.catch(() => {});
    return task;
  });
}
async function restaurantQuery(lat, lon, radius) {
  const options = {
    method: "POST",
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
    // Overpass accepts a verbatim query as POST payload. The pilot provider's
    // form-encoded POST path returned HTTP 500 even for otherwise valid queries.
    // Keep approximate coordinates in the body, never in the request URL.
    body: `[out:json][timeout:15][maxsize:67108864];nwr["amenity"~"^(restaurant|fast_food|cafe)$"]["name"](around:${radius + 1500},${lat},${lon});out center tags;`,
  };
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const data = await jsonRequest(overpass, options, 20000);
      if (!Array.isArray(data.elements) || data.remark)
        throw new Error("provider_unavailable");
      return data;
    } catch (error) {
      if (attempt === 1 || error.message === "provider_rate_limited")
        throw error;
      await pause(750);
    }
  }
}
async function nearby(body) {
  if (
    !validPoint(body) ||
    !Number.isFinite(body.radius) ||
    body.radius < 1000 ||
    body.radius > 50000
  )
    throw new Error("bad_request");
  // Repeat rounding server-side, including for modified clients.
  const lat = Number(body.latitude.toFixed(2)),
    lon = Number(body.longitude.toFixed(2));
  const radius = Math.ceil(body.radius / 1000) * 1000;
  const locale = [
    "nb",
    "en",
    "tr",
    "de",
    "sv",
    "da",
    "fr",
    "es",
    "it",
    "nl",
  ].includes(body.locale)
    ? body.locale
    : "nb";
  const [location, places] = await Promise.allSettled([
    body.scope === "restaurants"
      ? Promise.resolve(null)
      : geocode(lat, lon, locale),
    body.scope === "city"
      ? Promise.resolve(null)
      : cached(`places:${lat}:${lon}:${radius}`, 300000, () =>
          restaurantQuery(lat, lon, radius),
        ),
  ]);
  return {
    radius,
    location: location.status === "fulfilled" ? location.value : null,
    places: places.status === "fulfilled" ? places.value : null,
    cityError: location.status === "rejected",
    placesError: places.status === "rejected",
    placesErrorStatus:
      places.status === "rejected" && Number.isInteger(places.reason?.status)
        ? places.reason.status
        : null,
    placesErrorReason:
      places.status === "rejected" ? providerFailure(places.reason) : null,
  };
}
function send(res, code, data) {
  res.writeHead(code, {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(data));
}
const server = http.createServer(async (req, res) => {
  const origin = req.headers.origin;
  const permitted =
    !origin ||
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
  if (req.url === "/api/google-config" && req.method === "GET")
    return send(res, 200, publicConfig());
  if (req.url === "/api/nearby" && req.method === "POST") {
    if (active >= 2) return send(res, 429, { error: "busy" });
    active++;
    try {
      let input = "";
      for await (const chunk of req) {
        input += chunk;
        if (input.length > 1024) throw new Error("bad_request");
      }
      const data = await nearby(JSON.parse(input));
      send(res, 200, data);
    } catch (error) {
      send(
        res,
        error.message === "bad_request" || error instanceof SyntaxError
          ? 400
          : 502,
        { error: "request_failed" },
      );
    } finally {
      active--;
    }
    return;
  }
  if (req.url === "/api/health")
    return send(res, 200, { ok: true, provider: "OpenStreetMap" });
  if (req.method !== "GET" && req.method !== "HEAD")
    return send(res, 405, { error: "method" });
  try {
    const pathname = decodeURIComponent(
      new URL(req.url, "http://localhost").pathname,
    );
    const googleFiles = {
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
      ".js": "text/javascript; charset=utf-8",
      ".json": "application/json",
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".ttf": "font/ttf",
      ".svg": "image/svg+xml",
    };
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
    console.log(`FIX preview + OSM service ready on port ${port}`),
  );
  // Optional alias shares the same in-memory cache and global geocoding limiter.
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
module.exports = { server, nearby };
