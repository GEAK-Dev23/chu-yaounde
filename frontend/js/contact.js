// Gestionnaire spécifique à la page contact avec support de traduction complet
const contactPage = {
  // Initialisation
  init: function () {
    console.log("Initialisation de la page contact");
    this.initContactForm();
    this.initMapInteractions();
    this.initSmoothScrolling();
    this.setupEventListeners();
    this.updateDynamicContent();
    this.setupLanguageObserver();
  },

  // Initialisation du formulaire de contact
  initContactForm: function () {
    const contactForm = document.getElementById("contactForm");
    if (!contactForm) return;

    contactForm.addEventListener("submit", this.handleFormSubmit.bind(this));

    // Validation en temps réel
    const inputs = contactForm.querySelectorAll("input, select, textarea");
    inputs.forEach((input) => {
      input.addEventListener("blur", this.validateField.bind(this));
      input.addEventListener("input", this.clearFieldValidation.bind(this));
    });

    // Traduction des options du select
    this.translateSelectOptions();
  },

  // Traduction des options du select
  translateSelectOptions: function () {
    const subjectSelect = document.getElementById("subject");
    if (!subjectSelect) return;

    const options = subjectSelect.querySelectorAll("option");
    options.forEach((option) => {
      if (option.hasAttribute("data-translate")) {
        const key = option.getAttribute("data-translate");
        const translation = this.getTranslation(key);
        if (translation) {
          option.textContent = translation;
        }
      }
    });
  },

  // Validation d'un champ
  validateField: function (e) {
    const field = e.target;
    const isValid = field.checkValidity();

    if (field.value.trim() === "" && field.required) {
      field.classList.add("is-invalid");
      field.classList.remove("is-valid");
    } else if (isValid) {
      field.classList.add("is-valid");
      field.classList.remove("is-invalid");
    } else {
      field.classList.add("is-invalid");
      field.classList.remove("is-valid");
    }
  },

  // Effacer la validation
  clearFieldValidation: function (e) {
    const field = e.target;
    field.classList.remove("is-invalid", "is-valid");
  },

  // Soumission du formulaire
  handleFormSubmit: async function (e) {
    e.preventDefault();

    const form = e.target;
    const isValid = form.checkValidity();

    if (!isValid) {
      e.stopPropagation();
      form.classList.add("was-validated");

      // Focus sur le premier champ invalide
      const firstInvalid = form.querySelector(".is-invalid");
      if (firstInvalid) {
        firstInvalid.focus();
      }
      return;
    }

    // Simulation d'envoi
    this.submitContactForm(form);
  },

  // Soumission du formulaire (appel API réel)
  submitContactForm: async function (form) {
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    const currentLang = this.getCurrentLanguage();

    // Afficher l'état de chargement
    const loadingText =
      currentLang === "fr"
        ? '<i class="fas fa-spinner fa-spin me-2"></i>Envoi en cours...'
        : '<i class="fas fa-spinner fa-spin me-2"></i>Sending...';
    submitBtn.innerHTML = loadingText;
    submitBtn.disabled = true;

    // Collecter les données du formulaire
    const consentEl = document.getElementById("consent");
    const payload = {
      firstName: document.getElementById("firstName").value.trim(),
      lastName: document.getElementById("lastName").value.trim(),
      email: document.getElementById("email").value.trim(),
      phone: document.getElementById("phone")
        ? document.getElementById("phone").value.trim()
        : "",
      subject: document.getElementById("subject").value,
      message: document.getElementById("message").value.trim(),
      category: document.getElementById("subject").value,
      gdprConsent: consentEl ? consentEl.checked : true,
    };

    try {
      // Déterminer l'URL de l'API
      const apiBase =
        typeof APP_CONFIG !== "undefined"
          ? APP_CONFIG.API_BASE_URL
          : "http://localhost:5000/api";

      const response = await fetch(`${apiBase}/contacts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        this.showFormSuccess();
        form.reset();
        form.classList.remove("was-validated");
      } else {
        // Afficher l'erreur retournée par le serveur
        const errMsg =
          data.message ||
          (currentLang === "fr"
            ? "Une erreur est survenue. Veuillez réessayer."
            : "An error occurred. Please try again.");
        this.showFormError(errMsg);
      }
    } catch (error) {
      console.error("Erreur envoi contact:", error);
      const errMsg =
        currentLang === "fr"
          ? "Impossible de contacter le serveur. Vérifiez votre connexion et réessayez."
          : "Unable to reach the server. Please check your connection and try again.";
      this.showFormError(errMsg);
    } finally {
      const sendText =
        this.getTranslation("send-message") || "Envoyer le message";
      submitBtn.innerHTML = `<i class="fas fa-paper-plane me-2"></i>${sendText}`;
      submitBtn.disabled = false;
    }
  },

  // Afficher le message de succès
  showFormSuccess: function () {
    // Supprimer les alertes existantes
    const existingAlerts = document.querySelectorAll(".alert-success");
    existingAlerts.forEach((alert) => alert.remove());

    // Créer une alerte de succès
    const alertDiv = document.createElement("div");
    alertDiv.className = "alert alert-success alert-dismissible fade show mt-4";
    alertDiv.style.cssText = "max-width: 600px; margin: 0 auto;";

    const successMessage =
      this.getTranslation("success-message") ||
      "Votre message a été envoyé avec succès !";
    const successDetails =
      this.getTranslation("success-details") ||
      "Nous vous répondrons dans les plus brefs délais.";

    alertDiv.innerHTML = `
            <div class="d-flex align-items-center">
                <i class="fas fa-check-circle me-3 fa-lg"></i>
                <div>
                    <strong>${successMessage}</strong><br>
                    <span class="small">${successDetails}</span>
                </div>
                <button type="button" class="btn-close ms-auto" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        `;

    // Insérer avant le formulaire
    const formCard = document.querySelector(".contact-form-card");
    if (formCard) {
      formCard.parentNode.insertBefore(alertDiv, formCard);
    }

    // Supprimer automatiquement après 5 secondes
    setTimeout(() => {
      if (alertDiv.parentNode) {
        try {
          const bsAlert = new bootstrap.Alert(alertDiv);
          bsAlert.close();
        } catch (e) {
          alertDiv.remove();
        }
      }
    }, 5000);
  },

  // Afficher un message d'erreur
  showFormError: function (message) {
    const existingAlerts = document.querySelectorAll(
      ".alert-danger.contact-alert",
    );
    existingAlerts.forEach((a) => a.remove());

    const alertDiv = document.createElement("div");
    alertDiv.className =
      "alert alert-danger alert-dismissible fade show mt-4 contact-alert";
    alertDiv.style.cssText = "max-width: 600px; margin: 0 auto;";
    alertDiv.innerHTML = `
            <div class="d-flex align-items-center">
                <i class="fas fa-exclamation-circle me-3 fa-lg"></i>
                <div>
                    <strong>${message}</strong>
                </div>
                <button type="button" class="btn-close ms-auto" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        `;

    const formCard = document.querySelector(".contact-form-card");
    if (formCard) {
      formCard.parentNode.insertBefore(alertDiv, formCard);
      formCard.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    setTimeout(() => {
      if (alertDiv.parentNode) {
        try {
          new bootstrap.Alert(alertDiv).close();
        } catch (e) {
          alertDiv.remove();
        }
      }
    }, 7000);
  },

  // Interactions avec la carte
  initMapInteractions: function () {
    console.log("Initialisation des interactions carte");
  },

  // Ouvrir Google Maps
  openGoogleMaps: function () {
    const currentLang = this.getCurrentLanguage();
    const address =
      currentLang === "fr"
        ? "CHU Yaoundé, Rue 1.789, Face Stade Ahmadou Ahidjo, Yaoundé, Cameroun"
        : "CHU Yaoundé, Street 1.789, Opposite Ahmadou Ahidjo Stadium, Yaoundé, Cameroon";

    const encodedAddress = encodeURIComponent(address);
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
    window.open(mapsUrl, "_blank");
  },

  // Navigation fluide
  initSmoothScrolling: function () {
    const links = document.querySelectorAll('a[href^="#"]');

    links.forEach((link) => {
      link.addEventListener("click", function (e) {
        const href = this.getAttribute("href");

        if (href !== "#") {
          const target = document.querySelector(href);
          if (target) {
            e.preventDefault();
            target.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          }
        }
      });
    });
  },

  // Gestionnaire de clic pour rendez-vous
  handleAppointmentClick: function () {
    // Rediriger vers la page rendez-vous
    window.location.href = "rendezvous.html";
  },

  // Configuration des écouteurs d'événements
  setupEventListeners: function () {
    // Écouteur pour les erreurs de chargement d'images
    document.addEventListener(
      "error",
      (e) => {
        if (e.target.tagName === "IMG") {
          this.handleImageError(e.target);
        }
      },
      true,
    );
  },

  // Observer les changements de langue
  setupLanguageObserver: function () {
    // Observer les changements d'attribut lang sur l'élément html
    const htmlElement = document.documentElement;
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === "attributes" &&
          mutation.attributeName === "lang"
        ) {
          console.log("Langue changée détectée:", htmlElement.lang);
          this.handleLanguageChange(htmlElement.lang);
        }
      });
    });

    observer.observe(htmlElement, {
      attributes: true,
      attributeFilter: ["lang"],
    });

    // Écouter aussi les événements personnalisés de changement de langue
    document.addEventListener("languageChanged", (e) => {
      console.log("Événement languageChanged reçu:", e.detail);
      this.handleLanguageChange(e.detail.language);
    });
  },

  // Gérer le changement de langue
  handleLanguageChange: function (newLang) {
    console.log("Changement de langue dans contact.js:", newLang);

    // Mettre à jour le contenu dynamique
    this.updateDynamicContent();

    // Mettre à jour les options du select
    this.translateSelectOptions();

    // Mettre à jour les textes des boutons et autres éléments dynamiques
    this.updateDynamicTexts();

    // Mettre à jour les placeholders des inputs
    this.updateInputPlaceholders();
  },

  // Mettre à jour le contenu dynamique
  updateDynamicContent: function () {
    console.log("Mise à jour du contenu dynamique contact");

    // Mettre à jour les textes des boutons de la carte
    this.updateMapButtonText();

    // Mettre à jour les textes des boutons d'urgence
    this.updateEmergencyButtons();
  },

  // Mettre à jour les textes dynamiques
  updateDynamicTexts: function () {
    // Mettre à jour les textes qui ne sont pas gérés par data-translate
    const dynamicElements = {
      ".contact-hero .btn": ["coordinates", "access-plan", "contact-form"],
      ".emergency-contact-card .btn": ["call-emergency", "emergency-info"],
    };

    Object.keys(dynamicElements).forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      const keys = dynamicElements[selector];

      elements.forEach((element, index) => {
        if (keys[index]) {
          const translation = this.getTranslation(keys[index]);
          if (translation && element.querySelector("span")) {
            element.querySelector("span").textContent = translation;
          }
        }
      });
    });
  },

  // Mettre à jour les placeholders des inputs
  updateInputPlaceholders: function () {
    const inputs = document.querySelectorAll(
      "input[data-translate], textarea[data-translate]",
    );
    inputs.forEach((input) => {
      const key = input.getAttribute("data-translate");
      const translation = this.getTranslation(key);
      if (translation) {
        input.placeholder = translation;
      }
    });
  },

  // Mettre à jour le texte du bouton de la carte
  updateMapButtonText: function () {
    const mapButton = document.querySelector(".map-placeholder .btn");
    if (mapButton) {
      const translation = this.getTranslation("open-map");
      if (translation && mapButton.querySelector("span")) {
        mapButton.querySelector("span").textContent = translation;
      }
    }
  },

  // Mettre à jour les boutons d'urgence
  updateEmergencyButtons: function () {
    const emergencyButtons = document.querySelectorAll(
      ".emergency-contact-card .btn",
    );
    emergencyButtons.forEach((button, index) => {
      const key = index === 0 ? "call-emergency" : "emergency-info";
      const translation = this.getTranslation(key);
      if (translation && button.querySelector("span")) {
        button.querySelector("span").textContent = translation;
      }
    });
  },

  // Obtenir la traduction pour une clé
  getTranslation: function (key) {
    if (window.chuApp && window.chuApp.languageManager) {
      const currentLang = window.chuApp.languageManager.getCurrentLanguage();
      const translations =
        window.chuApp.languageManager.translations[currentLang];
      return translations ? translations[key] : null;
    }

    // Fallback vers des traductions intégrées si le gestionnaire de langue n'est pas disponible
    const fallbackTranslations = {
      fr: {
        coordinates: "Coordonnées",
        "access-plan": "Plan d'Accès",
        "contact-form": "Formulaire de Contact",
        "open-map": "Ouvrir dans Google Maps",
        "call-emergency": "Appeler les Urgences",
        "emergency-info": "Infos Urgences",
        "send-message": "Envoyer le message",
        "success-message": "Votre message a été envoyé avec succès !",
        "success-details": "Nous vous répondrons dans les plus brefs délais.",
        "choose-subject": "Choisir un sujet",
        "appointment-request": "Demande de rendez-vous",
        "information-request": "Demande d'information",
        "emergency-info": "Informations urgences",
        complaint: "Réclamation",
        other: "Autre",
      },
      en: {
        coordinates: "Contact Information",
        "access-plan": "Access Map",
        "contact-form": "Contact Form",
        "open-map": "Open in Google Maps",
        "call-emergency": "Call Emergency",
        "emergency-info": "Emergency Info",
        "send-message": "Send Message",
        "success-message": "Your message has been sent successfully!",
        "success-details": "We will respond to you as soon as possible.",
        "choose-subject": "Choose a subject",
        "appointment-request": "Appointment request",
        "information-request": "Information request",
        "emergency-info": "Emergency information",
        complaint: "Complaint",
        other: "Other",
      },
    };

    const currentLang = this.getCurrentLanguage();
    return fallbackTranslations[currentLang]
      ? fallbackTranslations[currentLang][key]
      : null;
  },

  // Obtenir la langue courante
  getCurrentLanguage: function () {
    if (window.chuApp && window.chuApp.languageManager) {
      return window.chuApp.languageManager.getCurrentLanguage();
    }

    // Fallback vers l'attribut lang de l'élément html
    const htmlLang = document.documentElement.getAttribute("lang");
    return htmlLang || "fr";
  },

  // Gérer les erreurs d'image
  handleImageError: function (img) {
    console.warn("Erreur de chargement d'image:", img.src);

    // Remplacer par une image de secours si disponible
    if (img.hasAttribute("data-logo")) {
      img.src = "../assets/logos/chu-logo.jpeg";
    } else if (img.hasAttribute("data-logo-white")) {
      img.src = "../assets/logos/chu-logo-blanc.png";
    }
  },

  // Fonction utilitaire pour formater les numéros de téléphone
  formatPhoneNumber: function (phone) {
    return phone.replace(
      /(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/,
      "$1 $2 $3 $4 $5",
    );
  },

  // Nettoyage et destruction
  destroy: function () {
    // Nettoyer les écouteurs d'événements si nécessaire
    console.log("Nettoyage de la page contact");
  },
};

// Initialisation au chargement du DOM
document.addEventListener("DOMContentLoaded", function () {
  contactPage.init();

  // Intégration avec l'application principale
  if (window.chuApp) {
    window.chuApp.contactPage = contactPage;
  }
});

// Gérer le déchargement de la page
window.addEventListener("beforeunload", function () {
  if (window.chuApp && window.chuApp.contactPage) {
    window.chuApp.contactPage.destroy();
  }
});

// Support des modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = contactPage;
}
