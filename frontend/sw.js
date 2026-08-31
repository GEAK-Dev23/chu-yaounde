/**
 * SERVICE WORKER - CHU YAOUNDÉ
 * Stratégie :
 *  - index.html         → TOUJOURS réseau (jamais cache)
 *  - /api/*             → TOUJOURS réseau (jamais cache)
 *  - CSS/JS/images      → Cache puis réseau (stale-while-revalidate)
 */

const CACHE_NAME = "chu-yaounde-v10";

const STATIC_ASSETS = [
  "/css/style.css",
  "/css/header.css",
  "/css/footer.css",
  "/css/home.css",
  "/css/chatbot.css",
  "/css/responsive.css",
  "/js/config.js",
  "/assets/logos/chu-logo.png",
  "/assets/logos/chu-logo-en.png",
];

/* ── Installation ── */
self.addEventListener("install", (event) => {
  self.skipWaiting(); // Prendre le contrôle immédiatement
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.all(
        STATIC_ASSETS.map(
          (url) => cache.add(url).catch(() => {}), // ignorer les erreurs individuelles
        ),
      );
    }),
  );
});

/* ── Activation : supprimer les anciens caches ── */
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(
          names.map((name) => {
            if (name !== CACHE_NAME) return caches.delete(name);
          }),
        ),
      )
      .then(() => self.clients.claim()), // Prendre le contrôle des pages ouvertes
  );
});

/* ── Interception des requêtes ── */
self.addEventListener("fetch", (event) => {
  const url = event.request.url;

  // Ignorer tout ce qui n'est pas http/https
  if (!url.startsWith("http")) return;

  // ── 1. index.html et navigation HTML → TOUJOURS réseau ──
  // Ne jamais servir ces pages depuis le cache
  if (
    event.request.mode === "navigate" ||
    url.endsWith("/") ||
    url.endsWith("/index.html")
  ) {
    event.respondWith(
      fetch(event.request).catch(() => {
        // Hors ligne : servir depuis cache en dernier recours
        return caches.match("/index.html");
      }),
    );
    return;
  }

  // ── 2. API → TOUJOURS réseau, jamais cache ──
  if (url.includes("/api/")) {
    event.respondWith(fetch(event.request));
    return;
  }

  // ── 3. Uploads (photos personnel, etc.) → TOUJOURS réseau ──
  if (url.includes("/uploads/")) {
    event.respondWith(fetch(event.request));
    return;
  }

  // ── 4. Ressources statiques → Cache avec mise à jour en arrière-plan ──
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(event.request).then((cached) => {
        const networkFetch = fetch(event.request)
          .then((response) => {
            if (response && response.status === 200) {
              cache.put(event.request, response.clone());
            }
            return response;
          })
          .catch(() => cached); // hors ligne : retourner le cache

        // Retourner le cache immédiatement si disponible,
        // mais mettre à jour en arrière-plan
        return cached || networkFetch;
      });
    }),
  );
});
