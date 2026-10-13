/* Google content stays inside Google's unmodified Essentials UI components.
   No Places REST calls, review scraping, Routes or paid AI calls.
   The map is created once, only when the map tab is opened. */
(async function () {
  const core = window.FixGooglePlan;
  const element = (id) => document.getElementById(id);
  let input,
    detailsOpen = false,
    chosen = null,
    saved = [],
    view = "discover",
    widgets,
    searchElement,
    detailsRequest,
    detailsElement,
    searchStatus,
    searchComplete = false,
    resultCards = [],
    searchTimer,
    detailsTimer,
    mapPromise;
  function status(value) {
    element("status").textContent = value;
  }
  function send(data) {
    if (window.ReactNativeWebView)
      window.ReactNativeWebView.postMessage(JSON.stringify(data));
    else if (parent !== window && input?.parentOrigin)
      parent.postMessage(data, input.parentOrigin);
  }
  function failed() {
    status(
      input?.labels?.error ||
        "Google Maps · Connection unavailable / Tilkobling utilgjengelig",
    );
    send({ type: "fix-google-error" });
  }
  function visibility() {
    element("search").hidden =
      view === "saved" ||
      (view === "map" && searchComplete) ||
      detailsOpen ||
      resultCards.length > 0;
    element("cards").hidden = view === "saved" || view === "map" || detailsOpen;
    element("map-section").hidden = view !== "map" || detailsOpen;
    element("saved-list").hidden = detailsOpen;
    element("selected").hidden = !detailsOpen;
  }
  function favorites() {
    element("saved-list").replaceChildren();
    if (view !== "saved") return;
    const ids = saved.filter(core.validSavedId);
    status(ids.length ? input.labels.favorites : input.labels.emptySaved);
    if (chosen && !ids.includes(`google:${chosen.id}`)) {
      detailsOpen = false;
      chosen = null;
    }
    ids.forEach((id, index) => {
      const button = document.createElement("button");
      button.className = "secondary";
      button.textContent = `${input.labels.favorites} ${index + 1}`;
      button.addEventListener("click", () => showDetails(id.slice(7)));
      element("saved-list").append(button);
    });
  }
  function updateFavorite() {
    element("favorite").textContent = saved.includes(`google:${chosen?.id}`)
      ? input.labels.removeFavorite
      : input.labels.addFavorite;
  }
  function setView(next) {
    const changed = view !== next;
    view = next;
    if (changed) detailsOpen = false;
    favorites();
    visibility();
    if (view !== "saved" && !searchElement) showSearch();
    else if (view !== "saved") status(searchStatus || input.labels.loading);
    if (view === "map") void showMap();
  }
  function mapLabel(key) {
    const labels = {
      nb: {
        position: "Din omtrentlige posisjon",
        place: "Spisested",
        hint: "Trykk på en markør for bilder og detaljer. Posisjonen på kartet er omtrentlig.",
        retry: "Prøv kartet igjen",
        error:
          "Kartet kunne ikke lastes. Restaurantlisten og GPS-posisjonen er fortsatt tilgjengelige.",
      },
      tr: {
        position: "Yaklaşık konumun",
        place: "İşletme",
        hint: "Fotoğraf ve detaylar için bir işarete dokun. Haritadaki konum yaklaşık gösterilir.",
        retry: "Haritayı yeniden dene",
        error:
          "Harita yüklenemedi. Restoran listesi ve GPS konumun hâlâ kullanılabilir.",
      },
      en: {
        position: "Your approximate location",
        place: "Place",
        hint: "Tap a marker for photos and details. Your location on the map is approximate.",
        retry: "Retry map",
        error:
          "The map could not load. The restaurant list and GPS position are still available.",
      },
    };
    return (labels[input.locale] || labels.en)[key];
  }
  async function showMap() {
    if (!mapPromise) {
      element("map-hint").textContent = mapLabel("hint");
      element("map-retry").textContent = mapLabel("retry");
      element("map-error").hidden = true;
      mapPromise = window.FixGoogleMap.create({
        host: element("map"),
        google,
        center: { lat: input.latitude, lng: input.longitude },
        title: mapLabel("position"),
        placeTitle: mapLabel("place"),
        onSelect: showDetails,
      }).catch(() => {
        mapPromise = null;
        element("map-error").textContent = mapLabel("error");
        element("map-error").hidden = false;
        element("map-retry").hidden = false;
        return null;
      });
    }
    const controller = await mapPromise;
    if (controller && view === "map" && !detailsOpen) {
      controller.update(searchElement?.places || []);
      element("map-retry").hidden = true;
    }
  }
  function selected(place) {
    const loc = place?.location;
    const payload = {
      type: "fix-google-select",
      id: place?.id,
      latitude: typeof loc?.lat === "function" ? loc.lat() : loc?.lat,
      longitude: typeof loc?.lng === "function" ? loc.lng() : loc?.lng,
    };
    if (!core.selection(payload)) return;
    chosen = payload;
    const url = core.directions(payload.id, payload, input.mode);
    element("directions").href = url;
    element("directions").textContent = input.labels.directions;
    element("distance").textContent = input.labels.distanceLoading;
    updateFavorite();
    send(payload);
  }
  function showDetails(id) {
    if (!core.validSavedId(`google:${id}`)) return;
    detailsOpen = true;
    visibility();
    send({ type: "fix-google-focus" });
    if (chosen?.id === id && detailsElement?.place?.id === id) {
      updateFavorite();
      send(chosen);
      return;
    }
    chosen = null;
    element("directions").hidden = true;
    element("favorite").disabled = true;
    clearTimeout(detailsTimer);
    detailsTimer = setTimeout(failed, 30000);
    detailsRequest.place = id;
  }
  function renderCards() {
    // Use only the IDs returned by this search. Google owns each photo gallery,
    // rating and attribution; no restaurant facts or images are copied into FIX.
    const ids = [...new Set((searchElement.places || []).map((p) => p.id))]
      .filter((id) => core.validSavedId(`google:${id}`))
      .slice(0, 5);
    if (ids.join("|") === resultCards.map((c) => c.id).join("|")) return;
    resultCards = ids.map((id) => {
      const wrapper = document.createElement("article");
      wrapper.className = "place-card";
      const widget = new widgets.PlaceDetailsElement();
      const request = new widgets.PlaceDetailsPlaceRequestElement();
      request.place = id;
      const content = document.createElement("gmp-place-all-content");
      widget.append(request, content);
      const notice = document.createElement("p");
      notice.textContent = input.labels.loading;
      notice.setAttribute("role", "status");
      const open = document.createElement("button");
      open.className = "secondary";
      open.textContent =
        input.labels.openPlace ||
        {
          nb: "Detaljer, anmeldelser og veibeskrivelse",
          tr: "Detaylar, yorumlar ve yol tarifi",
          de: "Details, Bewertungen und Route",
          sv: "Detaljer, omdömen och vägbeskrivning",
          da: "Detaljer, anmeldelser og rute",
          fr: "Détails, avis et itinéraire",
          es: "Detalles, reseñas e indicaciones",
          it: "Dettagli, recensioni e indicazioni",
          nl: "Details, recensies en route",
        }[input.locale] ||
        "Details, reviews and directions";
      open.addEventListener("click", () => showDetails(id));
      let timer = setTimeout(() => {
        notice.textContent = input.labels.error;
      }, 30000);
      widget.addEventListener("gmp-load", () => {
        clearTimeout(timer);
        notice.hidden = true;
      });
      widget.addEventListener("gmp-error", () => {
        clearTimeout(timer);
        notice.hidden = false;
        notice.textContent = input.labels.error;
      });
      wrapper.append(notice, widget, open);
      return { id, wrapper };
    });
    element("cards").replaceChildren(...resultCards.map((c) => c.wrapper));
    visibility();
  }
  function showSearch() {
    if (!input.query) return;
    status(input.labels.loading);
    clearTimeout(searchTimer);
    searchTimer = setTimeout(failed, 30000);
    searchComplete = false;
    searchElement = new widgets.PlaceSearchElement();
    searchElement.setAttribute("selectable", "");
    const content = document.createElement("gmp-place-all-content");
    const request = new widgets.PlaceTextSearchRequestElement({
      textQuery: input.query,
      locationRestriction: input.bounds,
      includedType: input.placeType || "restaurant",
      // Food such as waffles or breakfast is commonly served by cafes/bakeries.
      // Restrict the region and food query, not an incorrectly narrow venue type.
      useStrictTypeFiltering: ![
        "pastry",
        "cake",
        "waffle",
        "crepe",
        "baklava",
        "dessert",
        "chocolate",
        "sandwich",
        "salad",
        "soup",
        "breakfast",
        "brunch",
      ].includes(input.cuisine),
      isOpenNow: input.openOnly,
      maxResultCount: 5,
      ...(input.priceLevels.length ? { priceLevels: input.priceLevels } : {}),
      rankPreference: "DISTANCE",
    });
    searchElement.addEventListener("gmp-load", () => {
      clearTimeout(searchTimer);
      searchComplete = true;
      renderCards();
      if (view === "map") void showMap();
      searchStatus = searchElement.places?.length
        ? input.labels.results
        : input.labels.noResults;
      if (view !== "saved") status(searchStatus);
      send({ type: "fix-google-loaded" });
    });
    searchElement.addEventListener("gmp-error", () => {
      clearTimeout(searchTimer);
      searchStatus = input.labels.error;
      if (view !== "saved") failed();
    });
    searchElement.addEventListener("gmp-select", (event) =>
      showDetails(event.place?.id),
    );
    searchElement.append(content, request);
    element("search").append(searchElement);
  }
  try {
    input = JSON.parse(decodeURIComponent(location.hash.slice(1)));
    if (
      !input ||
      !core.selection({
        ...input,
        id: "position",
        type: "fix-google-select",
      }) ||
      !input.labels ||
      !/^https?:\/\//.test(input.parentOrigin)
    )
      throw Error("invalid");
    document.documentElement.lang = input.locale;
    saved = input.saved || [];
    view = input.view || "discover";
    element("back").textContent =
      input.labels.back ||
      (input.locale === "nb" ? "Tilbake til listen" : "Back to list");
    element("map-retry").addEventListener("click", () => void showMap());
    element("back").addEventListener("click", () => {
      detailsOpen = false;
      setView(view);
      send({ type: "fix-google-focus" });
    });
    status(input.labels.loading);
    const controller = new AbortController();
    const configTimer = setTimeout(() => controller.abort(), 90000);
    let response;
    try {
      response = await fetch("../api/google-config", {
        cache: "no-store",
        signal: controller.signal,
      });
    } finally {
      clearTimeout(configTimer);
    }
    // Relative ../api resolves /api from /google/nearby.html.
    if (!response.ok) throw Error("setup");
    const config = await response.json();
    if (!config.enabled) {
      status(input.labels.setup);
      return;
    }
    element("terms").href = config.termsUrl;
    element("terms").textContent = input.labels.terms;
    element("privacy").href = config.privacyUrl;
    element("privacy").textContent = input.labels.privacy;
    window.gm_authFailure = failed;
    await new Promise((resolve, reject) => {
      const script = document.createElement("script");
      const params = new URLSearchParams({
        key: config.browserKey,
        v: "weekly",
        libraries: "places",
        loading: "async",
        callback: "fixGoogleLoaded",
        language: input.locale === "nb" ? "no" : input.locale,
      });
      let timeout = setTimeout(() => reject(Error("timeout")), 25000);
      window.fixGoogleLoaded = () => {
        clearTimeout(timeout);
        resolve();
      };
      script.onerror = () => {
        clearTimeout(timeout);
        reject(Error("network"));
      };
      script.src = `https://maps.googleapis.com/maps/api/js?${params}`;
      document.head.append(script);
    });
    if (input.lookupCity) {
      (async () => {
        try {
          const { Geocoder } = await google.maps.importLibrary("geocoding");
          const result = await new Geocoder().geocode({
            location: { lat: input.latitude, lng: input.longitude },
          });
          const city = core.cityFromResults(result.results);
          if (city) {
            element("city").textContent = `${city.city}, ${city.country}`;
            element("city").hidden = false;
            send({ ...city, type: "fix-google-city" });
          }
        } catch {
          send({ type: "fix-google-city-error" });
        }
      })();
    }
    widgets = await google.maps.importLibrary("places");
    const details = new widgets.PlaceDetailsElement();
    detailsElement = details;
    detailsRequest = new widgets.PlaceDetailsPlaceRequestElement();
    details.append(
      detailsRequest,
      document.createElement("gmp-place-all-content"),
    );
    details.addEventListener("gmp-load", () => {
      clearTimeout(detailsTimer);
      selected(details.place);
      element("favorite").disabled = !chosen;
      element("directions").hidden = !chosen;
      send({ type: "fix-google-loaded" });
    });
    details.addEventListener("gmp-error", () => {
      clearTimeout(detailsTimer);
      failed();
    });
    element("details").append(details);
    element("favorite").addEventListener("click", () => {
      if (chosen) send({ ...chosen, type: "fix-google-favorite" });
    });
    window.addEventListener("message", (event) => {
      if (
        event.origin !== input.parentOrigin ||
        (parent !== window && event.source !== parent)
      )
        return;
      const data = event.data;
      if (data?.type === "fix-google-state") {
        saved = Array.isArray(data.saved)
          ? data.saved.filter(core.validSavedId)
          : [];
        updateFavorite();
        setView(["saved", "map"].includes(data.view) ? data.view : "discover");
      }
      if (
        data?.type === "fix-google-distance" &&
        chosen?.id === data.id &&
        Number.isFinite(data.distance) &&
        data.distance >= 0
      ) {
        const outside = data.distance * 1000 > input.radius;
        element("distance").textContent =
          `${data.distance.toLocaleString(input.locale, { maximumFractionDigits: 1 })} km · ${input.labels.straightLine}${outside ? " · " + input.labels.outside : ""}`;
        element("directions").hidden = outside;
      }
    });
    setView(view);
    send({ type: "fix-google-ready" });
    // Measure the component host; do not inspect Google's protected shadow content.
    if (window.ResizeObserver) {
      const observer = new ResizeObserver(() =>
        send({
          type: "fix-google-height",
          height: Math.ceil(document.body.getBoundingClientRect().height),
        }),
      );
      observer.observe(document.body);
    }
  } catch {
    failed();
  }
})();
