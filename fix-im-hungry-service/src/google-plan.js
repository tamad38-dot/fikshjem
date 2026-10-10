// Shared with the hosted Google panel. Only IDs and coordinates cross the bridge.
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.FixGooglePlan = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const foods = {
    kebab: "doner kebab restaurant",
    sushi: "sushi restaurant",
    steak: "steak house",
    pizza: "pizza restaurant",
    burger: "burger restaurant",
    vegan: "vegan restaurant",
    seafood: "seafood restaurant",
    pastry: "bakery pastry",
    chicken: "chicken restaurant",
    pasta: "pasta restaurant",
    ramen: "ramen restaurant",
    noodles: "noodle restaurant",
    dumplings: "dumpling restaurant",
    tacos: "taco restaurant",
    sandwich: "sandwich shop",
    salad: "salad restaurant",
    soup: "soup restaurant",
    vegetarian: "vegetarian restaurant",
    breakfast: "breakfast restaurant",
    brunch: "brunch restaurant",
    icecream: "ice cream shop",
    coffee: "coffee shop",
    turkish: "turkish restaurant",
    italian: "italian restaurant",
    japanese: "japanese restaurant",
    chinese: "chinese restaurant",
    indian: "indian restaurant",
    thai: "thai restaurant",
    korean: "korean restaurant",
    vietnamese: "vietnamese restaurant",
    mexican: "mexican restaurant",
    lebanese: "lebanese restaurant",
    greek: "greek restaurant",
    mediterranean: "mediterranean restaurant",
    norwegian: "norwegian restaurant",
    french: "french restaurant",
    spanish: "spanish restaurant",
    american: "american restaurant",
  };
  const point = (p) =>
    p &&
    Number.isFinite(p.latitude) &&
    Number.isFinite(p.longitude) &&
    Math.abs(p.latitude) <= 90 &&
    Math.abs(p.longitude) <= 180;
  function choices(prefs) {
    return [...new Set(prefs.liked || [])].filter(
      (id) =>
        foods[id] &&
        !(prefs.excluded || []).includes(id) &&
        (!prefs.category || prefs.category === "all" || prefs.category === id),
    );
  }
  function plan(prefs, position, cuisine, radius, price = "any") {
    if (!point(position) || !choices(prefs).includes(cuisine)) return null;
    const latitude = Number(position.latitude.toFixed(2));
    const longitude = Number(position.longitude.toFixed(2));
    const metres = Math.max(1000, Math.min(50000, Number(radius) || 3000));
    // Cover rounding displacement. Google text searches use a rectangular region.
    const latitudeSpan = (metres + 1500) / 111195;
    const longitudeSpan = Math.min(
      180,
      latitudeSpan / Math.max(0.01, Math.cos((latitude * Math.PI) / 180)),
    );
    const wrap = (x) => ((x + 540) % 360) - 180;
    return {
      cuisine,
      locale: prefs.locale || "nb",
      query: `${foods[cuisine]} ${(prefs.query || "").slice(0, 80)}`.trim(),
      latitude,
      longitude,
      radius: metres,
      bounds: {
        south: Math.max(-90, latitude - latitudeSpan),
        north: Math.min(90, latitude + latitudeSpan),
        west: wrap(longitude - longitudeSpan),
        east: wrap(longitude + longitudeSpan),
      },
      openOnly: !!prefs.openOnly,
      priceLevels:
        price === "low"
          ? ["INEXPENSIVE"]
          : price === "medium"
            ? ["INEXPENSIVE", "MODERATE"]
            : [],
      mode: prefs.mode === "walk" ? "walking" : "driving",
      saved: (prefs.saved || []).filter(validSavedId).slice(0, 100),
    };
  }
  function validSavedId(id) {
    return typeof id === "string" && /^google:[A-Za-z0-9_-]{1,250}$/.test(id);
  }
  function selection(message) {
    if (
      !message ||
      message.type !== "fix-google-select" ||
      !validSavedId(`google:${message.id}`) ||
      !point(message)
    )
      return null;
    return {
      id: `google:${message.id}`,
      latitude: message.latitude,
      longitude: message.longitude,
    };
  }
  function distanceKm(a, b) {
    if (!point(a) || !point(b)) return null;
    const rad = (v) => (v * Math.PI) / 180;
    const h =
      Math.sin(rad(b.latitude - a.latitude) / 2) ** 2 +
      Math.cos(rad(a.latitude)) *
        Math.cos(rad(b.latitude)) *
        Math.sin(rad(b.longitude - a.longitude) / 2) ** 2;
    return (
      6371.0088 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(Math.max(0, 1 - h)))
    );
  }
  function directions(id, p, mode) {
    if (!validSavedId(`google:${id}`) || !point(p)) return null;
    // Let Google Maps acquire the starting location after the user opens it.
    return `https://www.google.com/maps/dir/?api=1&destination=${p.latitude},${p.longitude}&destination_place_id=${encodeURIComponent(id)}&travelmode=${mode === "walking" ? "walking" : "driving"}`;
  }
  return { choices, plan, selection, distanceKm, directions, validSavedId };
});
