// Real Google map. Reuses the existing search results; never searches on pan/zoom.
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.FixGoogleMap = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  async function create({ host, google, center, title, onSelect }) {
    let timer;
    const [{ Map }, { AdvancedMarkerElement, PinElement }, { LatLngBounds }] =
      await Promise.race([
        Promise.all([
          google.maps.importLibrary("maps"),
          google.maps.importLibrary("marker"),
          google.maps.importLibrary("core"),
        ]),
        new Promise((_, reject) => {
          timer = setTimeout(() => reject(Error("map_timeout")), 25000);
        }),
      ]).finally(() => clearTimeout(timer));
    const map = new Map(host, {
      center,
      zoom: 14,
      mapId: "DEMO_MAP_ID",
      colorScheme: "DARK",
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      clickableIcons: false,
      gestureHandling: "cooperative",
    });
    const origin = new AdvancedMarkerElement({
      map,
      position: center,
      title,
      content: new PinElement({
        background: "#63b6ff",
        borderColor: "#ffffff",
        glyphColor: "#ffffff",
      }),
    });
    let markers = [],
      lastKey = null;
    function update(places) {
      const items = (Array.isArray(places) ? places : [])
        .filter((p) => p.id && p.location)
        .slice(0, 5);
      const key = items.map((p) => p.id).join("|");
      if (key === lastKey) return;
      lastKey = key;
      markers.forEach((m) => {
        m.map = null;
      });
      const bounds = new LatLngBounds();
      bounds.extend(center);
      markers = items.map((p) => {
        const marker = new AdvancedMarkerElement({
          map,
          position: p.location,
          title: p.displayName || "",
          gmpClickable: true,
          content: new PinElement({
            background: "#e9bf77",
            borderColor: "#071722",
            glyphColor: "#071722",
          }),
        });
        marker.addEventListener("gmp-click", () => onSelect(p.id));
        bounds.extend(p.location);
        return marker;
      });
      if (items.length) map.fitBounds(bounds, 48);
      else {
        map.setCenter(center);
        map.setZoom(14);
      }
    }
    return {
      update,
      dispose() {
        markers.forEach((m) => {
          m.map = null;
        });
        origin.map = null;
      },
    };
  }
  return { create };
});
