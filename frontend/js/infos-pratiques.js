/**
 * Gestionnaire de la page Informations Pratiques
 * Fonctionnalités : Navigation par onglets, gestion des traductions
 */

class PracticalInfoManager {
  constructor() {
    this.currentSection = "admission";
    this.currentLanguage = "fr";

    this.initializeApp();
  }

  initializeApp() {
    this.bindEvents();
    this.setupLanguageManagement();
    this.showSection(this.currentSection);
  }

  setupLanguageManagement() {
    // Écouter les changements de langue
    const langSelect = document.getElementById("languageSelector");
    if (langSelect) {
      langSelect.addEventListener("change", (e) => {
        this.setLanguage(e.target.value);
      });
    }

    // Initialiser avec la langue courante
    this.currentLanguage = chuApp.languageManager.getCurrentLanguage();
    this.updateContent();
  }

  setLanguage(lang) {
    this.currentLanguage = lang;
    this.updateContent();
  }

  updateContent() {
    const translations = this.getTranslations();
    const currentLangData =
      translations[this.currentLanguage] || translations["fr"];

    // Mettre à jour tous les éléments avec data-translate
    document.querySelectorAll("[data-translate]").forEach((element) => {
      const key = element.getAttribute("data-translate");
      if (currentLangData[key]) {
        if (element.tagName === "INPUT" || element.tagName === "TEXTAREA") {
          element.placeholder = currentLangData[key];
        } else if (element.tagName === "IMG") {
          // Ne pas modifier les images
        } else if (element.querySelector("i.fa-ambulance")) {
          element.innerHTML =
            '<i class="fas fa-ambulance me-2"></i>' + currentLangData[key];
        } else if (element.querySelector("i")) {
          // Préserver les icônes <i> (téléphone, enveloppe, etc.)
          const icon = element.querySelector("i").outerHTML;
          element.innerHTML = icon + " " + currentLangData[key];
        } else {
          element.textContent = currentLangData[key];
        }
      }
    });

    // Mettre à jour les titres des sections actives
    this.updateActiveSectionTitle();
  }

  updateActiveSectionTitle() {
    const translations = this.getTranslations();
    const currentLangData =
      translations[this.currentLanguage] || translations["fr"];

    const activeSection = document.querySelector(".info-section.active");
    if (activeSection) {
      const sectionTitle = activeSection.querySelector(".section-title");
      if (sectionTitle) {
        const key = sectionTitle.getAttribute("data-translate");
        if (key && currentLangData[key]) {
          sectionTitle.textContent = currentLangData[key];
        }
      }
    }
  }

  getTranslations() {
    return {
      fr: {
        // Navigation
        admission: "Admission",
        visits: "Règlement des Visites",
        appointment: "Prise de Rendez-vous",
        emergency: "Urgences : 651 94 80 64",

        // Titres généraux
        "practical-info": "Informations Pratiques",
        "practical-info-title": "Informations Pratiques",
        "practical-info-subtitle":
          "Toutes les informations nécessaires pour préparer votre visite au CHU Yaoundé",

        // Section Admission
        "admission-title": "Procédure d'Admission",
        "step1-title": "Pré-admission",
        "step1-desc":
          "Présentez-vous à l'accueil principal muni de votre pièce d'identité, carte d'assuré et ordonnance si nécessaire.",
        "step2-title": "Enregistrement",
        "step2-desc":
          "Remplissez le formulaire d'admission et fournissez les documents requis. Un numéro de patient vous sera attribué.",
        "step3-title": "Consultation médicale",
        "step3-desc":
          "Rencontrez le médecin pour l'évaluation initiale et la prescription des examens ou traitements nécessaires.",
        "step4-title": "Hospitalisation",
        "step4-desc":
          "Si nécessaire, orientation vers le service d'hospitalisation avec attribution d'une chambre.",

        // Documents admission
        "documents-title": "Documents Requis",
        "doc-id": "Pièce d'identité (CNI, Passeport)",
        "doc-insurance": "Carte d'assurance maladie",
        "doc-prescription": "Ordonnances médicales",
        "doc-reports": "Comptes rendus médicaux antérieurs",

        // Informations admission
        "important-info-title": "Informations Importantes",
        "info-hours": "Horaires d'admission",
        "info-hours-desc":
          "Lundi - Vendredi: 7h30 - 16h30\nSamedi: 8h00 - 12h00",
        "info-waiting": "Temps d'attente",
        "info-waiting-desc":
          "Variable selon les services. Prévoyez 1 à 2 heures pour l'admission complète.",
        "info-payment": "Modalités de paiement",
        "info-payment-desc":
          "Espèces, cartes bancaires, virements. Prise en charge assurance selon accord.",

        // Sidebar admission
        "quick-contacts": "Contacts Rapides",
        "admission-phone": "Admission",
        "admission-email": "Email",
        "admission-location": "Localisation",
        "admission-location-desc": "Bâtiment Principal, Rez-de-chaussée",
        "quick-faq": "FAQ Rapide",
        "faq1-question": "Puis-je me faire accompagner ?",
        "faq1-answer":
          "Oui, un accompagnateur est autorisé pendant l'admission.",
        "faq2-question": "Y a-t-il un parking ?",
        "faq2-answer": "Oui, parking sécurisé disponible pour les visiteurs.",
        "faq3-question": "Accessibilité PMR ?",
        "faq3-answer":
          "Toutes nos installations sont accessibles aux personnes à mobilité réduite.",

        // Section Visites
        "visits-title": "Règlement des Visites",
        "visiting-hours-title": "Horaires de Visite",
        "hours-regular": "Chambres Régulières",
        "hours-regular-desc": "14h00 - 16h00\n18h00 - 20h00",
        "hours-intensive": "Soins Intensifs",
        "hours-intensive-desc":
          "30 minutes par visite\nSur autorisation médicale",
        "hours-pediatrics": "Pédiatrie",
        "hours-pediatrics-desc":
          "Un parent peut rester 24h/24\nVisites: 10h00 - 12h00, 15h00 - 17h00",

        // Règles visites
        "rules-title": "Règles de Visite",
        "rule1-title": "Nombre de visiteurs",
        "rule1-desc": "Maximum 2 visiteurs par patient en même temps",
        "rule2-title": "Fleurs et cadeaux",
        "rule2-desc": "Les fleurs coupées sont interdites en soins intensifs",
        "rule3-title": "Téléphones portables",
        "rule3-desc": "Mode silencieux obligatoire dans les chambres",
        "rule4-title": "Enfants visiteurs",
        "rule4-desc": "Les enfants de moins de 12 ans doivent être accompagnés",

        // Mesures sanitaires
        "safety-title": "Mesures Sanitaires",
        "safety-hygiene": "Désinfection des mains obligatoire",
        "safety-mask": "Port du masque recommandé",
        "safety-temperature": "Contrôle de température à l'entrée",
        "safety-visitors": "Visiteurs symptomatiques interdits",

        // Sidebar visites
        "visitor-info": "Informations Visiteurs",
        "parking-info": "Parking",
        "parking-desc": "Gratuit 2 heures pour les visiteurs",
        "cafeteria-info": "Cafétéria",
        "cafeteria-desc": "Ouverte de 7h00 à 20h00",
        "shop-info": "Boutique",
        "shop-desc": "Fleurs, journaux, snacks",
        "emergency-contacts": "Contacts Urgents",
        "visits-phone": "Standard Visites",
        security: "Sécurité",

        // CTA
        "cta-title": "Besoin d'informations supplémentaires ?",
        "cta-subtitle":
          "Notre équipe est à votre disposition pour répondre à toutes vos questions",
        "contact-us": "Nous Contacter",
        "make-appointment": "Prendre Rendez-vous",
      },
      en: {
        // Navigation
        admission: "Admission",
        visits: "Visiting Regulations",
        appointment: "Make Appointment",
        emergency: "Emergency: 651 94 80 64",

        // General titles
        "practical-info": "Practical Information",
        "practical-info-title": "Practical Information",
        "practical-info-subtitle":
          "All necessary information to prepare your visit to CHU Yaoundé",

        // Admission Section
        "admission-title": "Admission Procedure",
        "step1-title": "Pre-admission",
        "step1-desc":
          "Present yourself at the main reception with your ID, insurance card and prescription if necessary.",
        "step2-title": "Registration",
        "step2-desc":
          "Fill out the admission form and provide required documents. A patient number will be assigned to you.",
        "step3-title": "Medical consultation",
        "step3-desc":
          "Meet the doctor for initial assessment and prescription of necessary exams or treatments.",
        "step4-title": "Hospitalization",
        "step4-desc":
          "If necessary, referral to hospitalization service with room assignment.",

        // Admission documents
        "documents-title": "Required Documents",
        "doc-id": "ID Card (National ID, Passport)",
        "doc-insurance": "Health Insurance Card",
        "doc-prescription": "Medical Prescriptions",
        "doc-reports": "Previous Medical Reports",

        // Admission information
        "important-info-title": "Important Information",
        "info-hours": "Admission Hours",
        "info-hours-desc":
          "Monday - Friday: 7:30 AM - 4:30 PM\nSaturday: 8:00 AM - 12:00 PM",
        "info-waiting": "Waiting Time",
        "info-waiting-desc":
          "Varies by service. Allow 1 to 2 hours for complete admission.",
        "info-payment": "Payment Methods",
        "info-payment-desc":
          "Cash, credit cards, bank transfers. Insurance coverage according to agreement.",

        // Admission sidebar
        "quick-contacts": "Quick Contacts",
        "admission-phone": "Admission",
        "admission-email": "Email",
        "admission-location": "Location",
        "admission-location-desc": "Main Building, Ground Floor",
        "quick-faq": "Quick FAQ",
        "faq1-question": "Can I be accompanied?",
        "faq1-answer": "Yes, one companion is allowed during admission.",
        "faq2-question": "Is there parking?",
        "faq2-answer": "Yes, secure parking available for visitors.",
        "faq3-question": "Accessibility for disabled?",
        "faq3-answer":
          "All our facilities are accessible to people with reduced mobility.",

        // Visits Section
        "visits-title": "Visiting Regulations",
        "visiting-hours-title": "Visiting Hours",
        "hours-regular": "Regular Rooms",
        "hours-regular-desc": "2:00 PM - 4:00 PM\n6:00 PM - 8:00 PM",
        "hours-intensive": "Intensive Care",
        "hours-intensive-desc":
          "30 minutes per visit\nWith medical authorization",
        "hours-pediatrics": "Pediatrics",
        "hours-pediatrics-desc":
          "One parent can stay 24/7\nVisits: 10:00 AM - 12:00 PM, 3:00 PM - 5:00 PM",

        // Visiting rules
        "rules-title": "Visiting Rules",
        "rule1-title": "Number of visitors",
        "rule1-desc": "Maximum 2 visitors per patient at the same time",
        "rule2-title": "Flowers and gifts",
        "rule2-desc": "Cut flowers are prohibited in intensive care",
        "rule3-title": "Mobile phones",
        "rule3-desc": "Silent mode mandatory in rooms",
        "rule4-title": "Child visitors",
        "rule4-desc": "Children under 12 must be accompanied",

        // Safety measures
        "safety-title": "Safety Measures",
        "safety-hygiene": "Hand disinfection mandatory",
        "safety-mask": "Mask wearing recommended",
        "safety-temperature": "Temperature check at entrance",
        "safety-visitors": "Symptomatic visitors prohibited",

        // Visits sidebar
        "visitor-info": "Visitor Information",
        "parking-info": "Parking",
        "parking-desc": "Free 2 hours for visitors",
        "cafeteria-info": "Cafeteria",
        "cafeteria-desc": "Open from 7:00 AM to 8:00 PM",
        "shop-info": "Shop",
        "shop-desc": "Flowers, newspapers, snacks",
        "emergency-contacts": "Emergency Contacts",
        "visits-phone": "Visits Switchboard",
        security: "Security",

        // CTA
        "cta-title": "Need additional information?",
        "cta-subtitle": "Our team is available to answer all your questions",
        "contact-us": "Contact Us",
        "make-appointment": "Make Appointment",
      },
    };
  }

  bindEvents() {
    // Navigation par onglets
    document.querySelectorAll(".nav-tab").forEach((tab) => {
      tab.addEventListener("click", (e) => {
        const target = e.target.getAttribute("data-target");

        // Vérifier si c'est un lien externe
        if (target === "appointment" || target === "emergency") {
          return; // Laisser le onclick gérer la navigation
        }

        this.switchSection(target);
      });
    });

    // Navigation par ancres dans l'URL
    this.handleUrlHash();

    // Écouter les changements d'hash
    window.addEventListener("hashchange", () => {
      this.handleUrlHash();
    });
  }

  handleUrlHash() {
    const hash = window.location.hash.substring(1);
    if (hash && (hash === "admission" || hash === "visits")) {
      this.switchSection(hash);
    }
  }

  switchSection(sectionId) {
    // Mettre à jour les onglets
    document.querySelectorAll(".nav-tab").forEach((tab) => {
      tab.classList.remove("active");
    });

    document
      .querySelector(`.nav-tab[data-target="${sectionId}"]`)
      .classList.add("active");

    // Afficher la section
    this.showSection(sectionId);

    // Mettre à jour l'URL
    window.history.replaceState(null, null, `#${sectionId}`);

    // Mettre à jour le titre de la section
    this.updateActiveSectionTitle();
  }

  showSection(sectionId) {
    // Cacher toutes les sections
    document.querySelectorAll(".info-section").forEach((section) => {
      section.classList.remove("active");
    });

    // Afficher la section active
    const activeSection = document.getElementById(sectionId);
    if (activeSection) {
      activeSection.classList.add("active");
      this.currentSection = sectionId;

      // Animation de défilement doux
      setTimeout(() => {
        activeSection.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  }

  // Méthode pour partager des informations pratiques
  sharePracticalInfo(section) {
    const url = `${window.location.origin}${window.location.pathname}#${section}`;
    const title = document.querySelector(".section-title").textContent;

    if (navigator.share) {
      navigator.share({
        title: title,
        text: "Informations pratiques du CHU Yaoundé",
        url: url,
      });
    } else {
      // Fallback pour copier le lien
      navigator.clipboard.writeText(url).then(() => {
        this.showNotification("Lien copié dans le presse-papier !", "success");
      });
    }
  }

  showNotification(message, type = "info") {
    const notification = document.createElement("div");
    notification.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    notification.style.cssText = `
            top: 20px;
            right: 20px;
            z-index: 1060;
            min-width: 300px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        `;

    notification.innerHTML = `
            <div class="d-flex align-items-center">
                <span class="flex-grow-1">${message}</span>
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;

    document.body.appendChild(notification);

    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 5000);
  }
}

// Intégration avec le gestionnaire de langue global
if (window.chuApp && window.chuApp.languageManager) {
  // Ajouter les traductions spécifiques à la page infos-pratiques
  const practicalInfoTranslations = {
    fr: {
      // Navigation
      admission: "Admission",
      visits: "Règlement des Visites",
      appointment: "Prise de Rendez-vous",
      emergency: "Urgences : 651 94 80 64",

      // Titres généraux
      "practical-info": "Informations Pratiques",
      "practical-info-title": "Informations Pratiques",
      "practical-info-subtitle":
        "Toutes les informations nécessaires pour préparer votre visite au CHU Yaoundé",

      // Section Admission
      "admission-title": "Procédure d'Admission",
      "step1-title": "Pré-admission",
      "step1-desc":
        "Présentez-vous à l'accueil principal muni de votre pièce d'identité, carte d'assuré et ordonnance si nécessaire.",
      "step2-title": "Enregistrement",
      "step2-desc":
        "Remplissez le formulaire d'admission et fournissez les documents requis. Un numéro de patient vous sera attribué.",
      "step3-title": "Consultation médicale",
      "step3-desc":
        "Rencontrez le médecin pour l'évaluation initiale et la prescription des examens ou traitements nécessaires.",
      "step4-title": "Hospitalisation",
      "step4-desc":
        "Si nécessaire, orientation vers le service d'hospitalisation avec attribution d'une chambre.",

      // Documents admission
      "documents-title": "Documents Requis",
      "doc-id": "Pièce d'identité (CNI, Passeport)",
      "doc-insurance": "Carte d'assurance maladie",
      "doc-prescription": "Ordonnances médicales",
      "doc-reports": "Comptes rendus médicaux antérieurs",

      // Informations admission
      "important-info-title": "Informations Importantes",
      "info-hours": "Horaires d'admission",
      "info-hours-desc": "Lundi - Vendredi: 7h30 - 16h30\nSamedi: 8h00 - 12h00",
      "info-waiting": "Temps d'attente",
      "info-waiting-desc":
        "Variable selon les services. Prévoyez 1 à 2 heures pour l'admission complète.",
      "info-payment": "Modalités de paiement",
      "info-payment-desc":
        "Espèces, cartes bancaires, virements. Prise en charge assurance selon accord.",

      // Sidebar admission
      "quick-contacts": "Contacts Rapides",
      "admission-phone": "Admission",
      "admission-email": "Email",
      "admission-location": "Localisation",
      "admission-location-desc": "Bâtiment Principal, Rez-de-chaussée",
      "quick-faq": "FAQ Rapide",
      "faq1-question": "Puis-je me faire accompagner ?",
      "faq1-answer": "Oui, un accompagnateur est autorisé pendant l'admission.",
      "faq2-question": "Y a-t-il un parking ?",
      "faq2-answer": "Oui, parking sécurisé disponible pour les visiteurs.",
      "faq3-question": "Accessibilité PMR ?",
      "faq3-answer":
        "Toutes nos installations sont accessibles aux personnes à mobilité réduite.",

      // Section Visites
      "visits-title": "Règlement des Visites",
      "visiting-hours-title": "Horaires de Visite",
      "hours-regular": "Chambres Régulières",
      "hours-regular-desc": "14h00 - 16h00\n18h00 - 20h00",
      "hours-intensive": "Soins Intensifs",
      "hours-intensive-desc":
        "30 minutes par visite\nSur autorisation médicale",
      "hours-pediatrics": "Pédiatrie",
      "hours-pediatrics-desc":
        "Un parent peut rester 24h/24\nVisites: 10h00 - 12h00, 15h00 - 17h00",

      // Règles visites
      "rules-title": "Règles de Visite",
      "rule1-title": "Nombre de visiteurs",
      "rule1-desc": "Maximum 2 visiteurs par patient en même temps",
      "rule2-title": "Fleurs et cadeaux",
      "rule2-desc": "Les fleurs coupées sont interdites en soins intensifs",
      "rule3-title": "Téléphones portables",
      "rule3-desc": "Mode silencieux obligatoire dans les chambres",
      "rule4-title": "Enfants visiteurs",
      "rule4-desc": "Les enfants de moins de 12 ans doivent être accompagnés",

      // Mesures sanitaires
      "safety-title": "Mesures Sanitaires",
      "safety-hygiene": "Désinfection des mains obligatoire",
      "safety-mask": "Port du masque recommandé",
      "safety-temperature": "Contrôle de température à l'entrée",
      "safety-visitors": "Visiteurs symptomatiques interdits",

      // Sidebar visites
      "visitor-info": "Informations Visiteurs",
      "parking-info": "Parking",
      "parking-desc": "Gratuit 2 heures pour les visiteurs",
      "cafeteria-info": "Cafétéria",
      "cafeteria-desc": "Ouverte de 7h00 à 20h00",
      "shop-info": "Boutique",
      "shop-desc": "Fleurs, journaux, snacks",
      "emergency-contacts": "Contacts Urgents",
      "visits-phone": "Standard Visites",
      security: "Sécurité",

      // CTA
      "cta-title": "Besoin d'informations supplémentaires ?",
      "cta-subtitle":
        "Notre équipe est à votre disposition pour répondre à toutes vos questions",
      "contact-us": "Nous Contacter",
      "make-appointment": "Prendre Rendez-vous",
    },
    en: {
      // Navigation
      admission: "Admission",
      visits: "Visiting Regulations",
      appointment: "Make Appointment",
      emergency: "Emergency: 651 94 80 64",

      // General titles
      "practical-info": "Practical Information",
      "practical-info-title": "Practical Information",
      "practical-info-subtitle":
        "All necessary information to prepare your visit to CHU Yaoundé",

      // Admission Section
      "admission-title": "Admission Procedure",
      "step1-title": "Pre-admission",
      "step1-desc":
        "Present yourself at the main reception with your ID, insurance card and prescription if necessary.",
      "step2-title": "Registration",
      "step2-desc":
        "Fill out the admission form and provide required documents. A patient number will be assigned to you.",
      "step3-title": "Medical consultation",
      "step3-desc":
        "Meet the doctor for initial assessment and prescription of necessary exams or treatments.",
      "step4-title": "Hospitalization",
      "step4-desc":
        "If necessary, referral to hospitalization service with room assignment.",

      // Admission documents
      "documents-title": "Required Documents",
      "doc-id": "ID Card (National ID, Passport)",
      "doc-insurance": "Health Insurance Card",
      "doc-prescription": "Medical Prescriptions",
      "doc-reports": "Previous Medical Reports",

      // Admission information
      "important-info-title": "Important Information",
      "info-hours": "Admission Hours",
      "info-hours-desc":
        "Monday - Friday: 7:30 AM - 4:30 PM\nSaturday: 8:00 AM - 12:00 PM",
      "info-waiting": "Waiting Time",
      "info-waiting-desc":
        "Varies by service. Allow 1 to 2 hours for complete admission.",
      "info-payment": "Payment Methods",
      "info-payment-desc":
        "Cash, credit cards, bank transfers. Insurance coverage according to agreement.",

      // Admission sidebar
      "quick-contacts": "Quick Contacts",
      "admission-phone": "Admission",
      "admission-email": "Email",
      "admission-location": "Location",
      "admission-location-desc": "Main Building, Ground Floor",
      "quick-faq": "Quick FAQ",
      "faq1-question": "Can I be accompanied?",
      "faq1-answer": "Yes, one companion is allowed during admission.",
      "faq2-question": "Is there parking?",
      "faq2-answer": "Yes, secure parking available for visitors.",
      "faq3-question": "Accessibility for disabled?",
      "faq3-answer":
        "All our facilities are accessible to people with reduced mobility.",

      // Visits Section
      "visits-title": "Visiting Regulations",
      "visiting-hours-title": "Visiting Hours",
      "hours-regular": "Regular Rooms",
      "hours-regular-desc": "2:00 PM - 4:00 PM\n6:00 PM - 8:00 PM",
      "hours-intensive": "Intensive Care",
      "hours-intensive-desc":
        "30 minutes per visit\nWith medical authorization",
      "hours-pediatrics": "Pediatrics",
      "hours-pediatrics-desc":
        "One parent can stay 24/7\nVisits: 10:00 AM - 12:00 PM, 3:00 PM - 5:00 PM",

      // Visiting rules
      "rules-title": "Visiting Rules",
      "rule1-title": "Number of visitors",
      "rule1-desc": "Maximum 2 visitors per patient at the same time",
      "rule2-title": "Flowers and gifts",
      "rule2-desc": "Cut flowers are prohibited in intensive care",
      "rule3-title": "Mobile phones",
      "rule3-desc": "Silent mode mandatory in rooms",
      "rule4-title": "Child visitors",
      "rule4-desc": "Children under 12 must be accompanied",

      // Safety measures
      "safety-title": "Safety Measures",
      "safety-hygiene": "Hand disinfection mandatory",
      "safety-mask": "Mask wearing recommended",
      "safety-temperature": "Temperature check at entrance",
      "safety-visitors": "Symptomatic visitors prohibited",

      // Visits sidebar
      "visitor-info": "Visitor Information",
      "parking-info": "Parking",
      "parking-desc": "Free 2 hours for visitors",
      "cafeteria-info": "Cafeteria",
      "cafeteria-desc": "Open from 7:00 AM to 8:00 PM",
      "shop-info": "Shop",
      "shop-desc": "Flowers, newspapers, snacks",
      "emergency-contacts": "Emergency Contacts",
      "visits-phone": "Visits Switchboard",
      security: "Security",

      // CTA
      "cta-title": "Need additional information?",
      "cta-subtitle": "Our team is available to answer all your questions",
      "contact-us": "Contact Us",
      "make-appointment": "Make Appointment",
    },
  };

  // Fusionner les traductions
  Object.keys(practicalInfoTranslations.fr).forEach((key) => {
    if (!window.chuApp.languageManager.translations.fr[key]) {
      window.chuApp.languageManager.translations.fr[key] =
        practicalInfoTranslations.fr[key];
    }
  });

  Object.keys(practicalInfoTranslations.en).forEach((key) => {
    if (!window.chuApp.languageManager.translations.en[key]) {
      window.chuApp.languageManager.translations.en[key] =
        practicalInfoTranslations.en[key];
    }
  });
}

// Initialisation lorsque la page est chargée
document.addEventListener("DOMContentLoaded", function () {
  // Vérifier si nous sommes sur la page infos-pratiques
  if (document.querySelector(".practical-info-hero")) {
    window.practicalInfoManager = new PracticalInfoManager();

    // Synchroniser avec le gestionnaire de langue global
    if (window.chuApp && window.chuApp.languageManager) {
      // Mettre à jour le sélecteur de langue
      const langSelect = document.getElementById("languageSelector");
      if (langSelect) {
        langSelect.value = window.chuApp.languageManager.getCurrentLanguage();
      }

      // Forcer la mise à jour initiale
      setTimeout(() => {
        window.practicalInfoManager.setLanguage(
          window.chuApp.languageManager.getCurrentLanguage(),
        );
      }, 100);
    }
  }
});
