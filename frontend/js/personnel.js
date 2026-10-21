/* ================================================
   NOTRE PERSONNEL — CHU YAOUNDÉ
   Charger depuis /api/personnel + carrousel infini
   ================================================ */
(function () {
  /* --- URL du backend --- */
  function apiUrl() {
    var base =
      window.APP_CONFIG && window.APP_CONFIG.API_BASE_URL
        ? window.APP_CONFIG.API_BASE_URL.replace(/\/api\/?$/, "")
        : "http://localhost:5000";
    return base + "/api/personnel";
  }

  /* --- Echapper HTML --- */
  function h(s) {
    return String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /* --- Créer une carte --- */
  function carte(m) {
    var base =
      window.APP_CONFIG && window.APP_CONFIG.API_BASE_URL
        ? window.APP_CONFIG.API_BASE_URL.replace(/\/api\/?$/, "")
        : "http://localhost:5000";

    var photoSrc;
    if (m.photo) {
      // Si c'est déjà une URL absolue (Cloudinary), l'utiliser directement
      photoSrc = m.photo.startsWith("http") ? m.photo : base + m.photo;
    }

    var photo = photoSrc
      ? '<img src="' + photoSrc + '" alt="' + h(m.name) + '" loading="lazy">'
      : '<div class="personnel-photo-placeholder"><i class="fas fa-user-md"></i></div>';

    var el = document.createElement("div");
    el.className = "personnel-card";
    el.innerHTML =
      '<div class="personnel-photo-frame">' +
      photo +
      "</div>" +
      '<div class="personnel-name">' +
      h(m.name) +
      "</div>" +
      '<div class="personnel-poste">' +
      h(m.poste) +
      "</div>";
    return el;
  }

  /* --- Construire le carrousel --- */
  function build(data) {
    var track = document.getElementById("personnelTrack");
    if (!track) return;

    track.innerHTML = "";
    track.classList.remove("is-ready");

    if (!data || !data.length) {
      /* Masquer toute la section si vide */
      var sec = document.querySelector(".personnel-section");
      if (sec) sec.style.display = "none";
      return;
    }

    /* Dupliquer pour boucle infinie :
       repTotal copies × membres → translateX(-50%) = 1 boucle */
    var rep = Math.max(4, Math.ceil(14 / data.length)) * 2;
    var frag = document.createDocumentFragment();
    for (var i = 0; i < rep; i++)
      for (var j = 0; j < data.length; j++) frag.appendChild(carte(data[j]));
    track.appendChild(frag);

    /* Durée : 10 s par membre, 18 s minimum */
    track.style.animationDuration = Math.max(18, data.length * 10) + "s";

    /* Forcer recalcul layout AVANT d'activer l'animation */
    void track.offsetWidth;
    track.classList.add("is-ready");
  }

  /* --- Charger depuis l'API --- */
  function init() {
    var track = document.getElementById("personnelTrack");
    if (!track) return;

    fetch(apiUrl())
      .then(function (r) {
        return r.json();
      })
      .then(function (j) {
        if (j && j.success) build(j.data);
        else build([]);
      })
      .catch(function (e) {
        console.warn("[Personnel] erreur fetch:", e.message);
        build([]);
      });
  }

  /* --- Lancer après le DOM --- */
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", init);
  else init();
})();
