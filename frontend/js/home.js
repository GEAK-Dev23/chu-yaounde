// FONCTIONNALITÉS SPÉCIFIQUES À LA PAGE D'ACCUEIL
class HomePage {
  constructor() {
    this.config = {
      waitTimeUpdateInterval: 30000, // 30 secondes
      statsAnimationDelay: 1000,
    };
    this.init();
  }

  async init() {
    this.setupWaitTime();
    this.setupStatsAnimation();
    this.setupScrollAnimations();
    this.setupInteractiveElements();
    this.loadDynamicContent();
    this.setupPerformanceMonitoring();
  }

  setupWaitTime() {
    this.updateWaitTime();
    this.setupWaitTimeInterval();
  }

  updateWaitTime() {
    const times = ["20 minutes", "25 minutes", "30 minutes", "35 minutes"];
    const randomTime = times[Math.floor(Math.random() * times.length)];
    const waitTimeElement = document.getElementById("waitTime");

    if (waitTimeElement) {
      // Animation de transition
      waitTimeElement.style.opacity = "0";
      setTimeout(() => {
        waitTimeElement.textContent = randomTime;
        waitTimeElement.style.opacity = "1";
      }, 300);
    }
  }

  setupWaitTimeInterval() {
    setInterval(
      () => this.updateWaitTime(),
      this.config.waitTimeUpdateInterval,
    );
  }

  setupStatsAnimation() {
    // Animation des statistiques au scroll
    const statsSection = document.querySelector(".hero-stats");
    if (statsSection) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              this.animateStats();
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.5 },
      );

      observer.observe(statsSection);
    }
  }

  animateStats() {
    const stats = document.querySelectorAll(".hero-stats h4");
    stats.forEach((stat, index) => {
      setTimeout(() => {
        stat.style.transform = "scale(1.1)";
        setTimeout(() => {
          stat.style.transform = "scale(1)";
        }, 300);
      }, index * 200);
    });
  }

  setupScrollAnimations() {
    // Animation des éléments au défilement
    const animatedElements = document.querySelectorAll(
      ".service-card, .news-card, .testimonial-card",
    );

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.style.animationDelay = `${Math.random() * 0.5}s`;
            entry.target.classList.add("slide-up");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px",
      },
    );

    animatedElements.forEach((el) => observer.observe(el));
  }

  setupInteractiveElements() {
    // Interactions des cartes de services
    const serviceCards = document.querySelectorAll(".service-card");
    serviceCards.forEach((card) => {
      card.addEventListener("mouseenter", () =>
        this.handleCardHover(card, true),
      );
      card.addEventListener("mouseleave", () =>
        this.handleCardHover(card, false),
      );
      card.addEventListener("click", (e) => {
        if (e.target.tagName !== "A" && e.target.tagName !== "BUTTON") {
          const link = card.querySelector("a");
          if (link) link.click();
        }
      });
    });

    // CTA interactions
    this.setupCTAInteractions();
  }

  handleCardHover(card, isHovering) {
    const icon = card.querySelector(".service-icon");
    if (icon) {
      icon.style.transform = isHovering
        ? "scale(1.1) rotate(5deg)"
        : "scale(1) rotate(0deg)";
    }
  }

  setupCTAInteractions() {
    const ctaButtons = document.querySelectorAll(".cta-section .btn");
    ctaButtons.forEach((btn) => {
      btn.addEventListener("mouseenter", () => {
        btn.style.transform = "translateY(-3px) scale(1.05)";
      });
      btn.addEventListener("mouseleave", () => {
        btn.style.transform = "translateY(0) scale(1)";
      });
    });
  }

  async loadDynamicContent() {
    try {
      await Promise.all([
        this.loadServices(),
        this.loadNews(),
        this.loadTestimonials(),
      ]);
    } catch (error) {
      console.error("Erreur chargement contenu dynamique:", error);
      this.loadFallbackContent();
    }
  }

  async loadServices() {
    try {
      const response = await chuApp.apiCall("/services/featured");
      if (response.data) {
        this.updateServicesGrid(response.data);
      }
    } catch (error) {
      // Utiliser les services par défaut
    }
  }

  async loadNews() {
    try {
      const response = await chuApp.apiCall("/news/latest?limit=3");
      if (response.data) {
        this.updateNewsGrid(response.data);
      }
    } catch (error) {
      // Utiliser les actualités par défaut
    }
  }

  async loadTestimonials() {
    try {
      const response = await chuApp.apiCall("/testimonials");
      if (response.data) {
        this.updateTestimonials(response.data);
      }
    } catch (error) {
      // Utiliser les témoignages par défaut
    }
  }

  updateServicesGrid(services) {
    const servicesContainer = document.getElementById("servicesGrid");
    if (servicesContainer && services.length > 0) {
      this._servicesData = services;
      servicesContainer.innerHTML = services
        .map(
          (service, index) => `
                <div class="col-md-3">
                    <div class="card service-card text-center p-4">
                        ${
                          service.image
                            ? `
                        <div class="service-image image-container" style="height:200px;overflow:hidden;border-radius:12px;margin-bottom:12px;">
                            <img src="${service.image}" alt="${service.name}" style="width:100%;height:100%;object-fit:cover;display:block;"
                                onerror="this.style.display='none';">
                        </div>`
                            : ""
                        }
                        <i class="fas ${service.icon || "fa-hospital"} service-icon"></i>
                        <h5>${service.name}</h5>
                        <p>${service.description}</p>
                        <button class="btn btn-outline-primary btn-sm" onclick="homePage.openServiceModal(${index})">
                            En savoir plus
                        </button>
                    </div>
                </div>
            `,
        )
        .join("");
      this._createHomeServiceModal();
    }
  }

  _createHomeServiceModal() {
    if (document.getElementById("homeServiceDetailModal")) return;
    const modalHtml = `
        <div class="modal fade" id="homeServiceDetailModal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-lg modal-dialog-scrollable">
                <div class="modal-content">
                    <div class="modal-header" style="background:linear-gradient(135deg,#0056A6,#003366);color:white;">
                        <h5 class="modal-title" id="home-svc-modal-title"></h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body p-4">
                        <img id="home-svc-modal-img" src="" alt="" class="img-fluid rounded mb-4 w-100"
                            style="max-height:280px;object-fit:cover;display:none;">
                        <p id="home-svc-modal-desc" class="lead mb-4"></p>
                        <div class="row g-3 mb-4">
                            <div class="col-md-4">
                                <div class="d-flex align-items-center gap-2">
                                    <i class="fas fa-clock text-primary"></i>
                                    <div>
                                        <small class="text-muted d-block">Horaires</small>
                                        <span id="home-svc-modal-hours" class="fw-semibold"></span>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="d-flex align-items-center gap-2">
                                    <i class="fas fa-phone text-primary"></i>
                                    <div>
                                        <small class="text-muted d-block">Telephone</small>
                                        <span id="home-svc-modal-phone" class="fw-semibold"></span>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="d-flex align-items-center gap-2">
                                    <i class="fas fa-map-marker-alt text-primary"></i>
                                    <div>
                                        <small class="text-muted d-block">Localisation</small>
                                        <span id="home-svc-modal-location" class="fw-semibold"></span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div id="home-svc-modal-features-section" class="mb-4" style="display:none;">
                            <h6 class="fw-bold mb-3"><i class="fas fa-check-circle text-primary me-2"></i>Prestations proposees</h6>
                            <ul id="home-svc-modal-features" class="list-unstyled row g-2"></ul>
                        </div>
                        <div id="home-svc-modal-staff-section" class="mb-2" style="display:none;">
                            <h6 class="fw-bold mb-3"><i class="fas fa-user-md text-primary me-2"></i>Equipe medicale</h6>
                            <div id="home-svc-modal-staff" class="d-flex flex-wrap gap-2"></div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fermer</button>
                        <button type="button" class="btn btn-primary" id="home-svc-modal-rdv-btn">
                            <i class="fas fa-calendar-plus me-2"></i>Prendre rendez-vous
                        </button>
                    </div>
                </div>
            </div>
        </div>`;
    document.body.insertAdjacentHTML("beforeend", modalHtml);
  }

  openServiceModal(index) {
    if (!this._servicesData || !this._servicesData[index]) return;
    const service = this._servicesData[index];
    document.getElementById("home-svc-modal-title").textContent =
      service.name || "";
    document.getElementById("home-svc-modal-desc").textContent =
      service.description || "";
    const img = document.getElementById("home-svc-modal-img");
    if (service.image) {
      img.src = service.image;
      img.alt = service.name;
      img.style.display = "block";
      img.onerror = function () {
        this.style.display = "none";
      };
    } else {
      img.style.display = "none";
    }
    document.getElementById("home-svc-modal-hours").textContent =
      service.schedule || service.hours || "Lun-Ven: 8h00-17h00";
    document.getElementById("home-svc-modal-phone").textContent =
      service.phone || "+237 672 59 26 95";
    document.getElementById("home-svc-modal-location").textContent =
      service.location || "Batiment principal";
    const featuresSection = document.getElementById(
      "home-svc-modal-features-section",
    );
    const featuresList = document.getElementById("home-svc-modal-features");
    const features = service.features || [];
    if (features.length > 0) {
      featuresSection.style.display = "block";
      featuresList.innerHTML = features
        .map(
          (f) => `
                <li class="col-md-6 d-flex align-items-start gap-2">
                    <i class="fas fa-check-circle text-success mt-1 flex-shrink-0"></i>
                    <span>${f}</span>
                </li>`,
        )
        .join("");
    } else {
      featuresSection.style.display = "none";
    }
    const staffSection = document.getElementById(
      "home-svc-modal-staff-section",
    );
    const staffDiv = document.getElementById("home-svc-modal-staff");
    const staff = service.staff || service.doctors || [];
    if (staff.length > 0) {
      staffSection.style.display = "block";
      staffDiv.innerHTML = staff
        .map(
          (s) => `
                <div class="d-flex align-items-center gap-2 p-2 border rounded">
                    <i class="fas fa-user-md text-primary"></i>
                    <span>${typeof s === "string" ? s : s.name || s}</span>
                </div>`,
        )
        .join("");
    } else {
      staffSection.style.display = "none";
    }
    document.getElementById("home-svc-modal-rdv-btn").onclick = () => {
      const modal = bootstrap.Modal.getInstance(
        document.getElementById("homeServiceDetailModal"),
      );
      if (modal) modal.hide();
      window.location.href =
        "pages/rendezvous.html?service=" +
        encodeURIComponent(service.name || "");
    };
    const modal = new bootstrap.Modal(
      document.getElementById("homeServiceDetailModal"),
    );
    modal.show();
  }

  updateNewsGrid(news) {
    const newsContainer = document.getElementById("newsGrid");
    if (newsContainer && news.length > 0) {
      newsContainer.innerHTML = news
        .map((item) => {
          const badgeColor =
            item.category === "evenement"
              ? "success"
              : item.category === "urgent"
                ? "danger"
                : "primary";
          const categoryLabel = item.category
            ? item.category.charAt(0).toUpperCase() + item.category.slice(1)
            : "Actualite";
          return `
                <div class="col-md-4">
                    <div class="card news-card">
                        <div class="news-image image-container" style="height:220px;overflow:hidden;position:relative;">
                            ${
                              item.image
                                ? `<img src="${item.image}" alt="${item.title}"
                                    style="width:100%;height:100%;object-fit:cover;object-position:center;display:block;"
                                    onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
                                <div style="display:none;height:220px;background:linear-gradient(135deg,#E6F0FA,#f8f9fa);align-items:center;justify-content:center;color:#0056A6;">
                                    <i class="fas fa-newspaper fa-3x"></i>
                                </div>`
                                : `<div style="display:flex;height:220px;background:linear-gradient(135deg,#E6F0FA,#f8f9fa);align-items:center;justify-content:center;color:#0056A6;">
                                    <i class="fas fa-newspaper fa-3x"></i>
                                </div>`
                            }
                        </div>
                        <div class="card-body p-4">
                            <span class="badge bg-${badgeColor} mb-2">${categoryLabel}</span>
                            <h5 class="card-title">${item.title}</h5>
                            <p class="card-text">${item.excerpt || item.summary || ""}</p>
                            <button class="btn btn-outline-primary btn-sm" onclick="homePage.openArticleModal('${item._id || item.id}')">
                                <i class="fas fa-book-open me-1"></i>Lire plus
                            </button>
                        </div>
                    </div>
                </div>`;
        })
        .join("");
    }
  }

  updateTestimonials(testimonials) {
    const testimonialsContainer = document.getElementById("testimonialsGrid");
    if (testimonialsContainer && testimonials.length > 0) {
      testimonialsContainer.innerHTML = testimonials
        .map(
          (testimonial) => `
                <div class="col-md-4">
                    <div class="testimonial-card">
                        <div class="d-flex align-items-center mb-3">
                            <i class="fas fa-user-circle fa-2x me-3" style="color: var(--chu-blue);"></i>
                            <div>
                                <h6 class="mb-0">${testimonial.author}</h6>
                                <small>${testimonial.service}</small>
                            </div>
                        </div>
                        <p class="mb-0">"${testimonial.content}"</p>
                    </div>
                </div>
            `,
        )
        .join("");
    }
  }

  loadFallbackContent() {
    // Contenu de fallback déjà présent dans le HTML
    console.log("Utilisation du contenu statique");
  }

  setupPerformanceMonitoring() {
    // Mesurer le temps de chargement des sections
    const sections = document.querySelectorAll("section");
    sections.forEach((section) => {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === "largest-contentful-paint") {
            console.log("LCP:", entry.startTime);
          }
        });
      });
      observer.observe({ entryTypes: ["largest-contentful-paint"] });
    });
  }

  // Gestion des clics sur les boutons d'action
  handleEmergencyClick() {
    navigation.navigateTo("urgences");
    this.trackEvent("emergency_click");
  }

  handleAppointmentClick() {
    navigation.navigateTo("rendezvous");
    this.trackEvent("appointment_click");
  }

  trackEvent(action, params = {}) {
    if (typeof gtag !== "undefined") {
      gtag("event", action, {
        event_category: "home_page",
        ...params,
      });
    }
  }

  // ─────────────────────────────────────────────────────────
  // MODAL ARTICLE COMPLET (depuis la page d'accueil)
  // ─────────────────────────────────────────────────────────

  _resolveImageUrl(imageUrl) {
    if (!imageUrl) return null;
    if (imageUrl.startsWith("http")) return imageUrl;
    const base =
      typeof APP_CONFIG !== "undefined" && APP_CONFIG.API_BASE_URL
        ? APP_CONFIG.API_BASE_URL.replace("/api", "")
        : "http://localhost:5000";
    if (imageUrl.startsWith("/")) return base + imageUrl;
    return base + "/" + imageUrl;
  }

  _formatDate(dateStr) {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  _escHtml(str) {
    if (!str) return "";
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  _getCategoryLabel(cat) {
    const labels = {
      general: "General",
      medical: "Medical",
      evenement: "Evenement",
      annonce: "Annonce",
      formation: "Formation",
      news: "Actualite",
      health: "Sante",
      research: "Recherche",
    };
    return labels[cat] || cat || "Actualite";
  }

  _getApiBase() {
    if (typeof APP_CONFIG !== "undefined" && APP_CONFIG.API_BASE_URL) {
      return APP_CONFIG.API_BASE_URL;
    }
    const origin = window.location.origin;
    return (origin === "null" ? "http://localhost:5000" : origin) + "/api";
  }

  _createHomeArticleModal() {
    if (document.getElementById("homeArticleModal")) return;
    document.body.insertAdjacentHTML(
      "beforeend",
      `
        <div class="modal fade" id="homeArticleModal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-xl modal-dialog-scrollable">
                <div class="modal-content">
                    <div class="modal-header" style="background:linear-gradient(135deg,#0056A6,#003366);color:white;">
                        <h5 class="modal-title fw-bold" id="homeArticleModalTitle" style="font-size:1.1rem;line-height:1.4;"></h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body p-0" id="homeArticleModalBody">
                        <div class="d-flex align-items-center justify-content-center py-5">
                            <div class="spinner-border text-primary"></div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <a href="pages/actualites.html" class="btn btn-outline-primary btn-sm">
                            <i class="fas fa-external-link-alt me-1"></i>Voir toutes les actualites
                        </a>
                        <button type="button" class="btn btn-secondary btn-sm" data-bs-dismiss="modal">Fermer</button>
                    </div>
                </div>
            </div>
        </div>`,
    );
  }

  async openArticleModal(articleId) {
    this._createHomeArticleModal();
    const modalEl = document.getElementById("homeArticleModal");
    const modalBody = document.getElementById("homeArticleModalBody");
    const modalTitle = document.getElementById("homeArticleModalTitle");

    modalTitle.textContent = "Chargement...";
    modalBody.innerHTML =
      '<div class="d-flex align-items-center justify-content-center py-5"><div class="spinner-border text-primary"></div></div>';

    const bsModal =
      bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
    bsModal.show();

    try {
      const apiBase = this._getApiBase();
      const res = await fetch(apiBase + "/news/" + articleId);
      const data = await res.json();
      if (!data.success || !data.data) throw new Error("Article non trouve");

      const article = data.data;
      const date = this._formatDate(article.publishedAt || article.createdAt);
      const catLabel = this._getCategoryLabel(article.category);
      const imageUrl = article.image
        ? this._resolveImageUrl(article.image)
        : null;
      const pdfUrl = article.pdf ? this._resolveImageUrl(article.pdf) : null;
      const catColors = {
        general: "#0056A6",
        medical: "#0056A6",
        evenement: "#28a745",
        annonce: "#fd7e14",
        formation: "#6f42c1",
        news: "#0056A6",
        health: "#20c997",
        research: "#6610f2",
      };
      const catColor = catColors[article.category] || "#0056A6";
      const authorParts = article.authorName
        ? article.authorName
        : article.author
          ? (
              (article.author.firstName || "") +
              " " +
              (article.author.lastName || "")
            ).trim()
          : "CHU Yaounde";

      modalTitle.textContent = article.title;

      let bodyHtml = "";

      if (imageUrl) {
        bodyHtml +=
          '<div style="height:320px;overflow:hidden;position:relative;">' +
          '<img src="' +
          imageUrl +
          '" alt="' +
          this._escHtml(article.title) +
          '"' +
          ' style="width:100%;height:100%;object-fit:cover;object-position:center;display:block;"' +
          " onerror=\"this.parentElement.style.display='none';\">" +
          "</div>";
      }

      bodyHtml += '<div class="p-4">';
      bodyHtml +=
        '<div class="d-flex flex-wrap align-items-center gap-2 mb-3">';
      bodyHtml +=
        '<span class="badge rounded-pill px-3 py-2" style="background:' +
        catColor +
        ';font-size:12px;">' +
        catLabel +
        "</span>";
      bodyHtml +=
        '<small class="text-muted"><i class="far fa-calendar me-1"></i>' +
        date +
        "</small>";
      bodyHtml +=
        '<small class="text-muted"><i class="far fa-eye me-1"></i>' +
        (article.views || 0) +
        " vue(s)</small>";
      bodyHtml +=
        '<small class="text-muted"><i class="fas fa-user me-1"></i>' +
        this._escHtml(authorParts || "CHU Yaounde") +
        "</small>";
      bodyHtml += "</div>";

      if (article.excerpt) {
        bodyHtml +=
          '<p class="lead border-start border-4 ps-3 mb-4" style="border-color:' +
          catColor +
          ' !important;color:#555;font-size:1.05rem;line-height:1.7;">' +
          this._escHtml(article.excerpt) +
          "</p>";
      }

      bodyHtml +=
        '<div style="font-size:1rem;line-height:1.85;color:#333;">' +
        (article.content
          ? article.content.replace(/\n/g, "<br>")
          : '<p class="text-muted">Contenu non disponible.</p>') +
        "</div>";

      if (pdfUrl) {
        bodyHtml +=
          '<div class="mt-4 pt-3 border-top"><a href="' +
          pdfUrl +
          '" download class="btn btn-danger btn-sm">' +
          '<i class="fas fa-file-pdf me-2"></i>Telecharger le PDF</a></div>';
      }

      bodyHtml += "</div>";
      modalBody.innerHTML = bodyHtml;
    } catch (err) {
      console.error("Erreur chargement article:", err);
      modalTitle.textContent = "Erreur";
      modalBody.innerHTML =
        '<div class="text-center py-5 text-danger">' +
        '<i class="fas fa-exclamation-circle fa-3x mb-3 d-block"></i>' +
        "<p>Impossible de charger l'article. Veuillez reessayer.</p>" +
        '<a href="pages/actualites.html" class="btn btn-outline-primary btn-sm mt-2">Voir toutes les actualites</a>' +
        "</div>";
    }
  }

  // Utilitaires pour les animations
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

  throttle(func, limit) {
    let inThrottle;
    return function () {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  }
}

// Initialisation page d'accueil
const homePage = new HomePage();

// Gestion du rechargement des données lors du retour en ligne
window.addEventListener("online", () => {
  homePage.loadDynamicContent();
});

// Export pour utilisation dans d'autres modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = { HomePage };
}
