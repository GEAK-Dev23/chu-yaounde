/**
 * ============================================================
 * SERVICES LOADER - Module partagé de chargement des services
 * ============================================================
 * Charge dynamiquement les services depuis l'API admin et
 * peuple les <select> de service sur toutes les pages du site.
 *
 * Utilisation :
 *   ServicesLoader.populateSelect('monSelectId');
 *   ServicesLoader.populateSelect('monSelectId', { onSelect: (slug, name) => { ... } });
 */

const ServicesLoader = (() => {
  // Cache en mémoire pour éviter les appels répétés pendant la session
  let _cache = null;
  let _fetchPromise = null;

  /**
   * Détermine l'URL de base de l'API
   */
  function _getApiBase() {
    if (typeof APP_CONFIG !== "undefined" && APP_CONFIG.API_BASE_URL) {
      return APP_CONFIG.API_BASE_URL;
    }
    const origin = window.location.origin;
    if (origin === "null" || origin === "file://") {
      return "http://localhost:5000/api";
    }
    return origin + "/api";
  }

  /**
   * Charge les services disponibles depuis l'API (avec cache)
   * @returns {Promise<Array>} Liste des services
   */
  async function fetchServices() {
    if (_cache !== null) return _cache;

    // Éviter les appels simultanés
    if (_fetchPromise) return _fetchPromise;

    _fetchPromise = fetch(`${_getApiBase()}/services?available=true`)
      .then((res) => {
        if (!res.ok) throw new Error("Réponse API invalide");
        return res.json();
      })
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          _cache = data.data;
          return _cache;
        }
        throw new Error("Format de réponse inattendu");
      })
      .catch((err) => {
        console.warn(
          "[ServicesLoader] Impossible de charger les services depuis l'API :",
          err.message,
        );
        _fetchPromise = null;
        return [];
      });

    return _fetchPromise;
  }

  /**
   * Invalide le cache (utile après création/suppression d'un service)
   */
  function invalidateCache() {
    _cache = null;
    _fetchPromise = null;
  }

  /**
   * Peuple un <select> avec les services disponibles depuis l'API.
   *
   * @param {string} selectId  - id du <select> à peupler
   * @param {object} options   - options facultatives
   *   @param {string}   options.placeholder   - texte de l'option vide (défaut : "Sélectionnez un service")
   *   @param {string}   options.preselect     - slug à pré-sélectionner
   *   @param {Function} options.onSelect      - callback(slug, name) déclenché au changement
   *   @param {Function} options.onLoaded      - callback(services[]) appelé après le chargement
   */
  async function populateSelect(selectId, options = {}) {
    const select = document.getElementById(selectId);
    if (!select) return;

    const placeholder = options.placeholder || "Sélectionnez un service";

    // Indicateur de chargement
    select.innerHTML = `<option value="" disabled selected>Chargement des services...</option>`;
    select.disabled = true;

    const services = await fetchServices();

    // Option vide par défaut
    select.innerHTML = `<option value="">${placeholder}</option>`;

    if (services.length === 0) {
      // Fallback si l'API est inaccessible
      _populateFallback(select);
    } else {
      services.forEach((svc) => {
        const slug = svc.slug || "";
        const name = svc.name || slug;
        const option = document.createElement("option");
        option.value = slug;
        option.textContent = name;
        option.dataset.serviceId = svc._id || "";
        select.appendChild(option);
      });
    }

    select.disabled = false;

    // Pré-sélection éventuelle (ex : passage depuis home.js via ?service=...)
    if (options.preselect) {
      // Chercher par slug exact ou correspondance partielle du nom
      const preVal = options.preselect.toLowerCase();
      for (const opt of select.options) {
        if (
          opt.value === preVal ||
          opt.textContent.toLowerCase().includes(preVal)
        ) {
          opt.selected = true;
          break;
        }
      }
    }

    // Listener de changement
    if (typeof options.onSelect === "function") {
      select.addEventListener("change", (e) => {
        const slug = e.target.value;
        const name =
          e.target.options[e.target.selectedIndex]?.textContent || "";
        options.onSelect(slug, name);
      });
    }

    // Callback après chargement
    if (typeof options.onLoaded === "function") {
      options.onLoaded(services);
    }

    return services;
  }

  /**
   * Retourne un dictionnaire slug → nom à partir du cache ou de l'API.
   * Utile pour afficher le nom d'un service enregistré.
   * @returns {Promise<Object>}
   */
  async function getServiceNames() {
    const services = await fetchServices();
    const map = {};
    services.forEach((s) => {
      if (s.slug) map[s.slug] = s.name;
    });
    // Ajouter les noms par _id aussi
    services.forEach((s) => {
      if (s._id) map[s._id] = s.name;
    });
    return map;
  }

  /**
   * Retourne un dictionnaire slug → liste de médecins depuis le cache ou l'API.
   * @returns {Promise<Object>}
   */
  async function getDoctorsByService() {
    const services = await fetchServices();
    const map = {};
    services.forEach((svc) => {
      const slug = svc.slug;
      if (slug && svc.staff && svc.staff.length > 0) {
        map[slug] = svc.staff.map((p) => ({
          id: p.id || p._id || "",
          name: p.name || "",
          specialty: p.specialty || "",
        }));
      }
    });
    return map;
  }

  /**
   * Données statiques de secours si l'API est inaccessible.
   * @private
   */
  function _populateFallback(select) {
    const fallback = [
      { value: "cardiology", label: "Cardiologie" },
      { value: "pediatrics", label: "Pédiatrie" },
      { value: "surgery", label: "Chirurgie" },
      { value: "neurology", label: "Neurologie" },
      { value: "general", label: "Médecine Générale" },
      { value: "dentistry", label: "Dentisterie" },
      { value: "ophthalmology", label: "Ophtalmologie" },
      { value: "dermatology", label: "Dermatologie" },
      { value: "gynecology", label: "Gynécologie" },
      { value: "orthopedics", label: "Orthopédie" },
    ];
    fallback.forEach(({ value, label }) => {
      const opt = document.createElement("option");
      opt.value = value;
      opt.textContent = label;
      select.appendChild(opt);
    });
  }

  // API publique
  return {
    fetchServices,
    populateSelect,
    getServiceNames,
    getDoctorsByService,
    invalidateCache,
  };
})();
