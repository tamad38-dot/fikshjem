(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.FixBusiness = factory();
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const bucket = "business-photos",
    limit = 5 * 1024 * 1024;
  const text = (v, max) =>
    typeof v === "string" ? v.trim().slice(0, max) : "";
  function website(v) {
    if (!v?.trim()) return "";
    try {
      const u = new URL(v);
      if (u.protocol !== "https:" || u.username || u.password) throw Error();
      return u.href;
    } catch {
      throw Error("website");
    }
  }
  function business(v, owner, allowedFoods) {
    if (!/^[0-9a-f-]{36}$/i.test(owner || "")) throw Error("auth");
    const name = text(v.name, 100),
      address = text(v.address, 200),
      city = text(v.city, 80);
    if (!name || !address || !city) throw Error("required");
    const cuisines = [
      ...new Set((v.cuisines || []).filter((x) => allowedFoods.includes(x))),
    ].slice(0, 10);
    if (!cuisines.length) throw Error("cuisines");
    const venue = [
      "restaurant",
      "cafe",
      "cafeteria",
      "bakery",
      "dessert",
    ].includes(v.venue)
      ? v.venue
      : "restaurant";
    const coordinate = (value, max) => {
      if (value === "" || value == null) return null;
      if (
        !/^-?\d+(\.\d+)?$/.test(String(value)) ||
        !Number.isFinite(Number(value)) ||
        Math.abs(Number(value)) > max
      )
        throw Error("coordinates");
      return Number(value);
    };
    const latitude = coordinate(v.latitude, 90),
      longitude = coordinate(v.longitude, 180);
    if ((latitude === null) !== (longitude === null))
      throw Error("coordinates");
    return {
      owner_id: owner,
      name,
      address,
      city,
      website: website(v.website),
      description: text(v.description, 600),
      menu: text(v.menu, 2000),
      cuisines,
      venue,
      latitude,
      longitude,
    };
  }
  function photoType(bytes) {
    if (!(bytes instanceof Uint8Array)) return null;
    if (bytes.length > limit || bytes.length < 12) return null;
    if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return "jpeg";
    if ([137, 80, 78, 71, 13, 10, 26, 10].every((v, i) => bytes[i] === v))
      return "png";
    if (
      String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
      String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
    )
      return "webp";
    return null;
  }
  function photoPath(owner, id, type) {
    if (
      !/^[0-9a-f-]{36}$/i.test(owner || "") ||
      !/^[0-9a-f-]{36}$/i.test(id || "") ||
      !["jpeg", "png", "webp"].includes(type)
    )
      throw Error("photo");
    return owner + "/" + id + "." + type;
  }
  function eligiblePromotions(rows, prefs, gps, radius, now = Date.now()) {
    if (
      !gps ||
      prefs.diets?.length ||
      !prefs.allowUnknownPrice ||
      (prefs.openOnly && !prefs.allowUnknownHours)
    )
      return [];
    const rad = (n) => (n * Math.PI) / 180;
    return rows
      .filter((row) => {
        if (
          !Array.isArray(row.cuisines) ||
          !row.cuisines.some((x) => prefs.liked?.includes(x)) ||
          row.cuisines.some((x) => prefs.excluded?.includes(x)) ||
          !prefs.venues?.includes(row.venue)
        )
          return false;
        if (
          !Number.isFinite(row.latitude) ||
          !Number.isFinite(row.longitude) ||
          Math.abs(row.latitude) > 90 ||
          Math.abs(row.longitude) > 180
        )
          return false;
        if (
          row.visible_until &&
          (!Number.isFinite(Date.parse(row.visible_until)) ||
            Date.parse(row.visible_until) <= now)
        )
          return false;
        const a =
          Math.sin(rad(row.latitude - gps.latitude) / 2) ** 2 +
          Math.cos(rad(gps.latitude)) *
            Math.cos(rad(row.latitude)) *
            Math.sin(rad(row.longitude - gps.longitude) / 2) ** 2;
        return (
          6371000 *
            2 *
            Math.atan2(Math.sqrt(a), Math.sqrt(Math.max(0, 1 - a))) <=
          radius
        );
      })
      .slice(0, 3);
  }
  function createClient(config, fetcher = fetch) {
    if (
      !config?.enabled ||
      !/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(config.url)
    )
      throw Error("setup");
    let session = null;
    async function request(
      route,
      { method = "GET", body, auth = false, headers = {} } = {},
    ) {
      if (auth && (!session || session.expires_at <= Date.now())) {
        session = null;
        throw Error("session");
      }
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 30000);
      let response;
      try {
        response = await fetcher(config.url + route, {
          method,
          redirect: "error",
          signal: controller.signal,
          headers: {
            apikey: config.publishableKey,
            ...(auth
              ? { Authorization: "Bearer " + session.access_token }
              : {}),
            ...(body != null && !(body instanceof Uint8Array)
              ? { "Content-Type": "application/json" }
              : {}),
            ...headers,
          },
          ...(body != null
            ? { body: body instanceof Uint8Array ? body : JSON.stringify(body) }
            : {}),
        });
        let data = null;
        try {
          data = await response.json();
        } catch {}
        if (!response.ok) {
          if (response.status === 401) session = null;
          const error = Error(
            response.status === 429
              ? "rate"
              : response.status === 401
                ? "session"
                : "request",
          );
          error.status = response.status;
          throw error;
        }
        return data;
      } finally {
        clearTimeout(timer);
      }
    }
    function acceptSession(data) {
      if (
        typeof data?.access_token !== "string" ||
        !data.access_token ||
        !Number.isFinite(Number(data.expires_in))
      )
        throw Error("auth");
      session = {
        access_token: data.access_token,
        expires_at: Date.now() + Number(data.expires_in) * 1000,
      };
    }
    async function profile() {
      const user = await request("/auth/v1/user", { auth: true });
      if (!user?.id || !user.email_confirmed_at) throw Error("confirm");
      const rows = await request(
        "/rest/v1/fix_accounts?select=account_kind&user_id=eq." +
          encodeURIComponent(user.id),
        { auth: true },
      );
      if (!rows?.[0]?.account_kind) throw Error("setup");
      return { id: user.id, kind: rows[0].account_kind };
    }
    return {
      request,
      acceptSession,
      profile,
      async signIn(email, password, kind) {
        acceptSession(
          await request("/auth/v1/token?grant_type=password", {
            method: "POST",
            body: { email, password },
          }),
        );
        try {
          const result = await profile();
          if (result.kind !== kind) throw Error("role");
          return result;
        } catch (error) {
          await this.signOut().catch(() => {});
          throw error;
        }
      },
      async signUp(email, password, kind, redirect) {
        if (!["personal", "business"].includes(kind) || password.length < 12)
          throw Error("password");
        await request(
          "/auth/v1/signup?redirect_to=" + encodeURIComponent(redirect),
          {
            method: "POST",
            body: { email, password, data: { account_kind: kind } },
          },
        );
        // Confirmation is required. Do not claim success as an authenticated user.
      },
      async signOut() {
        try {
          if (session)
            await request("/auth/v1/logout", { method: "POST", auth: true });
        } finally {
          session = null;
        }
      },
      async ownBusiness(owner) {
        return (
          (
            await request(
              "/rest/v1/fix_businesses?select=*&owner_id=eq." +
                encodeURIComponent(owner),
              { auth: true },
            )
          )?.[0] || null
        );
      },
      async save(value, owner, foods, exists) {
        const row = business(value, owner, foods);
        if (exists) {
          const { owner_id, ...patch } = row;
          return request(
            "/rest/v1/fix_businesses?owner_id=eq." + encodeURIComponent(owner),
            {
              method: "PATCH",
              auth: true,
              body: patch,
              headers: { Prefer: "return=representation" },
            },
          );
        }
        return request("/rest/v1/fix_businesses", {
          method: "POST",
          auth: true,
          body: row,
          headers: { Prefer: "return=representation" },
        });
      },
      async photos(owner) {
        return (
          (await request("/storage/v1/object/list/" + bucket, {
            method: "POST",
            auth: true,
            body: {
              prefix: owner + "/",
              limit: 100,
              sortBy: { column: "name", order: "asc" },
            },
          })) || []
        );
      },
      async upload(owner, id, bytes) {
        const type = photoType(bytes);
        if (!type) throw Error("photo");
        const existing = await this.photos(owner);
        if (existing.length >= 6) throw Error("limit");
        const path = photoPath(owner, id, type);
        await request("/storage/v1/object/" + bucket + "/" + path, {
          method: "POST",
          auth: true,
          body: bytes,
          headers: { "Content-Type": "image/" + type, "x-upsert": "false" },
        });
        return path;
      },
      async image(path, authenticated = true) {
        const data = await request(
          "/storage/v1/object/sign/" + bucket + "/" + path,
          { method: "POST", auth: authenticated, body: { expiresIn: 300 } },
        );
        if (!data?.signedURL?.startsWith("/object/sign/")) throw Error("photo");
        return config.url + "/storage/v1" + data.signedURL;
      },
      async removePhotos(paths) {
        if (paths.length)
          await request("/storage/v1/object/" + bucket, {
            method: "DELETE",
            auth: true,
            body: { prefixes: paths },
          });
      },
      async deleteAccount(owner) {
        // Storage API removes the real bytes; deleting only database rows leaves orphan files.
        const items = await this.photos(owner);
        await this.removePhotos(items.map((x) => owner + "/" + x.name));
        await request("/rest/v1/rpc/fix_delete_account", {
          method: "POST",
          auth: true,
          body: {},
        });
        session = null;
      },
    };
  }
  return {
    business,
    website,
    photoType,
    photoPath,
    eligiblePromotions,
    createClient,
    limit,
    bucket,
  };
});
