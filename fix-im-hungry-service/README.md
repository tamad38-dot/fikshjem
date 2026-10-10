# FIX I'm Hungry restaurant service

This directory is the standalone Node.js service for the mobile app. It has no npm dependencies, database, secrets, native app code or restaurant image files. It serves the OSM proxy and the optional hosted Google panel.

## Render pilot

Create one **Free Web Service**, in Frankfurt, from this branch of `tamad38-dot/fikshjem`:

- Root directory: `fix-im-hungry-service`
- Runtime: Node.js 24.19.0
- Build: `node --check scripts/places-server.js`
- Start: `node scripts/places-server.js`
- Health: `/api/health`
- `FIX_BIND=0.0.0.0`, `FIX_COMPANION_PORT=0`, `FIX_GOOGLE_ENABLED=false`
- `FIX_OVERPASS_URL=https://overpass.private.coffee/api/interpreter`
- `FIX_OSM_USER_AGENT=FIX-Im-Hungry/1.0 (+https://github.com/tamad38-dot/fikshjem)`

`render.yaml` contains the same configuration. Do not select a paid instance, database or persistent disk for this pilot. Free services sleep after inactivity; the first request can require a retry while the service wakes up. See [Render free service limits](https://render.com/docs/free).

After deployment, verify `/api/health`, `/api/google-config`, and a city/restaurant query with **synthetic public city-center coordinates**. Set the actual HTTPS origin in the mobile project's `EXPO_PUBLIC_FIX_API_URL`, then rebuild the Xcode archive. A GitHub Pages marketing URL is not this API address.

## Data handling and scope

The API rounds latitude/longitude to two decimals. It retains at most 100 short-lived in-memory cache entries, serializes Nominatim requests at more than one second intervals, permits at most two concurrent requests and stores no location files or application access logs. Hosting providers can retain their own request/network metadata; review the hosting account's logging and publish the final privacy notice before a public rollout. Request coordinates use a POST body, not a public URL.

Restaurant queries request a 64 MiB memory budget instead of Overpass's much larger default reservation. HTTP 429/406 triggers a shared provider cooldown of at least 30 seconds, honoring a longer Retry-After header. Other failures receive at most one retry. The response may include a sanitized upstream HTTP status; upstream bodies, user coordinates and credentials are not returned as diagnostic errors. Public OSM providers can be overloaded; this is a limited pilot, not an unlimited commercial backend.

Current pilot origin: `https://fix-im-hungry-api.onrender.com`. The service was connected using the public Git URL. Deploy updated commits from Render's **Manual Deploy → Deploy latest commit** if the public-repository connection does not trigger automatically. Keep the free compute selection.

The pilot uses [Private.coffee Overpass](https://overpass.private.coffee/) for restaurant data; its published service terms allow small projects and commercial use. It retains limited network metadata for up to 48 hours; reference its privacy policy in the final product notice. Approximate query points are sent server-side. The initial Drammen cloud query returned 122 OSM records, but subsequent Oslo/İzmir queries received upstream HTTP 500 errors. This is a real provider outage/failure, not a successful multi-city rollout. Nominatim resolved all three city names. The default Overpass endpoint refused connections from this cloud environment; forcing IPv4 did not resolve it and that temporary setting was removed. Re-check provider availability before expanding the pilot.

Google stays **off** until the owner separately configures the restricted browser key and HTTPS policy URLs. No Google paid requests are made by this default configuration. This pilot provides OSM records; it does not supply genuine Google photos or ratings.

The server binds to localhost by default; Render's explicit `FIX_BIND` enables its web service listener. Only `dist/` and an allowlist of Google panel files are served, never `.env`, scripts or source directories. Use one instance so the shared Nominatim limiter remains global. Provider outages and incomplete OSM tags can still affect results.

Local test: `PORT=8898 FIX_BIND=127.0.0.1 node scripts/places-server.js`, then read `/api/health`.
