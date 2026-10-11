# FIX I’m Hungry — Google service

The service hosts the Google Places UI Kit panel and public policy pages. It makes no OpenStreetMap, Overpass or Nominatim requests. The removed `/api/nearby` route returns HTTP 410, not a successful empty list. `/api/health` identifies the provider as Google Maps.

Existing Render service: https://fix-im-hungry-api.onrender.com — Free plan, Frankfurt, Node 24.19.0. Root directory `fix-im-hungry-service`, start `node scripts/places-server.js`, build `node --check scripts/places-server.js`. Keep `FIX_BIND=0.0.0.0`, `FIX_COMPANION_PORT=0`. Do not upgrade to a paid plan. A sleeping free service may take over a minute to wake up; the client waits up to 90 seconds and provides retry.

Configure `FIX_GOOGLE_ENABLED=true`, `FIX_GOOGLE_MAPS_BROWSER_KEY`, `FIX_TERMS_URL`, `FIX_PRIVACY_URL`. Keep the key out of source code. Restrict the browser key to `https://fix-im-hungry-api.onrender.com/*` and Maps JavaScript API, Places UI Kit and Geocoding API. The key is intentionally provided to Google's browser SDK; never use a server or unrestricted key.

The first restaurant search starts after setup and GPS permission. Only rounded coordinates (two decimals) are shared with Google; exact GPS is retained on the phone for distance calculation. A separate Google reverse-geocoding request resolves the city. Searches remain in mounted Google components during settings/tab/favorite changes. Editing filters does not issue a new search until the user taps the search button. Explicit location refresh starts a new search. There is no paid AI or app-side Routes API call. Directions open in Google Maps.

No independent restaurant database, stock restaurant photos, position disk cache or application request logs. Google content stays in Google's unmodified widgets with attribution. Hosting providers can retain technical network metadata. The terms and privacy pages describe the actual data flow.

Deployment: prepare the allowlisted files with `node scripts/package-service.js`, update the existing service branch, then use Render **Manual Deploy → Deploy latest commit**. Verify real Google search and city resolution before uploading the iPhone build. Never infer that HTTP health alone proves restaurant queries work.
