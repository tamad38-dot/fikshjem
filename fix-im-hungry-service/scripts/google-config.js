// Only the HTTP-referrer-restricted browser key is public. Never put a server key here.
function publicConfig(env = process.env) {
  const browserKey = (env.FIX_GOOGLE_MAPS_BROWSER_KEY || "").trim();
  const safeUrl = (value) => {
    try {
      const url = new URL(value);
      return url.protocol === "https:" && !url.username && !url.password
        ? url.href
        : "";
    } catch {
      return "";
    }
  };
  const termsUrl = safeUrl(env.FIX_TERMS_URL);
  const privacyUrl = safeUrl(env.FIX_PRIVACY_URL);
  const enabled =
    env.FIX_GOOGLE_ENABLED === "true" &&
    /^AIza[A-Za-z0-9_-]{20,100}$/.test(browserKey) &&
    !!termsUrl &&
    !!privacyUrl;
  return {
    enabled,
    tier: "essentials",
    termsUrl,
    privacyUrl,
    ...(enabled ? { browserKey } : {}),
  };
}
module.exports = { publicConfig };
