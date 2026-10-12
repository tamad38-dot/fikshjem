/* FIX account portal. Tokens live in memory only; never localStorage, logs or URLs after boot. */
(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const texts = {
    nb: {
      personal: "Privat",
      business: "Bedrift",
      personalTitle: "Din smak. Din konto.",
      businessTitle: "La maten din bli oppdaget.",
      personalIntro:
        "Valgfri FIX-konto. Du kan fortsatt utforske spisesteder uten å logge inn.",
      businessIntro: "Egne bilder, egen meny, din bedrift. Gratis i piloten.",
      email: "E-post",
      password: "Passord · minst 12 tegn",
      login: "Logg inn",
      signup: "Opprett konto",
      termsConsent: "Jeg godtar vilkårene og har lest personvernerklæringen.",
      terms: "Bruksvilkår",
      privacy: "Personvern",
      memory: "Innloggingen huskes bare mens denne siden er åpen.",
      forgot: "Glemt passord?",
      newPassword: "Velg nytt passord",
      save: "Lagre",
      logout: "Logg ut",
      personalNote:
        "FIX-kontoen din er klar. Matvalg og favoritter blir fortsatt lagret på telefonen; skylagring av disse er ikke aktivert.",
      reviewNote:
        "Dette er bedriftens egne opplysninger. Profil og bilder gjennomgås før publisering. Google-vurderinger endres ikke.",
      name: "Bedriftsnavn",
      address: "Adresse",
      city: "By",
      website: "Nettside · https://",
      description: "Om bedriften",
      menu: "Meny · egne retter og priser",
      venue: "Type sted",
      food: "Matvalg · velg opptil 10",
      coordinates: "Bedriftens kartposisjon",
      coordinatesNote:
        "Bruk bedriftens posisjon, ikke din private adresse. Kontrolleres før publisering.",
      photos: "Dine bedriftsbilder",
      photoNote:
        "Opptil 6 bilder. JPEG, PNG eller WebP · maks 5 MB per bilde. Lagre profilen før opplasting.",
      rights: "Jeg har rett til å bruke disse bildene og publisere dem i FIX.",
      upload: "Velg et bilde",
      credit: "Lagt til av bedriften",
      licence:
        "Gratis pilot nå. Når månedsbetaling innføres, skjules promoteringen når den betalte perioden utløper. Bildene slettes ikke automatisk.",
      deleteAccount: "Slett FIX-kontoen min",
      deleteWarning:
        "Dette sletter kontoen, bedriftsprofilen og alle opplastede bilder permanent. Handlingen kan ikke angres.",
      confirmDelete: "Slett permanent",
      cancel: "Avbryt",
      remove: "Fjern bilde",
      free: "Gratis pilot · ingen betaling eller abonnement opprettes",
      loading: "Kobler til…",
      setup:
        "Kontotjenesten er ikke koblet til ennå. Restaurantdelen kan fortsatt brukes. Oppsett må fullføres før registrering og opplasting fungerer.",
      connection: "Kunne ikke koble til. Prøv igjen.",
      confirm:
        "Hvis registreringen kan fullføres, får du en e-post. Bekreft adressen og logg inn her.",
      recover:
        "Hvis adressen har en konto, får du en lenke for å bytte passord.",
      required: "Fyll ut navn, adresse og by.",
      cuisines: "Velg minst ett matvalg.",
      coordinatesError: "Oppgi gyldig bredde- og lengdegrad.",
      websiteError: "Bruk en gyldig https://-adresse uten passord.",
      photo: "Velg et ekte JPEG-, PNG- eller WebP-bilde på maks 5 MB.",
      limit: "Maks 6 bilder. Fjern et bilde først.",
      saved: "Lagret. Venter på gjennomgang før publisering.",
      session: "Innloggingen er utløpt. Logg inn igjen.",
      role: "Denne kontoen tilhører den andre kontotypen. Velg riktig inngang.",
      request:
        "Handlingen mislyktes. Sjekk innlogging, e-postbekreftelse og tilkobling.",
      rate: "For mange forsøk. Vent litt før du prøver igjen.",
      passwordError: "Passordet må ha minst 12 tegn.",
      termsError: "Godta vilkårene for å opprette konto.",
      signedIn: "Du er logget inn.",
      deleted: "FIX-kontoen er slettet.",
      pending: "Venter på gjennomgang",
      approved: "Godkjent profil",
      resetDone: "Passordet er endret. Logg inn med det nye passordet.",
    },
    tr: {
      personal: "Kişisel",
      business: "İşletme",
      personalTitle: "Senin damak tadın. Senin hesabın.",
      businessTitle: "Yemeklerin keşfedilsin.",
      personalIntro:
        "FIX hesabı isteğe bağlıdır. Giriş yapmadan restoranları keşfedebilirsin.",
      businessIntro:
        "Kendi fotoğrafların, kendi menün, senin işletmen. Test döneminde ücretsiz.",
      email: "E-posta",
      password: "Şifre · en az 12 karakter",
      login: "Giriş yap",
      signup: "Hesap oluştur",
      termsConsent:
        "Kullanım koşullarını kabul ediyorum ve gizlilik metnini okudum.",
      terms: "Kullanım koşulları",
      privacy: "Gizlilik",
      memory: "Oturum yalnız bu sayfa açıkken hatırlanır.",
      forgot: "Şifremi unuttum",
      newPassword: "Yeni şifre seç",
      save: "Kaydet",
      logout: "Çıkış yap",
      personalNote:
        "FIX hesabın hazır. Yemek tercihlerin ve favorilerin hâlâ telefonda saklanır; bunlar için bulut eşitlemesi açık değildir.",
      reviewNote:
        "Bunlar işletmenin kendi bilgileridir. Profil ve fotoğraflar yayın öncesinde incelenir. Google puanları değiştirilmez.",
      name: "İşletme adı",
      address: "Adres",
      city: "Şehir",
      website: "İnternet sitesi · https://",
      description: "İşletme hakkında",
      menu: "Menü · kendi yemeklerin ve fiyatların",
      venue: "İşletme türü",
      food: "Yemek seçenekleri · en fazla 10",
      coordinates: "İşletmenin harita konumu",
      coordinatesNote:
        "Kişisel adresini değil, işletmenin konumunu gir. Yayın öncesinde kontrol edilir.",
      photos: "İşletme fotoğrafların",
      photoNote:
        "En fazla 6 fotoğraf. JPEG, PNG veya WebP · fotoğraf başına en fazla 5 MB. Yüklemeden önce profili kaydet.",
      rights: "Bu fotoğrafları kullanma ve FIX’te yayınlama hakkım var.",
      upload: "Fotoğraf seç",
      credit: "İşletme tarafından eklendi",
      licence:
        "Şimdilik ücretsiz test. Aylık ödeme başladığında ödenmiş süre bitince tanıtım gizlenir. Fotoğraflar otomatik silinmez.",
      deleteAccount: "FIX hesabımı sil",
      deleteWarning:
        "Hesabın, işletme profilin ve yüklenen fotoğrafların kalıcı olarak silinecek. Bu işlem geri alınamaz.",
      confirmDelete: "Kalıcı olarak sil",
      cancel: "Vazgeç",
      remove: "Fotoğrafı kaldır",
      free: "Ücretsiz test · ödeme veya abonelik oluşturulmaz",
      loading: "Bağlanıyor…",
      setup:
        "Hesap servisi henüz bağlı değil. Restoran bölümünü kullanabilirsin. Kayıt ve fotoğraf yükleme için kurulum tamamlanmalı.",
      connection: "Bağlantı kurulamadı. Tekrar dene.",
      confirm:
        "Kayıt tamamlanabiliyorsa e-posta gönderilir. Adresini doğruladıktan sonra buradan giriş yap.",
      recover:
        "Bu adrese ait hesap varsa şifre değiştirme bağlantısı gönderilir.",
      required: "İşletme adı, adres ve şehir gerekli.",
      cuisines: "En az bir yemek türü seç.",
      coordinatesError: "Geçerli enlem ve boylam gir.",
      websiteError: "Şifre içermeyen geçerli bir https:// adresi kullan.",
      photo: "En fazla 5 MB gerçek JPEG, PNG veya WebP fotoğraf seç.",
      limit: "En fazla 6 fotoğraf. Önce birini kaldır.",
      saved: "Kaydedildi. Yayın için inceleme bekliyor.",
      session: "Oturum süresi bitti. Tekrar giriş yap.",
      role: "Bu hesap diğer hesap türüne ait. Doğru girişi seç.",
      request:
        "İşlem tamamlanamadı. Girişini, e-posta doğrulamasını ve bağlantını kontrol et.",
      rate: "Çok fazla deneme. Biraz bekleyip tekrar dene.",
      passwordError: "Şifre en az 12 karakter olmalı.",
      termsError: "Hesap oluşturmak için koşulları kabul et.",
      signedIn: "Giriş yaptın.",
      deleted: "FIX hesabın silindi.",
      pending: "İnceleme bekliyor",
      approved: "Onaylanmış profil",
      resetDone: "Şifren değişti. Yeni şifreyle giriş yap.",
    },
    en: {
      personal: "Personal",
      business: "Business",
      personalTitle: "Your taste. Your account.",
      businessTitle: "Let your food be discovered.",
      personalIntro:
        "A FIX account is optional. Explore places without signing in.",
      businessIntro:
        "Your photos, your menu, your business. Free during the pilot.",
      email: "Email",
      password: "Password · at least 12 characters",
      login: "Sign in",
      signup: "Create account",
      termsConsent: "I accept the terms and have read the privacy notice.",
      terms: "Terms",
      privacy: "Privacy",
      memory: "Your session lasts only while this page is open.",
      forgot: "Forgot password?",
      newPassword: "Choose a new password",
      save: "Save",
      logout: "Sign out",
      personalNote:
        "Your FIX account is ready. Tastes and favourites are still stored on your phone; cloud sync for them is not enabled.",
      reviewNote:
        "These are the business’s own details. Profiles and photos are reviewed before publication. Google ratings are unchanged.",
      name: "Business name",
      address: "Address",
      city: "City",
      website: "Website · https://",
      description: "About your business",
      menu: "Menu · your dishes and prices",
      venue: "Venue type",
      food: "Food choices · up to 10",
      coordinates: "Business map location",
      coordinatesNote:
        "Enter the business location, not your home address. Checked before publication.",
      photos: "Your business photos",
      photoNote:
        "Up to 6 photos. JPEG, PNG or WebP · up to 5 MB each. Save your profile before uploading.",
      rights: "I have the right to use these photos and publish them in FIX.",
      upload: "Choose a photo",
      credit: "Added by the business",
      licence:
        "Free pilot for now. When monthly billing begins, promotions are hidden after the paid period expires. Photos are not automatically deleted.",
      deleteAccount: "Delete my FIX account",
      deleteWarning:
        "This permanently deletes your account, business profile and uploaded photos. This cannot be undone.",
      confirmDelete: "Delete permanently",
      cancel: "Cancel",
      remove: "Remove photo",
      free: "Free pilot · no payment or subscription is created",
      loading: "Connecting…",
      setup:
        "The account service is not connected yet. You can still use restaurant discovery. Setup must be completed before registration and uploads work.",
      connection: "Could not connect. Please try again.",
      confirm:
        "If registration can be completed, you will receive an email. Confirm your address, then sign in here.",
      recover:
        "If this address has an account, a password reset link will be sent.",
      required: "Name, address and city are required.",
      cuisines: "Choose at least one food type.",
      coordinatesError: "Enter a valid latitude and longitude.",
      websiteError: "Use a valid https:// address without credentials.",
      photo: "Choose a real JPEG, PNG or WebP photo up to 5 MB.",
      limit: "Up to 6 photos. Remove one first.",
      saved: "Saved. Awaiting review before publication.",
      session: "Your session has expired. Sign in again.",
      role: "This account belongs to the other account type. Choose the correct entrance.",
      request:
        "The action failed. Check your sign-in, email confirmation and connection.",
      rate: "Too many attempts. Wait before trying again.",
      passwordError: "Use at least 12 characters for your password.",
      termsError: "Accept the terms to create an account.",
      signedIn: "You are signed in.",
      deleted: "Your FIX account was deleted.",
      pending: "Awaiting review",
      approved: "Reviewed profile",
      resetDone: "Password changed. Sign in with your new password.",
    },
  };
  const params = new URLSearchParams(location.search);
  const lang = Object.hasOwn(texts, params.get("lang"))
    ? params.get("lang")
    : "en";
  const copy = texts[lang];
  document.documentElement.lang = lang;
  const message = (key, error = false) => {
    $("status").textContent = copy[key] || copy.request;
    $("status").className = error ? "error" : "";
  };
  document
    .querySelectorAll("[data-copy]")
    .forEach((e) => (e.textContent = copy[e.dataset.copy]));
  let role = params.get("role") === "business" ? "business" : "personal",
    mode = "login",
    client,
    user,
    row,
    config,
    foods = [];
  function setRole(value) {
    role = value;
    $("title").textContent = copy[value + "Title"];
    $("intro").textContent = copy[value + "Intro"];
    document.querySelectorAll("[data-role]").forEach((e) => {
      e.textContent = copy[e.dataset.role];
      e.classList.toggle("active", e.dataset.role === value);
      e.setAttribute("aria-pressed", e.dataset.role === value);
    });
    $("roles").hidden = !!user;
  }
  function setMode(value) {
    mode = value;
    $("login-tab").textContent = copy.login;
    $("signup-tab").textContent = copy.signup;
    $("login-tab").classList.toggle("active", value === "login");
    $("signup-tab").classList.toggle("active", value === "signup");
    $("submit-auth").textContent = copy[value];
    $("terms-row").hidden = value !== "signup";
    $("terms").required = value === "signup";
    $("password").autocomplete =
      value === "signup" ? "new-password" : "current-password";
  }
  async function action(work) {
    const controls = [
      ...document.querySelectorAll("button,input,textarea,select"),
    ];
    const state = controls.map((e) => e.disabled);
    controls.forEach((e) => (e.disabled = true));
    message("loading");
    try {
      await work();
    } catch (e) {
      const key =
        {
          coordinates: "coordinatesError",
          website: "websiteError",
          password: "passwordError",
          auth: "request",
        }[e.message] || e.message;
      message(key, true);
      if (e.message === "session") showLogin();
    } finally {
      controls.forEach((e, i) => (e.disabled = state[i]));
      syncUpload();
    }
  }
  function syncUpload() {
    $("file").disabled = !user || !row || !$("rights").checked;
  }
  function showLogin() {
    user = null;
    row = null;
    $("auth").hidden = !config?.enabled;
    $("dashboard").hidden = true;
    $("recovery").hidden = true;
    $("password").value = "";
    $("reset-password").value = "";
    $("delete-confirm").hidden = true;
    setRole(role);
  }
  function fields() {
    const f = $("business-form");
    return {
      ...Object.fromEntries(new FormData(f)),
      cuisines: [...$("foods").querySelectorAll("input:checked")].map(
        (e) => e.value,
      ),
    };
  }
  async function gallery() {
    $("gallery").replaceChildren();
    if (!row) return;
    const photos = await client.photos(user.id);
    for (const item of photos) {
      const path = user.id + "/" + item.name,
        article = document.createElement("article"),
        image = document.createElement("img"),
        credit = document.createElement("p"),
        remove = document.createElement("button");
      image.alt = row.name;
      image.src = await client.image(path);
      credit.textContent = copy.credit;
      remove.type = "button";
      remove.textContent = copy.remove;
      remove.addEventListener("click", () =>
        action(async () => {
          await client.removePhotos([path]);
          await gallery();
          message("saved");
        }),
      );
      article.append(image, credit, remove);
      $("gallery").append(article);
    }
  }
  async function showDashboard(account) {
    user = account;
    role = account.kind;
    setRole(role);
    $("auth").hidden = true;
    $("recovery").hidden = true;
    $("dashboard").hidden = false;
    $("account-title").textContent = copy[role];
    $("personal-note").hidden = role !== "personal";
    $("business-editor").hidden = role !== "business";
    if (role === "business") {
      row = await client.ownBusiness(user.id);
      $("business-form").reset();
      if (row)
        for (const [key, value] of Object.entries(row)) {
          const input = $("business-form").elements.namedItem(key);
          if (input) input.value = value ?? "";
        }
      $("foods")
        .querySelectorAll("input")
        .forEach((e) => (e.checked = !!row?.cuisines.includes(e.value)));
      $("review-status").textContent =
        copy[row?.approved ? "approved" : "pending"];
      await gallery();
    }
    $("password").value = "";
    message("signedIn");
    syncUpload();
  }
  document
    .querySelectorAll("[data-role]")
    .forEach((e) => e.addEventListener("click", () => setRole(e.dataset.role)));
  $("login-tab").onclick = () => setMode("login");
  $("signup-tab").onclick = () => setMode("signup");
  $("rights").onchange = syncUpload;
  $("auth-form").onsubmit = (e) => {
    e.preventDefault();
    const email = $("email").value.trim(),
      password = $("password").value,
      accepted = $("terms").checked;
    action(async () => {
      if (mode === "signup") {
        if (!accepted) throw Error("termsError");
        await client.signUp(
          email,
          password,
          role,
          location.origin +
            location.pathname +
            "?lang=" +
            lang +
            "&role=" +
            role,
        );
        $("password").value = "";
        message("confirm");
      } else await showDashboard(await client.signIn(email, password, role));
    });
  };
  $("forgot").onclick = () => {
    const email = $("email").value.trim();
    if (!$("email").checkValidity() || !email) {
      $("email").reportValidity();
      return;
    }
    action(async () => {
      await client.request(
        "/auth/v1/recover?redirect_to=" +
          encodeURIComponent(
            location.origin +
              location.pathname +
              "?lang=" +
              lang +
              "&role=" +
              role,
          ),
        { method: "POST", body: { email } },
      );
      message("recover");
    });
  };
  $("reset-form").onsubmit = (e) => {
    e.preventDefault();
    const password = $("reset-password").value;
    action(async () => {
      await client.request("/auth/v1/user", {
        method: "PUT",
        auth: true,
        body: { password },
      });
      await client.signOut();
      showLogin();
      message("resetDone");
    });
  };
  $("logout").onclick = () =>
    action(async () => {
      try {
        await client.signOut();
      } finally {
        showLogin();
      }
      message("signedIn");
      $("status").textContent = "";
    });
  $("business-form").onsubmit = (e) => {
    e.preventDefault();
    const value = fields();
    action(async () => {
      await client.save(
        value,
        user.id,
        foods.map((x) => x.id),
        !!row,
      );
      row = await client.ownBusiness(user.id);
      $("review-status").textContent = copy.pending;
      message("saved");
    });
  };
  $("file").onchange = () => {
    const file = $("file").files?.[0];
    if (!file) return;
    action(async () => {
      if (!$("rights").checked || !row) throw Error("required");
      if (file.size > FixBusiness.limit) throw Error("photo");
      const bytes = new Uint8Array(await file.arrayBuffer());
      await client.upload(user.id, crypto.randomUUID(), bytes);
      $("file").value = "";
      await gallery();
      $("review-status").textContent = copy.pending;
      message("saved");
    });
  };
  $("delete-account").onclick = () => {
    $("delete-confirm").hidden = false;
  };
  $("cancel-delete").onclick = () => {
    $("delete-confirm").hidden = true;
  };
  $("confirm-delete").onclick = () =>
    action(async () => {
      await client.deleteAccount(user.id);
      showLogin();
      message("deleted");
    });
  setRole(role);
  setMode("login");
  message("loading");
  (async () => {
    try {
      const response = await fetch("/api/account-config?lang=" + lang, {
        cache: "no-store",
        signal: AbortSignal.timeout(30000),
      });
      if (!response.ok) throw Error();
      config = await response.json();
      if (!config.enabled) {
        message("setup");
        return;
      }
      client = FixBusiness.createClient(config);
      foods = config.foods || [];
      for (const food of foods) {
        const label = document.createElement("label"),
          input = document.createElement("input"),
          text = document.createElement("span");
        input.type = "checkbox";
        input.value = food.id;
        text.textContent = food.label;
        label.append(input, text);
        $("foods").append(label);
      }
      $("auth").hidden = false;
      $("status").textContent = "";
      const fragment = new URLSearchParams(location.hash.slice(1));
      if (fragment.get("access_token")) {
        const type = fragment.get("type");
        client.acceptSession({
          access_token: fragment.get("access_token"),
          expires_in: Number(fragment.get("expires_in") || 3600),
        });
        history.replaceState(null, "", location.pathname + location.search);
        if (type === "recovery") {
          $("auth").hidden = true;
          $("roles").hidden = true;
          $("recovery").hidden = false;
        } else await showDashboard(await client.profile());
      }
    } catch {
      message("connection", true);
    }
  })();
})();
