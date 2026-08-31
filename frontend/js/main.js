// CONFIGURATION GLOBALE ET INITIALISATION
class CHUApp {
  constructor() {
    this.config = {
      apiBaseUrl:
        typeof APP_CONFIG !== "undefined"
          ? APP_CONFIG.API_BASE_URL
          : "http://localhost:5000/api",
      appName: "CHU Yaoundé",
      version: "2.0.0",
    };
    this.currentUser = null;
    this.isMobile = this.detectMobile();
    this.languageManager = new LanguageManager();
    this.init();
  }

  detectMobile() {
    return window.innerWidth <= 768;
  }

  async init() {
    this.setupGlobalConfig();
    await this.languageManager.init();
    this.setupServiceWorker();
    this.setupErrorHandling();
    this.checkAuthStatus();
    this.setupPerformanceMonitoring();
  }

  setupGlobalConfig() {
    document.documentElement.setAttribute("data-app", this.config.appName);
    document.documentElement.setAttribute(
      "lang",
      this.languageManager.getCurrentLanguage(),
    );

    if (this.isMobile) {
      document.body.classList.add("is-mobile", "reduce-motion");
    } else {
      document.body.classList.add("is-desktop");
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      document.body.classList.add("reduce-motion");
    }
  }

  async setupServiceWorker() {
    if ("serviceWorker" in navigator) {
      try {
        await navigator.serviceWorker.register("/sw.js");
        console.log("Service Worker enregistré");
      } catch (error) {
        console.log("Échec enregistrement Service Worker:", error);
      }
    }
  }

  setupErrorHandling() {
    window.addEventListener("error", this.handleGlobalError.bind(this));
    window.addEventListener(
      "unhandledrejection",
      this.handlePromiseRejection.bind(this),
    );
  }

  handleGlobalError(event) {
    console.error("Erreur globale:", event.error);
    this.trackError(event.error);
  }

  handlePromiseRejection(event) {
    console.error("Promise rejetée:", event.reason);
    this.trackError(event.reason);
  }

  trackError(error) {
    if (this.config.apiBaseUrl !== "http://localhost:3000/api") {
      // fetch(`${this.config.apiBaseUrl}/errors`, { method: 'POST', ... })
    }
  }

  async checkAuthStatus() {
    const token = this.getStoredToken();
    if (token) {
      try {
        const user = await this.verifyToken(token);
        this.currentUser = user;
        this.updateUIForAuth(user);
      } catch (error) {
        this.clearStoredToken();
      }
    }
  }

  getStoredToken() {
    return localStorage.getItem("chu_token");
  }

  clearStoredToken() {
    localStorage.removeItem("chu_token");
    this.currentUser = null;
  }

  async verifyToken(token) {
    const response = await fetch(`${this.config.apiBaseUrl}/auth/verify`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) throw new Error("Token invalide");
    return await response.json();
  }

  updateUIForAuth(user) {
    const authElements = document.querySelectorAll("[data-auth]");
    authElements.forEach((el) => {
      const authLevel = el.getAttribute("data-auth");
      if (user && user.role === authLevel) {
        el.style.display = "";
      } else {
        el.style.display = "none";
      }
    });
  }

  setupPerformanceMonitoring() {
    if ("performance" in window) {
      const navTiming = performance.getEntriesByType("navigation")[0];
      if (navTiming) {
        console.log(
          "Temps de chargement:",
          navTiming.loadEventEnd - navTiming.navigationStart,
        );
      }
    }
  }

  changeLanguage(lang) {
    this.languageManager.setLanguage(lang);
  }

  async apiCall(endpoint, options = {}) {
    const token = this.getStoredToken();
    const defaultHeaders = {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };

    const config = {
      method: "GET",
      headers: { ...defaultHeaders, ...options.headers },
      ...options,
    };

    try {
      const response = await fetch(
        `${this.config.apiBaseUrl}${endpoint}`,
        config,
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("API Error:", error);
      this.showNotification("Erreur de connexion au serveur", "error");
      throw error;
    }
  }

  showNotification(message, type = "info", duration = 5000) {
    const types = {
      info: { class: "alert-info", icon: "ℹ️" },
      success: { class: "alert-success", icon: "✅" },
      warning: { class: "alert-warning", icon: "⚠️" },
      error: { class: "alert-danger", icon: "❌" },
    };

    const notification = document.createElement("div");
    notification.className = `alert ${types[type].class} alert-dismissible fade show position-fixed`;
    notification.style.cssText = `
            top: 20px;
            right: 20px;
            z-index: 1060;
            min-width: 300px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            border: none;
            border-radius: 10px;
        `;

    notification.innerHTML = `
            <div class="d-flex align-items-center">
                <span class="me-2">${types[type].icon}</span>
                <span class="flex-grow-1">${message}</span>
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;

    document.body.appendChild(notification);

    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, duration);
  }

  setLocalStorage(key, value, ttl = 24 * 60 * 60 * 1000) {
    const item = {
      value: value,
      expiry: Date.now() + ttl,
    };
    localStorage.setItem(key, JSON.stringify(item));
  }

  getLocalStorage(key) {
    const itemStr = localStorage.getItem(key);
    if (!itemStr) return null;

    const item = JSON.parse(itemStr);
    if (Date.now() > item.expiry) {
      localStorage.removeItem(key);
      return null;
    }
    return item.value;
  }

  formatDate(date) {
    return this.languageManager.formatDate(date);
  }

  formatTime(date) {
    return new Date(date).toLocaleTimeString(
      this.languageManager.getCurrentLanguage() === "fr" ? "fr-FR" : "en-US",
      {
        hour: "2-digit",
        minute: "2-digit",
      },
    );
  }

  onBreakpointChange(breakpoint, callback) {
    const mediaQuery = window.matchMedia(`(max-width: ${breakpoint}px)`);
    mediaQuery.addListener(callback);
    callback(mediaQuery);
  }
}

// GESTION DU MULTILINGUISME AVEC 2 LOGOS PNG SEULEMENT
class LanguageManager {
  constructor() {
    this.currentLang = "fr";
    this.translations = {
      fr: {
        // Logo en français
        logo: "assets/logos/chu-logo.png",
        // Pas de logo blanc séparé - utiliser le même logo
        logoWhite: "assets/logos/chu-logo.png",

        // Header
        emergency: "Urgences : 651 94 80 64",
        menu: "Menu",
        "patient-space": "Espace Patient",
        "emergency-service": "Service d'Urgences",
        "wait-time": "Temps d'attente moyen",
        "view-emergency": "Voir les urgences",
        "search-placeholder": "Rechercher...",
        "search-label": "Lancer la recherche",

        // Hero Section
        "hospital-name": "CHU Yaoundé",
        "hospital-description":
          "Centre Hospitalier Universitaire de Référence au Cameroun",
        "hospital-mission":
          "Soins d'excellence, enseignement et recherche au service de votre santé",
        "make-appointment": "Prendre Rendez-vous",
        "emergency-btn": "Urgences",
        "patients-year": "Patients/an",
        services: "Services",
        professionals: "Professionnels",
        "hero-image": "Image du CHU Yaoundé",

        // Services
        "our-services": "Nos Services Médicaux",
        cardiology: "Cardiologie",
        "cardiology-desc": "Soins cardiovasculaires spécialisés",
        pediatrics: "Pédiatrie",
        "pediatrics-desc": "Soins spécialisés pour enfants",
        surgery: "Chirurgie",
        "surgery-desc": "Interventions chirurgicales avancées",
        neurology: "Neurologie",
        "neurology-desc": "Soins des maladies neurologiques",
        "learn-more": "En savoir plus",
        "view-all-services": "Voir tous les services",

        // News
        "news-events": "Actualités & Événements",
        "news-1-title": "Ouverture du nouveau bloc opératoire",
        "news-1-desc":
          "Le CHU Yaoundé inaugure son nouveau bloc opératoire de haute technologie...",
        "news-2-title": "Journée portes ouvertes 2024",
        "news-2-desc":
          "Venez découvrir nos services lors de notre journée portes ouvertes...",
        "news-3-title": "Nouvelle étude sur le paludisme",
        "news-3-desc":
          "Nos chercheurs publient une étude innovante sur le traitement du paludisme...",
        "read-more": "Lire plus",
        new: "Nouveauté",
        event: "Événement",
        publication: "Publication",

        // Testimonials
        testimonials: "Témoignages de Patients",
        "cardiology-patient": "Patient en Cardiologie",
        "pediatrics-parent": "Parent en Pédiatrie",
        "surgery-patient": "Patient en Chirurgie",
        "testimonial-1":
          '"Un personnel attentionné et des soins de qualité. Merci au CHU Yaoundé pour leur professionnalisme."',
        "testimonial-2":
          '"Mon enfant a été superbement pris en charge. Les médecins sont compétents et rassurants."',
        "testimonial-3":
          '"Intervention chirurgicale réussie grâce à une équipe médicale exceptionnelle. Je recommande !"',

        // CTA
        "cta-title": "Besoin de soins médicaux ?",
        "cta-description":
          "Notre équipe est à votre disposition pour vous accompagner dans votre parcours de santé",
        "call-us": "Nous Appeler",
        "find-us": "Nous Trouver",
        "ask-question": "Poser une Question",

        // Footer
        "footer-description":
          "Centre Hospitalier Universitaire de Yaoundé Excellence en santé, enseignement et recherche",
        "patient-services": "Services Patients",
        professionals: "Professionnels",
        contact: "Contact",
        address: "Yaoundé, Cameroun",
        standard: "Standard",
        "all-rights": "Tous droits réservés",
        legal: "Mentions légales",
        privacy: "Politique de confidentialité",

        // Navigation Menu
        home: "Home",
        presentation: "Présentation du CHU",
        "services-directory": "Annuaire des Services",
        "practical-info": "Informations Pratiques",
        "news-publications": "Actualités & Publications",
        "student-space": "Espace Étudiant",
        "useful-documents": "Documents Utiles",
        "contact-access": "Contacts & Accès",

        // Submenu items
        history: "Histoire et Mission",
        organization: "Organigramme",
        "key-figures": "Chiffres Clés",
        "medical-services": "Services Médicaux",
        "surgical-services": "Services Chirurgicaux",
        "technical-services": "Services Techniques",
        "specialized-services": "Services Spécialisés",
        appointment: "Prise de Rendez-vous",
        admission: "Admission",
        visits: "Règlement des Visites",
        news: "Actualités",
        events: "Événements",
        publications: "Publications Scientifiques",
        internships: "Stages",
        training: "Formations",
        exams: "Concours",
        platform: "Plateforme Pédagogique",
        forms: "Formulaires",
        tenders: "Appels d'Offres",
        reports: "Rapports",
        coordinates: "Coordonnées",
        "access-plan": "Plan d'Accès",
        "contact-form": "Formulaire de Contact",
      },
      en: {
        // Logo en anglais
        logo: "assets/logos/chu-logo-en.png",
        // Pas de logo blanc séparé - utiliser le même logo
        logoWhite: "assets/logos/chu-logo-en.png",

        // Header
        emergency: "Emergency: 651 94 80 64",
        menu: "Menu",
        "patient-space": "Patient Area",
        "emergency-service": "Emergency Service",
        "wait-time": "Average waiting time",
        "view-emergency": "View emergency",
        "search-placeholder": "Search...",
        "search-label": "Start search",

        // Hero Section
        "hospital-name": "CHU Yaoundé",
        "hospital-description":
          "Yaoundé University Teaching Hospital - Reference Center in Cameroon",
        "hospital-mission":
          "Excellence in care, teaching and research for your health",
        "make-appointment": "Make Appointment",
        "emergency-btn": "Emergency",
        "patients-year": "Patients/year",
        services: "Services",
        professionals: "Professionals",
        "hero-image": "CHU Yaoundé Image",

        // Services
        "our-services": "Our Medical Services",
        cardiology: "Cardiology",
        "cardiology-desc": "Specialized cardiovascular care",
        pediatrics: "Pediatrics",
        "pediatrics-desc": "Specialized care for children",
        surgery: "Surgery",
        "surgery-desc": "Advanced surgical interventions",
        neurology: "Neurology",
        "neurology-desc": "Care for neurological diseases",
        "learn-more": "Learn more",
        "view-all-services": "View all services",

        // News
        "news-events": "News & Events",
        "news-1-title": "Opening of new operating block",
        "news-1-desc":
          "CHU Yaoundé inaugurates its new high-tech operating block...",
        "news-2-title": "Open day 2024",
        "news-2-desc": "Come discover our services during our open day...",
        "news-3-title": "New study on malaria",
        "news-3-desc":
          "Our researchers publish an innovative study on malaria treatment...",
        "read-more": "Read more",
        new: "New",
        event: "Event",
        publication: "Publication",

        // Testimonials
        testimonials: "Patient Testimonials",
        "cardiology-patient": "Cardiology Patient",
        "pediatrics-parent": "Pediatrics Parent",
        "surgery-patient": "Surgery Patient",
        "testimonial-1":
          '"Attentive staff and quality care. Thank you to CHU Yaoundé for their professionalism."',
        "testimonial-2":
          '"My child was wonderfully taken care of. The doctors are competent and reassuring."',
        "testimonial-3":
          '"Successful surgical intervention thanks to an exceptional medical team. I recommend!"',

        // CTA
        "cta-title": "Need medical care?",
        "cta-description":
          "Our team is available to support you in your healthcare journey",
        "call-us": "Call Us",
        "find-us": "Find Us",
        "ask-question": "Ask a Question",

        // Footer
        "footer-description":
          "Yaoundé University Teaching Hospital Excellence in healthcare, teaching and research",
        "patient-services": "Patient Services",
        professionals: "Professionals",
        contact: "Contact",
        address: "Yaoundé, Cameroon",
        standard: "Main line",
        "all-rights": "All rights reserved",
        legal: "Legal notice",
        privacy: "Privacy policy",

        // Navigation Menu
        home: "Home",
        presentation: "Hospital Presentation",
        "services-directory": "Services Directory",
        "practical-info": "Practical Information",
        "news-publications": "News & Publications",
        "student-space": "Student Area",
        "useful-documents": "Useful Documents",
        "contact-access": "Contacts & Access",

        // Submenu items
        history: "History and Mission",
        organization: "Organization Chart",
        "key-figures": "Key Figures",
        "medical-services": "Medical Services",
        "surgical-services": "Surgical Services",
        "technical-services": "Technical Services",
        "specialized-services": "Specialized Services",
        appointment: "Make Appointment",
        admission: "Admission",
        visits: "Visiting Regulations",
        news: "News",
        events: "Events",
        publications: "Scientific Publications",
        internships: "Internships",
        training: "Training",
        exams: "Exams",
        platform: "Learning Platform",
        forms: "Forms",
        tenders: "Tenders",
        reports: "Reports",
        coordinates: "Coordinates",
        "access-plan": "Access Plan",
        "contact-form": "Contact Form",
      },
    };
  }

  async init() {
    this.loadSavedLanguage();
    this.setupLanguageSwitcher();
    this.updateLogos();
    this.updateContent();
  }

  loadSavedLanguage() {
    const savedLang = localStorage.getItem("chu_language") || "fr";
    this.setLanguage(savedLang);
  }

  setupLanguageSwitcher() {
    const langSelect = document.getElementById("languageSelector");
    if (langSelect) {
      langSelect.value = this.currentLang;
      langSelect.addEventListener("change", (e) => {
        this.setLanguage(e.target.value);
      });
    }
  }

  setLanguage(lang) {
    if (this.translations[lang]) {
      this.currentLang = lang;
      localStorage.setItem("chu_language", lang);
      document.documentElement.setAttribute("lang", lang);
      this.updateLogos();
      this.updateContent();
      this.updateChatbotLanguage();
      this.updateNavigationMenu();
      this.trackLanguageChange(lang);
    }
  }

  updateLogos() {
    console.log("Mise à jour des logos pour la langue:", this.currentLang);

    const currentLangData = this.translations[this.currentLang];
    if (!currentLangData) return;

    // Mettre à jour le logo principal
    const mainLogo = document.getElementById("mainLogo");
    if (mainLogo && currentLangData.logo) {
      this.safeUpdateLogo(mainLogo, currentLangData.logo, "CHU Yaoundé");
    }

    // Mettre à jour le logo du footer
    const footerLogo = document.getElementById("footerLogo");
    if (footerLogo && currentLangData.logoWhite) {
      this.safeUpdateLogo(footerLogo, currentLangData.logoWhite, "CHU Yaoundé");
    }

    // Mettre à jour les autres logos avec data-logo
    const otherLogos = document.querySelectorAll("[data-logo]:not(#mainLogo)");
    otherLogos.forEach((logo) => {
      if (currentLangData.logo) {
        this.safeUpdateLogo(logo, currentLangData.logo, "CHU Yaoundé");
      }
    });

    // Mettre à jour les autres logos blancs avec data-logo-white
    const otherWhiteLogos = document.querySelectorAll(
      "[data-logo-white]:not(#footerLogo)",
    );
    otherWhiteLogos.forEach((logo) => {
      if (currentLangData.logoWhite) {
        this.safeUpdateLogo(logo, currentLangData.logoWhite, "CHU Yaoundé");
      }
    });
  }

  safeUpdateLogo(imgElement, newSrc, altText) {
    // Vérifier si l'image est déjà la bonne
    if (imgElement.src.includes(newSrc)) {
      return;
    }

    console.log("Changement de logo:", newSrc);

    const tempImg = new Image();

    tempImg.onload = () => {
      console.log("Logo chargé avec succès:", newSrc);
      imgElement.src = newSrc;
      imgElement.alt = altText;
      imgElement.style.opacity = "1";
      imgElement.style.border = "none";
    };

    tempImg.onerror = () => {
      console.error("Logo introuvable:", newSrc);

      // CORRECTION : Essayer d'abord avec le chemin relatif correct pour les pages
      let correctedSrc = newSrc;

      // Si nous sommes dans le dossier pages/ et que le chemin commence par assets/
      if (
        window.location.pathname.includes("/pages/") &&
        newSrc.startsWith("assets/")
      ) {
        correctedSrc = "../" + newSrc;
        console.log("Correction du chemin pour pages/ :", correctedSrc);
      }

      const tempImg2 = new Image();
      tempImg2.onload = () => {
        imgElement.src = correctedSrc;
        imgElement.alt = altText;
        imgElement.style.opacity = "1";
        imgElement.style.border = "none";
      };
      tempImg2.onerror = () => {
        console.error("Logo toujours introuvable:", correctedSrc);
        imgElement.style.opacity = "0.7";
        imgElement.style.border = "2px dashed #ccc";
        imgElement.alt = "Logo temporairement indisponible - " + altText;
      };
      tempImg2.src = correctedSrc;
    };

    tempImg.src = newSrc;
  }

  updateContent() {
    this.updateTextElements();
    this.updateMetaTags();
    this.updatePageTitle();
    this.updateNavigationMenu();
  }

  updateTextElements() {
    // Mettre à jour tous les éléments avec data-translate
    const translateElements = document.querySelectorAll("[data-translate]");
    translateElements.forEach((element) => {
      const key = element.getAttribute("data-translate");
      const translation = this.translations[this.currentLang][key];
      if (translation && !element.src) {
        // Ne pas modifier les images
        if (element.tagName === "INPUT" || element.tagName === "TEXTAREA") {
          element.placeholder = translation;
        } else if (element.tagName === "IMG") {
          // Ne pas modifier les images
          return;
        } else if (element.querySelector("i.fa-ambulance")) {
          // Garder l'icône d'urgence
          element.innerHTML =
            '<i class="fas fa-ambulance me-2"></i>' + translation;
        } else if (element.querySelector("i")) {
          // Garder les autres icônes
          const icon = element.querySelector("i").outerHTML;
          element.innerHTML = icon + " " + translation;
        } else {
          element.textContent = translation;
        }
      }
    });
  }

  updateNavigationMenu() {
    // Mettre à jour le menu de navigation principal
    const menuItems = document.querySelectorAll(".panel-nav-item > a");
    menuItems.forEach((item) => {
      const key = this.getTranslationKeyFromHref(item.getAttribute("href"));
      if (key && this.translations[this.currentLang][key]) {
        if (item.querySelector(".fa-ambulance")) {
          item.innerHTML =
            '<i class="fas fa-ambulance me-2"></i>' +
            this.translations[this.currentLang][key];
        } else {
          item.textContent = this.translations[this.currentLang][key];
        }
      }
    });

    // Mettre à jour les sous-menus
    const submenuItems = document.querySelectorAll(".panel-submenu a");
    submenuItems.forEach((item) => {
      const text = item.textContent.trim();
      // Chercher la traduction correspondante
      for (const [key, translation] of Object.entries(
        this.translations[this.currentLang],
      )) {
        if (
          this.translations.fr[key] === text ||
          this.translations.en[key] === text
        ) {
          item.textContent = translation;
          break;
        }
      }
    });
  }

  getTranslationKeyFromHref(href) {
    if (!href) return null;

    const pageMap = {
      "index.html": "home",
      "presentation.html": "presentation",
      "services.html": "services-directory",
      "infos-pratiques.html": "practical-info",
      "actualites.html": "news-publications",
      "etudiants.html": "student-space",
      "documents.html": "useful-documents",
      "contact.html": "contact-access",
      "urgences.html": "emergency",
    };

    for (const [page, key] of Object.entries(pageMap)) {
      if (href.includes(page)) {
        return key;
      }
    }
    return null;
  }

  updateMetaTags() {
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.content =
        this.currentLang === "fr"
          ? "Centre Hospitalier Universitaire de Yaoundé - Soins d'excellence, enseignement et recherche"
          : "Yaoundé University Teaching Hospital - Excellence in care, teaching and research";
    }

    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
      ogTitle.content =
        this.currentLang === "fr"
          ? "CHU Yaoundé - Centre Hospitalier Universitaire"
          : "CHU Yaoundé - University Teaching Hospital";
    }

    const ogDescription = document.querySelector(
      'meta[property="og:description"]',
    );
    if (ogDescription) {
      ogDescription.content =
        this.currentLang === "fr"
          ? "Soins d'excellence, enseignement et recherche au service de votre santé"
          : "Excellence in healthcare, teaching and research for your well-being";
    }
  }

  updatePageTitle() {
    const title =
      this.currentLang === "fr"
        ? "CHU Yaoundé - Centre Hospitalier Universitaire"
        : "CHU Yaoundé - University Teaching Hospital";
    document.title = title;
  }

  updateChatbotLanguage() {
    if (window.chatbot) {
      chatbot.setLanguage(this.currentLang);
    }
  }

  getCurrentLanguage() {
    return this.currentLang;
  }

  formatDate(date, options = {}) {
    const locales = {
      fr: "fr-FR",
      en: "en-US",
    };

    const defaultOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
    };

    return new Date(date).toLocaleDateString(locales[this.currentLang], {
      ...defaultOptions,
      ...options,
    });
  }

  trackLanguageChange(lang) {
    if (typeof gtag !== "undefined") {
      gtag("event", "language_change", {
        event_category: "engagement",
        event_label: lang,
      });
    }
  }
}

// Initialisation globale
const chuApp = new CHUApp();

// Préchargement des assets
window.addEventListener("load", function () {
  // Précharger les logos pour les deux langues
  const preloadLinks = [
    "assets/logos/chu-logo.png",
    "assets/logos/chu-logo-en.png",
  ];

  preloadLinks.forEach((src) => {
    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "image";
    link.href = src;
    document.head.appendChild(link);
  });
});

// Fonction globale de gestion d'erreur pour les logos
function handleLogoError(img) {
  console.warn("Logo non trouvé:", img.src);
  img.style.opacity = "0.7";
  img.style.border = "2px dashed #ccc";
  img.alt = "Logo non disponible - " + img.alt;
}

// ── Barre de recherche du header ──────────────────────────────────────────────
(function setupHeaderSearch() {
  const isRoot = !window.location.pathname.includes("/pages/");
  const targetPage = isRoot ? "pages/actualites.html" : "actualites.html";

  function doHeaderSearch() {
    const input = document.querySelector(".search-box .form-control");
    if (!input) return;
    const q = input.value.trim();
    if (!q) return;
    window.location.href = targetPage + "?q=" + encodeURIComponent(q);
  }

  document.addEventListener("DOMContentLoaded", function () {
    const input = document.querySelector(".search-box .form-control");
    const btn = document.querySelector(".search-btn");

    if (btn) btn.addEventListener("click", doHeaderSearch);
    if (input) {
      input.addEventListener("keypress", function (e) {
        if (e.key === "Enter") doHeaderSearch();
      });
    }
  });
})();
