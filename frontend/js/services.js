// GESTION DE LA PAGE SERVICES
class ServicesPage {
  constructor() {
    this.currentCategory = "medical";
    this.services = [];
    this.filteredServices = [];
    this.searchQuery = "";
    this.init();
  }

  async init() {
    this.setupCategoryNavigation();
    this.setupSearch();
    this._createServiceModals();
    await this.loadServices();
    this.setupScrollAnimations();
    this.setupServiceInteractions();
  }

  setupCategoryNavigation() {
    const navItems = document.querySelectorAll(".nav-item");
    navItems.forEach((item) => {
      item.addEventListener("click", (e) => {
        e.preventDefault();

        // Mettre à jour l'état actif
        navItems.forEach((nav) => nav.classList.remove("active"));
        item.classList.add("active");

        // Faire défiler vers la catégorie
        const targetId = item.getAttribute("href").substring(1);
        this.scrollToCategory(targetId);
      });
    });
  }

  scrollToCategory(categoryId) {
    const targetSection = document.getElementById(categoryId);
    if (targetSection) {
      const offsetTop = targetSection.offsetTop - 100;
      window.scrollTo({
        top: offsetTop,
        behavior: "smooth",
      });

      this.currentCategory = categoryId;
      this.trackEvent("category_click", { category: categoryId });
    }
  }

  setupSearch() {
    const searchInput = document.querySelector(".search-box-large input");
    const searchButton = document.querySelector(".search-btn-large");

    if (searchInput && searchButton) {
      const performSearch = () => {
        const query = searchInput.value.trim();
        this.searchQuery = query;
        if (query) {
          this.searchServices(query);
        } else {
          this.displayAllServices();
        }
      };

      searchButton.addEventListener("click", performSearch);
      searchInput.addEventListener("input", this.debounce(performSearch, 300));
      searchInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          performSearch();
        }
      });
    }
  }

  async searchServices(query) {
    try {
      this.filteredServices = this.services.filter(
        (service) =>
          service.name.toLowerCase().includes(query.toLowerCase()) ||
          service.description.toLowerCase().includes(query.toLowerCase()) ||
          service.category.toLowerCase().includes(query.toLowerCase()) ||
          service.features.some((feature) =>
            feature.toLowerCase().includes(query.toLowerCase()),
          ),
      );

      this.displaySearchResults();
      this.trackEvent("service_search", {
        query: query,
        results_count: this.filteredServices.length,
      });
    } catch (error) {
      console.error("Erreur recherche services:", error);
      chuApp.showNotification("Erreur lors de la recherche", "error");
    }
  }

  displaySearchResults() {
    if (this.filteredServices.length === 0 && this.searchQuery) {
      chuApp.showNotification(
        `Aucun service trouvé pour "${this.searchQuery}"`,
        "warning",
      );
      this.displayAllServices();
    } else {
      const servicesToDisplay = this.searchQuery
        ? this.filteredServices
        : this.services;
      this.renderServices(servicesToDisplay);

      if (this.searchQuery && this.filteredServices.length > 0) {
        chuApp.showNotification(
          `${this.filteredServices.length} service(s) trouvé(s) pour "${this.searchQuery}"`,
          "success",
        );
      }
    }
  }

  displayAllServices() {
    this.renderServices(this.services);
  }

  async loadServices() {
    try {
      // Utiliser APP_CONFIG si disponible (config.js), sinon même origine
      const API_BASE =
        typeof APP_CONFIG !== "undefined" && APP_CONFIG.API_BASE_URL
          ? APP_CONFIG.API_BASE_URL.replace("/api", "")
          : window.location.origin === "null"
            ? "http://localhost:5000"
            : window.location.origin;

      const res = await fetch(`${API_BASE}/api/services?available=true`);
      const data = await res.json();
      if (data.success && data.data && data.data.length > 0) {
        // Mapper les services API vers le format attendu par le frontend
        this.services = data.data.map((s) => ({
          id: s._id,
          name: s.name,
          category: s.category || "medical",
          description: s.description || "",
          icon: s.icon ? s.icon.replace("fas ", "") : "fa-hospital",
          features: s.features || [],
          image:
            s.image || `../assets/images/services/${s.slug || "default"}.jpg`,
          schedule: s.hours || "Lun-Ven: 8h00-17h00",
          phone: s.phone || "+237 672 59 26 95",
          slug: s.slug,
          staff: s.staff || [],
          location: s.location || "",
          fullDescription: s.longDescription || s.description || "",
        }));
        this.renderServices(this.services);
      } else {
        // Fallback données statiques
        this.services = this.getDefaultServices();
        this.renderServices(this.services);
      }
    } catch (error) {
      console.error("Erreur chargement services:", error);
      this.services = this.getDefaultServices();
      this.renderServices(this.services);
    }
  }

  getDefaultServices() {
    return [
      // Services Médicaux
      {
        id: 1,
        name: "Cardiologie",
        category: "medical",
        description:
          "Prise en charge complète des maladies cardiovasculaires avec des technologies de pointe et une équipe spécialisée.",
        icon: "fa-heartbeat",
        features: [
          "Consultation",
          "Échographie cardiaque",
          "Holter ECG",
          "Stress test",
        ],
        image: "../assets/images/services/cardiologie.jpg",
        schedule: "Lun-Ven: 7h30-17h30",
        phone: "+237 672 59 26 95",
      },
      {
        id: 2,
        name: "Pédiatrie",
        category: "medical",
        description:
          "Soins spécialisés pour les enfants de 0 à 18 ans dans un environnement adapté et sécurisé.",
        icon: "fa-baby",
        features: [
          "Vaccination",
          "Suivi croissance",
          "Urgences pédiatriques",
          "Consultation spécialisée",
        ],
        image: "../assets/images/services/pediatrie.jpg",
        schedule: "Lun-Sam: 8h00-18h00",
        phone: "+237 672 59 26 95",
      },
      {
        id: 3,
        name: "Neurologie",
        category: "medical",
        description:
          "Diagnostic et traitement des maladies du système nerveux avec une expertise reconnue.",
        icon: "fa-brain",
        features: ["EEG", "EMG", "Consultation", "Imagerie cérébrale"],
        image: "../assets/images/services/neurologie.jpg",
        schedule: "Lun-Ven: 8h00-16h00",
        phone: "+237 672 59 26 95",
      },
      {
        id: 4,
        name: "Dermatologie",
        category: "medical",
        description:
          "Soins des maladies de la peau, des cheveux et des ongles avec des traitements modernes.",
        icon: "fa-allergies",
        features: [
          "Consultation",
          "Cryothérapie",
          "Biopsie",
          "Traitement laser",
        ],
        image: "../assets/images/services/dermatologie.jpg",
        schedule: "Lun-Ven: 8h00-17h00",
        phone: "+237 672 59 26 95",
      },
      // Services Chirurgicaux
      {
        id: 5,
        name: "Chirurgie Générale",
        category: "surgical",
        description:
          "Interventions chirurgicales de routine et spécialisées avec des techniques modernes.",
        icon: "fa-user-md",
        features: [
          "Chirurgie ambulatoire",
          "Laparoscopie",
          "Chirurgie digestive",
          "Urgences chirurgicales",
        ],
        image: "../assets/images/services/chirurgie.jpg",
        schedule: "24h/24",
        phone: "+237 672 59 26 95",
      },
      {
        id: 6,
        name: "Chirurgie Orthopédique",
        category: "surgical",
        description:
          "Traitement chirurgical des troubles musculo-squelettiques et traumatismes.",
        icon: "fa-bone",
        features: [
          "Prothèses",
          "Traumatologie",
          "Arthroscopie",
          "Chirurgie du rachis",
        ],
        image: "../assets/images/services/orthopedie.jpg",
        schedule: "Lun-Ven: 7h30-17h30",
        phone: "+237 672 59 26 95",
      },
    ];
  }

  renderServices(services) {
    this.renderServiceCategory("medical", services);
    this.renderServiceCategory("surgical", services);
    this.renderServiceCategory("technical", services);
    this.renderServiceCategory("specialized", services);
  }

  renderServiceCategory(category, services) {
    const container = document.getElementById(`${category}ServicesGrid`);
    if (!container) return;

    const categoryServices = services.filter(
      (service) => service.category === category,
    );

    if (categoryServices.length === 0) {
      container.innerHTML = `
                <div class="col-12">
                    <div class="text-center py-5">
                        <i class="fas fa-search fa-3x text-muted mb-3"></i>
                        <h4 class="text-muted" data-translate="no-services">Aucun service trouvé</h4>
                        <p class="text-muted" data-translate="try-different-search">Essayez avec d'autres termes de recherche</p>
                    </div>
                </div>
            `;
      return;
    }

    container.innerHTML = categoryServices
      .map(
        (service) => `
            <div class="col-lg-4 col-md-6">
                <div class="service-detail-card" data-service-id="${service.id}">
                    <div class="service-image image-container">
                        <img src="${service.image}" 
                             alt="Service de ${service.name}" 
                             class="adaptive-image"
                             onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                        <div class="image-placeholder">
                            <i class="${service.icon} fa-3x"></i>
                        </div>
                    </div>
                    <div class="service-content">
                        <div class="service-header">
                            <i class="fas ${service.icon} service-icon-large"></i>
                            <h3>${service.name}</h3>
                        </div>
                        <p>${service.description}</p>
                        <div class="service-features">
                            ${service.features
                              .map(
                                (feature) => `
                                <span class="feature">${feature}</span>
                            `,
                              )
                              .join("")}
                        </div>
                        <div class="service-info">
                            <div class="info-item">
                                <i class="fas fa-clock"></i>
                                <span>${service.schedule}</span>
                            </div>
                            <div class="info-item">
                                <i class="fas fa-phone"></i>
                                <span>${service.phone}</span>
                            </div>
                        </div>
                        <div class="service-actions">
                            <button class="btn btn-primary" onclick="servicesPage.bookAppointment('${service.id}')" data-translate="make-appointment">
                                Prendre RDV
                            </button>
                            <button class="btn btn-outline-primary" onclick="servicesPage.viewServiceDetails('${service.id}')" data-translate="learn-more">
                                En savoir plus
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `,
      )
      .join("");
  }

  setupServiceInteractions() {
    // Gestion des clics sur les cartes de service
    document.addEventListener("click", (e) => {
      const card = e.target.closest(".service-detail-card");
      if (card && !e.target.closest(".service-actions")) {
        const serviceId = card.getAttribute("data-service-id");
        this.viewServiceDetails(serviceId);
      }
    });
  }

  viewServiceDetails(serviceId) {
    const service = this.services.find(
      (s) => String(s.id) === String(serviceId),
    );
    if (!service) return;

    const modal = document.getElementById("serviceDetailModal");
    if (!modal) {
      this._createServiceModals();
    }

    // Remplir le modal détails
    document.getElementById("svc-modal-title").textContent = service.name;
    document.getElementById("svc-modal-img").src = service.image;
    document.getElementById("svc-modal-img").onerror = function () {
      this.style.display = "none";
    };
    document.getElementById("svc-modal-desc").textContent =
      service.fullDescription ||
      service.description ||
      "Aucune description disponible.";
    document.getElementById("svc-modal-hours").textContent = service.schedule;
    document.getElementById("svc-modal-phone").textContent = service.phone;
    document.getElementById("svc-modal-location").textContent =
      service.location || "CHU Yaoundé";

    const featuresEl = document.getElementById("svc-modal-features");
    featuresEl.innerHTML =
      (service.features || [])
        .map((f) => `<span class="badge bg-primary me-1 mb-1">${f}</span>`)
        .join("") || "<em class='text-muted'>Non renseigné</em>";

    const staffEl = document.getElementById("svc-modal-staff");
    staffEl.innerHTML =
      (service.staff || []).length > 0
        ? (service.staff || [])
            .map(
              (p) =>
                `<div class="d-flex align-items-center gap-2 mb-1">
            <i class="fas fa-user-md text-primary"></i>
            <span><strong>${p.name}</strong>${p.specialty ? " — " + p.specialty : ""}</span>
          </div>`,
            )
            .join("")
        : "<em class='text-muted'>Aucun personnel renseigné</em>";

    document.getElementById("svc-modal-rdv-btn").onclick = () => {
      const bsModal = bootstrap.Modal.getInstance(
        document.getElementById("serviceDetailModal"),
      );
      if (bsModal) bsModal.hide();
      setTimeout(() => this.bookAppointment(serviceId), 300);
    };

    const bsModal = new bootstrap.Modal(
      document.getElementById("serviceDetailModal"),
    );
    bsModal.show();
    this.trackEvent("service_view", {
      service_id: serviceId,
      service_name: service.name,
    });
  }

  bookAppointment(serviceId) {
    const service = this.services.find(
      (s) => String(s.id) === String(serviceId),
    );
    if (!service) return;

    const modal = document.getElementById("serviceRdvModal");
    if (!modal) {
      this._createServiceModals();
    }

    document.getElementById("rdv-modal-service-name").textContent =
      service.name;

    // Remplir la sélection du personnel
    const staffSelect = document.getElementById("rdv-modal-staff");
    staffSelect.innerHTML =
      '<option value="">Personnel non spécifié (optionnel)</option>';
    (service.staff || []).forEach((p) => {
      const opt = document.createElement("option");
      opt.value = p.name;
      opt.textContent = p.name + (p.specialty ? " — " + p.specialty : "");
      staffSelect.appendChild(opt);
    });
    if ((service.staff || []).length === 0) {
      staffSelect.innerHTML =
        '<option value="">Aucun personnel disponible</option>';
      staffSelect.disabled = true;
    } else {
      staffSelect.disabled = false;
    }

    document.getElementById("rdv-modal-confirm-btn").onclick = () => {
      const selectedStaff = staffSelect.value;
      const params = new URLSearchParams({ service: service.name });
      if (selectedStaff) params.set("doctor", selectedStaff);
      window.location.href = `rendezvous.html?${params.toString()}`;
    };

    const bsModal = new bootstrap.Modal(
      document.getElementById("serviceRdvModal"),
    );
    bsModal.show();
    this.trackEvent("appointment_click", {
      service_id: serviceId,
      service_name: service.name,
    });
  }

  _createServiceModals() {
    // Modal "En savoir plus"
    if (!document.getElementById("serviceDetailModal")) {
      const detailModal = document.createElement("div");
      detailModal.innerHTML = `
        <div class="modal fade" id="serviceDetailModal" tabindex="-1" aria-hidden="true">
          <div class="modal-dialog modal-lg modal-dialog-scrollable">
            <div class="modal-content">
              <div class="modal-header bg-primary text-white">
                <h5 class="modal-title" id="svc-modal-title"></h5>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
              </div>
              <div class="modal-body">
                <img id="svc-modal-img" src="" alt="" class="img-fluid rounded mb-3 w-100" style="max-height:220px;object-fit:cover;">
                <p id="svc-modal-desc" class="lead mb-3"></p>
                <div class="row mb-3">
                  <div class="col-md-4">
                    <p class="mb-1"><i class="fas fa-clock text-primary me-2"></i><strong>Horaires</strong></p>
                    <p id="svc-modal-hours" class="text-muted small"></p>
                  </div>
                  <div class="col-md-4">
                    <p class="mb-1"><i class="fas fa-phone text-primary me-2"></i><strong>Téléphone</strong></p>
                    <p id="svc-modal-phone" class="text-muted small"></p>
                  </div>
                  <div class="col-md-4">
                    <p class="mb-1"><i class="fas fa-map-marker-alt text-primary me-2"></i><strong>Localisation</strong></p>
                    <p id="svc-modal-location" class="text-muted small"></p>
                  </div>
                </div>
                <div class="mb-3">
                  <p class="mb-1"><strong><i class="fas fa-list-check text-primary me-2"></i>Prestations</strong></p>
                  <div id="svc-modal-features"></div>
                </div>
                <div class="mb-3">
                  <p class="mb-1"><strong><i class="fas fa-user-md text-primary me-2"></i>Personnel médical</strong></p>
                  <div id="svc-modal-staff"></div>
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fermer</button>
                <button type="button" class="btn btn-primary" id="svc-modal-rdv-btn">
                  <i class="fas fa-calendar-plus me-2"></i>Prendre RDV
                </button>
              </div>
            </div>
          </div>
        </div>`;
      document.body.appendChild(detailModal.firstElementChild);
    }

    // Modal "Prendre RDV"
    if (!document.getElementById("serviceRdvModal")) {
      const rdvModal = document.createElement("div");
      rdvModal.innerHTML = `
        <div class="modal fade" id="serviceRdvModal" tabindex="-1" aria-hidden="true">
          <div class="modal-dialog">
            <div class="modal-content">
              <div class="modal-header bg-primary text-white">
                <h5 class="modal-title">Prendre un Rendez-vous</h5>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
              </div>
              <div class="modal-body">
                <p class="mb-3">Service sélectionné : <strong id="rdv-modal-service-name"></strong></p>
                <div class="mb-3">
                  <label class="form-label"><i class="fas fa-user-md me-2"></i>Choisir un personnel (optionnel)</label>
                  <select class="form-select" id="rdv-modal-staff">
                    <option value="">Personnel non spécifié (optionnel)</option>
                  </select>
                  <small class="text-muted">Vous pouvez laisser ce champ vide pour être assigné automatiquement</small>
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Annuler</button>
                <button type="button" class="btn btn-primary" id="rdv-modal-confirm-btn">
                  <i class="fas fa-calendar-check me-2"></i>Continuer vers le formulaire
                </button>
              </div>
            </div>
          </div>
        </div>`;
      document.body.appendChild(rdvModal.firstElementChild);
    }
  }

  setupScrollAnimations() {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("slide-up");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 },
    );

    document.querySelectorAll(".service-detail-card").forEach((card) => {
      observer.observe(card);
    });
  }

  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  trackEvent(action, params = {}) {
    if (typeof gtag !== "undefined") {
      gtag("event", action, {
        event_category: "services_page",
        ...params,
      });
    }
  }
}

// Styles supplémentaires pour les informations de service
const additionalStyles = `
    .service-info {
        margin-bottom: 20px;
        padding: 15px;
        background: var(--chu-light-blue);
        border-radius: 10px;
    }
    
    .info-item {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 8px;
        font-size: 0.9rem;
        color: var(--chu-dark);
    }
    
    .info-item:last-child {
        margin-bottom: 0;
    }
    
    .info-item i {
        color: var(--chu-blue);
        width: 16px;
    }
`;

// Ajout des styles supplémentaires
const styleSheet = document.createElement("style");
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet);

// Initialisation page services
const servicesPage = new ServicesPage();
