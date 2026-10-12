// Publishable credentials only; a service-role or secret key must never reach the app.
function accountConfig(env = process.env) {
  const url = (env.FIX_SUPABASE_URL || "").trim();
  const key = (env.FIX_SUPABASE_PUBLISHABLE_KEY || "").trim();
  let safe = false;
  if (/^sb_publishable_[A-Za-z0-9_-]{16,}$/.test(key)) safe = true;
  else if (/^eyJ[A-Za-z0-9_.-]+$/.test(key)) {
    try {
      safe =
        JSON.parse(Buffer.from(key.split(".")[1], "base64url")).role === "anon";
    } catch {}
  }
  if (
    env.FIX_ACCOUNTS_ENABLED !== "true" ||
    !/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url) ||
    !safe
  )
    return { enabled: false, pilotFree: true };
  return { enabled: true, url, publishableKey: key, pilotFree: true };
}
module.exports = { accountConfig };
