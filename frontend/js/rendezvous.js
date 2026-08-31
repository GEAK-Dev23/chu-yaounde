/**
 * Gestionnaire de la page de rendez-vous
 * Fonctionnalités : Formulaire multi-étapes, validation, gestion des disponibilités
 */

class AppointmentManager {
  constructor() {
    this.currentStep = 1;
    this.totalSteps = 4;
    this.formData = {};
    this.availableDoctors = {};
    this.availableSlots = {};
    this.currentLanguage = "fr";

    this.initializeApp();
  }

  initializeApp() {
    this.bindEvents();
    this.setMinDate();
    this.loadServicesData();
    this.updateStepIndicator();
    this.setupLanguageManagement();
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
        } else if (element.tagName === "SELECT") {
          // Ne pas modifier les options des selects ici (géré séparément)
          if (
            element.id !== "service" &&
            element.id !== "doctor" &&
            element.id !== "appointmentTime"
          ) {
            const firstOption = element.querySelector('option[value=""]');
            if (firstOption) {
              firstOption.textContent = currentLangData[key];
            }
          }
        } else {
          element.textContent = currentLangData[key];
        }
      }
    });

    // Mettre à jour les options des selects spécifiques
    this.updateSelectOptions();

    // Mettre à jour les messages d'erreur
    this.updateErrorMessages();

    // Mettre à jour le résumé si on est à l'étape 4
    if (this.currentStep === 4) {
      this.updateConfirmationSummary();
    }
  }

  updateSelectOptions() {
    const translations = this.getTranslations();
    const currentLangData =
      translations[this.currentLanguage] || translations["fr"];

    // Mettre à jour les options du select de service
    const serviceSelect = document.getElementById("service");
    if (serviceSelect) {
      const options = serviceSelect.querySelectorAll("option");
      options.forEach((option) => {
        const value = option.value;
        if (value && currentLangData[value]) {
          option.textContent = currentLangData[value];
        }
      });
    }

    // Mettre à jour les placeholders des selects
    const doctorSelect = document.getElementById("doctor");
    const timeSelect = document.getElementById("appointmentTime");

    if (doctorSelect) {
      const firstOption = doctorSelect.querySelector('option[value=""]');
      if (firstOption && currentLangData["select-doctor"]) {
        firstOption.textContent = currentLangData["select-doctor"];
      }
    }

    if (timeSelect) {
      const firstOption = timeSelect.querySelector('option[value=""]');
      if (firstOption && currentLangData["select-time"]) {
        firstOption.textContent = currentLangData["select-time"];
      }

      // Mettre à jour l'option "no-slots" si elle existe
      const noSlotsOption = timeSelect.querySelector(
        'option[value=""][data-translate="no-slots"]',
      );
      if (noSlotsOption && currentLangData["no-slots"]) {
        noSlotsOption.textContent = currentLangData["no-slots"];
      }
    }
  }

  updateErrorMessages() {
    const translations = this.getTranslations();
    const currentLangData =
      translations[this.currentLanguage] || translations["fr"];

    // Mettre à jour les messages d'erreur dans les invalid-feedback
    document.querySelectorAll(".invalid-feedback").forEach((feedback) => {
      const key = feedback.getAttribute("data-translate");
      if (key && currentLangData[key]) {
        feedback.textContent = currentLangData[key];
      }
    });
  }

  getTranslations() {
    return {
      fr: {
        // Titres et sous-titres
        appointment: "Prise de Rendez-vous",
        "appointment-title": "Prenez Rendez-vous",
        "appointment-subtitle":
          "Réservez votre consultation en ligne simplement et rapidement",
        "form-title": "Nouveau Rendez-vous",

        // Étapes
        "step1-title": "Informations Personnelles",
        "step2-title": "Choix du Service",
        "step3-title": "Date et Heure",
        "step4-title": "Confirmation",

        // Champs du formulaire
        "first-name": "Prénom",
        "last-name": "Nom",
        email: "Email",
        phone: "Téléphone",
        "birth-date": "Date de Naissance",
        service: "Service Médical",
        doctor: "Médecin",
        reason: "Motif de la consultation",
        "appointment-date": "Date souhaitée",
        "appointment-time": "Heure souhaitée",

        // Placeholders et sélections
        "select-service": "Sélectionnez un service",
        "select-doctor": "Sélectionnez un médecin",
        "select-time": "Sélectionnez une heure",
        "reason-placeholder":
          "Décrivez brièvement la raison de votre visite...",
        "no-slots": "Aucun créneau disponible",

        // Services médicaux
        cardiology: "Cardiologie",
        pediatrics: "Pédiatrie",
        surgery: "Chirurgie",
        neurology: "Neurologie",
        "general-medicine": "Médecine Générale",
        dentistry: "Dentisterie",
        ophthalmology: "Ophtalmologie",
        dermatology: "Dermatologie",
        gynecology: "Gynécologie",
        orthopedics: "Orthopédie",

        // Boutons
        next: "Suivant",
        previous: "Précédent",
        "confirm-appointment": "Confirmer le Rendez-vous",

        // Fonctionnalités
        "feature-1": "Réservation 24h/24",
        "feature-2": "Confirmation immédiate",
        "feature-3": "Rappel par SMS",

        // Informations pratiques
        "practical-info-title": "Informations Pratiques",
        "info-1-title": "Horaires",
        "info-1-desc": "Lun-Ven: 7h30-17h30\nSam: 8h00-12h00",
        "info-2-title": "Documents requis",
        "info-2-desc":
          "Carte d'identité, Carte d'assuré, Anciennes ordonnances",
        "info-3-title": "Annulation",
        "info-3-desc": "Annulation gratuite jusqu'à 24h avant le rendez-vous",

        // Résumé
        "patient-info": "Informations Patient:",
        "appointment-info": "Rendez-vous:",
        "contact-info": "Contact:",

        // Conditions
        "terms-accept":
          "J'accepte les conditions générales et la politique de confidentialité",

        // Messages d'information
        "availability-info":
          "Les créneaux disponibles s'affichent en temps réel",

        // Messages d'erreur
        "first-name-error": "Veuillez saisir votre prénom.",
        "last-name-error": "Veuillez saisir votre nom.",
        "email-error": "Veuillez saisir une adresse email valide.",
        "phone-error": "Veuillez saisir votre numéro de téléphone.",
        "birth-date-error": "Veuillez saisir votre date de naissance.",
        "service-error": "Veuillez sélectionner un service.",
        "doctor-error": "Veuillez sélectionner un médecin.",
        "date-error": "Veuillez sélectionner une date valide.",
        "time-error": "Veuillez sélectionner une heure.",
        "terms-error": "Vous devez accepter les conditions générales.",

        // Messages de statut
        loading: "Traitement en cours...",
        "success-message":
          "Votre rendez-vous a été confirmé avec succès ! Vous recevrez un email de confirmation.",
        "error-message":
          "Erreur lors de la prise de rendez-vous. Veuillez réessayer.",
        "validation-message":
          "Veuillez remplir tous les champs obligatoires correctement.",
      },
      en: {
        // Titles and subtitles
        appointment: "Make an Appointment",
        "appointment-title": "Book an Appointment",
        "appointment-subtitle":
          "Schedule your consultation online simply and quickly",
        "form-title": "New Appointment",

        // Steps
        "step1-title": "Personal Information",
        "step2-title": "Service Selection",
        "step3-title": "Date and Time",
        "step4-title": "Confirmation",

        // Form fields
        "first-name": "First Name",
        "last-name": "Last Name",
        email: "Email",
        phone: "Phone",
        "birth-date": "Date of Birth",
        service: "Medical Service",
        doctor: "Doctor",
        reason: "Reason for consultation",
        "appointment-date": "Preferred Date",
        "appointment-time": "Preferred Time",

        // Placeholders and selections
        "select-service": "Select a service",
        "select-doctor": "Select a doctor",
        "select-time": "Select a time",
        "reason-placeholder": "Briefly describe the reason for your visit...",
        "no-slots": "No available slots",

        // Medical services
        cardiology: "Cardiology",
        pediatrics: "Pediatrics",
        surgery: "Surgery",
        neurology: "Neurology",
        "general-medicine": "General Medicine",
        dentistry: "Dentistry",
        ophthalmology: "Ophthalmology",
        dermatology: "Dermatology",
        gynecology: "Gynecology",
        orthopedics: "Orthopedics",

        // Buttons
        next: "Next",
        previous: "Previous",
        "confirm-appointment": "Confirm Appointment",

        // Features
        "feature-1": "24/7 Booking",
        "feature-2": "Immediate Confirmation",
        "feature-3": "SMS Reminder",

        // Practical information
        "practical-info-title": "Practical Information",
        "info-1-title": "Opening Hours",
        "info-1-desc": "Mon-Fri: 7:30 AM-5:30 PM\nSat: 8:00 AM-12:00 PM",
        "info-2-title": "Required Documents",
        "info-2-desc": "ID Card, Insurance Card, Previous prescriptions",
        "info-3-title": "Cancellation",
        "info-3-desc": "Free cancellation up to 24 hours before appointment",

        // Summary
        "patient-info": "Patient Information:",
        "appointment-info": "Appointment:",
        "contact-info": "Contact:",

        // Terms
        "terms-accept": "I accept the general terms and privacy policy",

        // Information messages
        "availability-info": "Available time slots are displayed in real time",

        // Error messages
        "first-name-error": "Please enter your first name.",
        "last-name-error": "Please enter your last name.",
        "email-error": "Please enter a valid email address.",
        "phone-error": "Please enter your phone number.",
        "birth-date-error": "Please enter your date of birth.",
        "service-error": "Please select a service.",
        "doctor-error": "Please select a doctor.",
        "date-error": "Please select a valid date.",
        "time-error": "Please select a time.",
        "terms-error": "You must accept the general terms.",

        // Status messages
        loading: "Processing...",
        "success-message":
          "Your appointment has been successfully confirmed! You will receive a confirmation email.",
        "error-message": "Error while booking appointment. Please try again.",
        "validation-message": "Please fill all required fields correctly.",
      },
    };
  }

  bindEvents() {
    // Navigation entre les étapes
    document.querySelectorAll(".next-step").forEach((button) => {
      button.addEventListener("click", (e) => {
        const nextStep = e.target.getAttribute("data-next");
        this.nextStep(nextStep);
      });
    });

    document.querySelectorAll(".prev-step").forEach((button) => {
      button.addEventListener("click", (e) => {
        const prevStep = e.target.getAttribute("data-prev");
        this.previousStep(prevStep);
      });
    });

    // Changement de service
    const serviceSelect = document.getElementById("service");
    if (serviceSelect) {
      serviceSelect.addEventListener("change", (e) => {
        this.handleServiceChange(e.target.value);
      });
    }

    // Changement de date
    const dateInput = document.getElementById("appointmentDate");
    if (dateInput) {
      dateInput.addEventListener("change", (e) => {
        this.handleDateChange(e.target.value);
      });
    }

    // Soumission du formulaire
    const appointmentForm = document.getElementById("appointmentForm");
    if (appointmentForm) {
      appointmentForm.addEventListener("submit", (e) => {
        this.handleSubmit(e);
      });
    }

    // Validation en temps réel
    this.setupRealTimeValidation();
  }

  setMinDate() {
    const today = new Date();
    const minDate = new Date(today);
    minDate.setDate(today.getDate() + 1); // Rendez-vous à partir de demain

    const dateInput = document.getElementById("appointmentDate");
    if (dateInput) {
      dateInput.min = minDate.toISOString().split("T")[0];
    }
  }

  async loadServicesData() {
    // Récupérer la valeur ?service= dans l'URL pour pré-sélection
    const urlParams = new URLSearchParams(window.location.search);
    const preselect = urlParams.get("service") || "";

    // Peupler le <select> via ServicesLoader (module partagé)
    if (typeof ServicesLoader !== "undefined") {
      await ServicesLoader.populateSelect("service", {
        placeholder: "Sélectionnez un service",
        preselect: preselect,
        onSelect: (slug) => {
          this.handleServiceChange(slug);
        },
        onLoaded: async (services) => {
          // Reconstruire availableDoctors depuis les services chargés
          this.availableDoctors = {};
          services.forEach((svc) => {
            const slug = svc.slug;
            if (slug && svc.staff && svc.staff.length > 0) {
              this.availableDoctors[slug] = svc.staff.map((p) => ({
                id: p.id || p._id || "",
                name: p.name || "",
                specialty: p.specialty || "",
              }));
            }
          });
          // Déclencher le changement si un service est pré-sélectionné
          if (preselect) {
            const serviceSelect = document.getElementById("service");
            if (serviceSelect && serviceSelect.value) {
              this.handleServiceChange(serviceSelect.value);
            }
          }
        },
      });
    } else {
      // Fallback si ServicesLoader n'est pas disponible
      console.warn(
        "ServicesLoader non disponible, utilisation des données statiques",
      );
    }

    // Créneaux horaires disponibles
    this.availableSlots = {
      morning: [
        "08:00",
        "08:30",
        "09:00",
        "09:30",
        "10:00",
        "10:30",
        "11:00",
        "11:30",
      ],
      afternoon: ["14:00", "14:30", "15:00", "15:30", "16:00", "16:30"],
    };
  }

  nextStep(nextStepId) {
    if (!this.validateCurrentStep()) {
      return;
    }

    this.saveStepData();
    this.hideCurrentStep();
    this.showStep(nextStepId);
    this.updateStepIndicator();

    if (nextStepId === "step4") {
      this.updateConfirmationSummary();
    }
  }

  previousStep(prevStepId) {
    this.hideCurrentStep();
    this.showStep(prevStepId);
    this.updateStepIndicator();
  }

  validateCurrentStep() {
    const currentStep = document.querySelector(".form-step.active");
    if (!currentStep) return false;

    const inputs = currentStep.querySelectorAll(
      "input[required], select[required], textarea[required]",
    );
    let isValid = true;

    inputs.forEach((input) => {
      if (!input.checkValidity()) {
        input.classList.add("is-invalid");
        isValid = false;
      } else {
        input.classList.remove("is-invalid");
      }
    });

    if (!isValid) {
      const translations = this.getTranslations();
      const currentLangData =
        translations[this.currentLanguage] || translations["fr"];
      this.showValidationMessage(currentLangData["validation-message"]);
    }

    return isValid;
  }

  saveStepData() {
    const currentStep = document.querySelector(".form-step.active");
    if (!currentStep) return;

    const inputs = currentStep.querySelectorAll("input, select, textarea");

    inputs.forEach((input) => {
      if (input.name || input.id) {
        const key = input.name || input.id;
        this.formData[key] = input.value;
      }
    });
  }

  hideCurrentStep() {
    const currentStep = document.querySelector(".form-step.active");
    if (currentStep) {
      currentStep.classList.remove("active");
    }
  }

  showStep(stepId) {
    const step = document.getElementById(stepId);
    if (step) {
      step.classList.add("active");
      this.currentStep = parseInt(stepId.replace("step", ""));
    }
  }

  updateStepIndicator() {
    // Mise à jour visuelle de la progression
    document.querySelectorAll(".progress-step").forEach((step, index) => {
      const stepNumber = index + 1;
      if (stepNumber === this.currentStep) {
        step.classList.add("active");
      } else if (stepNumber < this.currentStep) {
        step.classList.remove("active");
        step.classList.add("completed");
      } else {
        step.classList.remove("active", "completed");
      }
    });
  }

  handleServiceChange(serviceId) {
    const doctorSelect = document.getElementById("doctor");
    if (!doctorSelect) return;

    if (!serviceId) {
      doctorSelect.disabled = true;
      doctorSelect.innerHTML =
        '<option value="" data-translate="select-doctor">Sélectionnez un médecin</option>';
      this.updateSelectOptions(); // Mettre à jour la traduction
      return;
    }

    const doctors = this.availableDoctors[serviceId] || [];

    doctorSelect.disabled = false;
    doctorSelect.innerHTML =
      '<option value="" data-translate="select-doctor">Sélectionnez un médecin</option>';

    doctors.forEach((doctor) => {
      const option = document.createElement("option");
      option.value = doctor.id;
      option.textContent = doctor.name + " - " + doctor.specialty;
      doctorSelect.appendChild(option);
    });

    this.updateSelectOptions(); // Mettre à jour la traduction
  }

  handleDateChange(date) {
    const timeSelect = document.getElementById("appointmentTime");
    if (!timeSelect) return;

    if (!date) {
      timeSelect.disabled = true;
      timeSelect.innerHTML =
        '<option value="" data-translate="select-time">Sélectionnez une heure</option>';
      this.updateSelectOptions(); // Mettre à jour la traduction
      return;
    }

    // Simulation de disponibilités - À remplacer par appel API
    const selectedDate = new Date(date);
    const dayOfWeek = selectedDate.getDay();

    let availableTimes = [];

    // Pas de rendez-vous le dimanche
    if (dayOfWeek !== 0) {
      availableTimes =
        dayOfWeek === 6
          ? this.availableSlots.morning
          : [...this.availableSlots.morning, ...this.availableSlots.afternoon];
    }

    timeSelect.disabled = false;
    timeSelect.innerHTML =
      '<option value="" data-translate="select-time">Sélectionnez une heure</option>';

    availableTimes.forEach((time) => {
      const option = document.createElement("option");
      option.value = time;
      option.textContent = time;
      timeSelect.appendChild(option);
    });

    if (availableTimes.length === 0) {
      timeSelect.innerHTML =
        '<option value="" data-translate="no-slots">Aucun créneau disponible</option>';
      timeSelect.disabled = true;
    }

    this.updateSelectOptions(); // Mettre à jour la traduction
  }

  updateConfirmationSummary() {
    const translations = this.getTranslations();
    const currentLangData =
      translations[this.currentLanguage] || translations["fr"];

    // Mise à jour du résumé de confirmation
    const summaryPatient = document.getElementById("summaryPatient");
    const summaryAppointment = document.getElementById("summaryAppointment");
    const summaryContact = document.getElementById("summaryContact");

    if (summaryPatient) {
      summaryPatient.textContent = `${this.formData.firstName} ${this.formData.lastName} (${this.formatDate(this.formData.birthDate)})`;
    }

    if (summaryAppointment) {
      const serviceSelect = document.getElementById("service");
      const doctorSelect = document.getElementById("doctor");

      if (serviceSelect && doctorSelect) {
        const serviceText =
          serviceSelect.options[serviceSelect.selectedIndex].text;
        const doctorText =
          doctorSelect.options[doctorSelect.selectedIndex].text;

        summaryAppointment.textContent = `${serviceText} - ${doctorText} - ${this.formatDate(this.formData.appointmentDate)} à ${this.formData.appointmentTime}`;
      }
    }

    if (summaryContact) {
      summaryContact.textContent = `${this.formData.email} - ${this.formData.phone}`;
    }
  }

  async handleSubmit(e) {
    e.preventDefault();

    if (!this.validateCurrentStep()) {
      return;
    }

    const submitButton = e.target.querySelector('button[type="submit"]');
    const originalText = submitButton.innerHTML;
    const translations = this.getTranslations();
    const currentLangData =
      translations[this.currentLanguage] || translations["fr"];

    try {
      // Envoi réel vers l'API
      submitButton.disabled = true;
      submitButton.innerHTML = `<span class="loading"></span> ${currentLangData["loading"]}`;

      await this.submitAppointmentData();

      this.showSuccessMessage();
      this.resetForm();
    } catch (error) {
      console.error("Erreur rendez-vous:", error);
      const errMsg =
        error.message ||
        currentLangData["error-message"] ||
        "Erreur lors de la prise de rendez-vous.";
      this.showErrorMessage(errMsg);
    } finally {
      submitButton.disabled = false;
      submitButton.innerHTML = originalText;
    }
  }

  async submitAppointmentData() {
    // Construire le payload au format attendu par le backend
    const doctorSelect = document.getElementById("doctor");
    const selectedDoctor = doctorSelect
      ? doctorSelect.options[doctorSelect.selectedIndex]
      : null;

    // formData.doctor = l'id du médecin (value du select)
    // selectedDoctor.text = "Dr. Xxx - Spécialité" → on extrait uniquement le nom
    const doctorId =
      this.formData.doctor || (selectedDoctor ? selectedDoctor.value : "");
    const doctorText = selectedDoctor ? selectedDoctor.text : "";
    const doctorName = doctorText.includes(" - ")
      ? doctorText.split(" - ")[0].trim()
      : doctorText;

    const payload = {
      patient: {
        firstName: this.formData.firstName || "",
        lastName: this.formData.lastName || "",
        email: this.formData.email || "",
        phone: this.formData.phone || "",
        birthDate: this.formData.birthDate || "",
      },
      service: this.formData.service || "",
      doctor: {
        id: doctorId,
        name: doctorName,
      },
      appointmentDate: this.formData.appointmentDate || "",
      appointmentTime: this.formData.appointmentTime || "",
      reason: this.formData.reason || "",
    };

    // Déterminer l'URL de l'API
    const apiBase =
      typeof APP_CONFIG !== "undefined"
        ? APP_CONFIG.API_BASE_URL
        : "http://localhost:5000/api";

    const response = await fetch(`${apiBase}/appointments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      // Relever l'erreur pour que handleSubmit l'attrape
      throw new Error(
        data.message || "Erreur lors de la prise de rendez-vous.",
      );
    }

    return data;
  }

  showSuccessMessage() {
    const translations = this.getTranslations();
    const currentLangData =
      translations[this.currentLanguage] || translations["fr"];
    this.showMessage(currentLangData["success-message"], "success");
  }

  showErrorMessage(message) {
    // Afficher le message d'erreur réel (venant du serveur ou du réseau)
    const translations = this.getTranslations();
    const currentLangData =
      translations[this.currentLanguage] || translations["fr"];
    const displayMsg =
      message || currentLangData["error-message"] || "Une erreur est survenue.";
    this.showMessage(displayMsg, "error");
  }

  showValidationMessage(message) {
    this.showMessage(message, "error");
  }

  showMessage(message, type) {
    // Supprimer les messages existants
    const existingMessages = document.querySelectorAll(".alert-message");
    existingMessages.forEach((msg) => msg.remove());

    // Créer le nouveau message
    const messageDiv = document.createElement("div");
    messageDiv.className = `alert-message alert-${type}`;
    messageDiv.textContent = message;

    // Insérer au début du formulaire
    const form = document.getElementById("appointmentForm");
    if (form) {
      form.insertBefore(messageDiv, form.firstChild);

      // Auto-suppression après 5 secondes
      setTimeout(() => {
        if (messageDiv.parentNode) {
          messageDiv.remove();
        }
      }, 5000);
    }
  }

  resetForm() {
    // Réinitialiser le formulaire
    const appointmentForm = document.getElementById("appointmentForm");
    if (appointmentForm) {
      appointmentForm.reset();
    }

    this.formData = {};
    this.currentStep = 1;

    // Réinitialiser les étapes
    document.querySelectorAll(".form-step").forEach((step) => {
      step.classList.remove("active");
    });

    const step1 = document.getElementById("step1");
    if (step1) {
      step1.classList.add("active");
    }

    this.updateStepIndicator();

    // Réinitialiser les sélecteurs dépendants
    const doctorSelect = document.getElementById("doctor");
    const timeSelect = document.getElementById("appointmentTime");

    if (doctorSelect) {
      doctorSelect.disabled = true;
    }

    if (timeSelect) {
      timeSelect.disabled = true;
    }

    // Mettre à jour les traductions après reset
    this.updateContent();
  }

  setupRealTimeValidation() {
    // Validation en temps réel pour tous les champs requis
    document
      .querySelectorAll("input[required], select[required]")
      .forEach((input) => {
        input.addEventListener("blur", () => {
          if (!input.checkValidity()) {
            input.classList.add("is-invalid");
          } else {
            input.classList.remove("is-invalid");
          }
        });

        input.addEventListener("input", () => {
          if (input.checkValidity()) {
            input.classList.remove("is-invalid");
          }
        });
      });
  }

  formatDate(dateString) {
    if (!dateString) return "";

    const date = new Date(dateString);
    const options = {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    };

    return date.toLocaleDateString(
      this.currentLanguage === "fr" ? "fr-FR" : "en-US",
      options,
    );
  }
}

// Intégration avec le gestionnaire de langue global
if (window.chuApp && window.chuApp.languageManager) {
  // Ajouter les traductions spécifiques à la page rendez-vous
  const rendezvousTranslations = {
    fr: {
      // Titres et sous-titres
      appointment: "Prise de Rendez-vous",
      "appointment-title": "Prenez Rendez-vous",
      "appointment-subtitle":
        "Réservez votre consultation en ligne simplement et rapidement",
      "form-title": "Nouveau Rendez-vous",

      // Étapes
      "step1-title": "Informations Personnelles",
      "step2-title": "Choix du Service",
      "step3-title": "Date et Heure",
      "step4-title": "Confirmation",

      // Champs du formulaire
      "first-name": "Prénom",
      "last-name": "Nom",
      email: "Email",
      phone: "Téléphone",
      "birth-date": "Date de Naissance",
      service: "Service Médical",
      doctor: "Médecin",
      reason: "Motif de la consultation",
      "appointment-date": "Date souhaitée",
      "appointment-time": "Heure souhaitée",

      // Placeholders et sélections
      "select-service": "Sélectionnez un service",
      "select-doctor": "Sélectionnez un médecin",
      "select-time": "Sélectionnez une heure",
      "reason-placeholder": "Décrivez brièvement la raison de votre visite...",
      "no-slots": "Aucun créneau disponible",

      // Services médicaux
      cardiology: "Cardiologie",
      pediatrics: "Pédiatrie",
      surgery: "Chirurgie",
      neurology: "Neurologie",
      "general-medicine": "Médecine Générale",
      dentistry: "Dentisterie",
      ophthalmology: "Ophtalmologie",
      dermatology: "Dermatologie",
      gynecology: "Gynécologie",
      orthopedics: "Orthopédie",

      // Boutons
      next: "Suivant",
      previous: "Précédent",
      "confirm-appointment": "Confirmer le Rendez-vous",

      // Fonctionnalités
      "feature-1": "Réservation 24h/24",
      "feature-2": "Confirmation immédiate",
      "feature-3": "Rappel par SMS",

      // Informations pratiques
      "practical-info-title": "Informations Pratiques",
      "info-1-title": "Horaires",
      "info-1-desc": "Lun-Ven: 7h30-17h30\nSam: 8h00-12h00",
      "info-2-title": "Documents requis",
      "info-2-desc": "Carte d'identité, Carte d'assuré, Anciennes ordonnances",
      "info-3-title": "Annulation",
      "info-3-desc": "Annulation gratuite jusqu'à 24h avant le rendez-vous",

      // Résumé
      "patient-info": "Informations Patient:",
      "appointment-info": "Rendez-vous:",
      "contact-info": "Contact:",

      // Conditions
      "terms-accept":
        "J'accepte les conditions générales et la politique de confidentialité",

      // Messages d'information
      "availability-info": "Les créneaux disponibles s'affichent en temps réel",

      // Messages d'erreur
      "first-name-error": "Veuillez saisir votre prénom.",
      "last-name-error": "Veuillez saisir votre nom.",
      "email-error": "Veuillez saisir une adresse email valide.",
      "phone-error": "Veuillez saisir votre numéro de téléphone.",
      "birth-date-error": "Veuillez saisir votre date de naissance.",
      "service-error": "Veuillez sélectionner un service.",
      "doctor-error": "Veuillez sélectionner un médecin.",
      "date-error": "Veuillez sélectionner une date valide.",
      "time-error": "Veuillez sélectionner une heure.",
      "terms-error": "Vous devez accepter les conditions générales.",
    },
    en: {
      // Titles and subtitles
      appointment: "Make an Appointment",
      "appointment-title": "Book an Appointment",
      "appointment-subtitle":
        "Schedule your consultation online simply and quickly",
      "form-title": "New Appointment",

      // Steps
      "step1-title": "Personal Information",
      "step2-title": "Service Selection",
      "step3-title": "Date and Time",
      "step4-title": "Confirmation",

      // Form fields
      "first-name": "First Name",
      "last-name": "Last Name",
      email: "Email",
      phone: "Phone",
      "birth-date": "Date of Birth",
      service: "Medical Service",
      doctor: "Doctor",
      reason: "Reason for consultation",
      "appointment-date": "Preferred Date",
      "appointment-time": "Preferred Time",

      // Placeholders and selections
      "select-service": "Select a service",
      "select-doctor": "Select a doctor",
      "select-time": "Select a time",
      "reason-placeholder": "Briefly describe the reason for your visit...",
      "no-slots": "No available slots",

      // Medical services
      cardiology: "Cardiology",
      pediatrics: "Pediatrics",
      surgery: "Surgery",
      neurology: "Neurology",
      "general-medicine": "General Medicine",
      dentistry: "Dentistry",
      ophthalmology: "Ophthalmology",
      dermatology: "Dermatology",
      gynecology: "Gynecology",
      orthopedics: "Orthopedics",

      // Buttons
      next: "Next",
      previous: "Previous",
      "confirm-appointment": "Confirm Appointment",

      // Features
      "feature-1": "24/7 Booking",
      "feature-2": "Immediate Confirmation",
      "feature-3": "SMS Reminder",

      // Practical information
      "practical-info-title": "Practical Information",
      "info-1-title": "Opening Hours",
      "info-1-desc": "Mon-Fri: 7:30 AM-5:30 PM\nSat: 8:00 AM-12:00 PM",
      "info-2-title": "Required Documents",
      "info-2-desc": "ID Card, Insurance Card, Previous prescriptions",
      "info-3-title": "Cancellation",
      "info-3-desc": "Free cancellation up to 24 hours before appointment",

      // Summary
      "patient-info": "Patient Information:",
      "appointment-info": "Appointment:",
      "contact-info": "Contact:",

      // Terms
      "terms-accept": "I accept the general terms and privacy policy",

      // Information messages
      "availability-info": "Available time slots are displayed in real time",

      // Error messages
      "first-name-error": "Please enter your first name.",
      "last-name-error": "Please enter your last name.",
      "email-error": "Please enter a valid email address.",
      "phone-error": "Please enter your phone number.",
      "birth-date-error": "Please enter your date of birth.",
      "service-error": "Please select a service.",
      "doctor-error": "Please select a doctor.",
      "date-error": "Please select a valid date.",
      "time-error": "Please select a time.",
      "terms-error": "You must accept the general terms.",
    },
  };

  // Fusionner les traductions
  Object.keys(rendezvousTranslations.fr).forEach((key) => {
    if (!window.chuApp.languageManager.translations.fr[key]) {
      window.chuApp.languageManager.translations.fr[key] =
        rendezvousTranslations.fr[key];
    }
  });

  Object.keys(rendezvousTranslations.en).forEach((key) => {
    if (!window.chuApp.languageManager.translations.en[key]) {
      window.chuApp.languageManager.translations.en[key] =
        rendezvousTranslations.en[key];
    }
  });
}

// Initialisation lorsque la page est chargée
document.addEventListener("DOMContentLoaded", function () {
  // Vérifier si nous sommes sur la page rendez-vous
  if (document.querySelector(".appointment-form-section")) {
    window.appointmentManager = new AppointmentManager();

    // Synchroniser avec le gestionnaire de langue global
    if (window.chuApp && window.chuApp.languageManager) {
      // Mettre à jour le sélecteur de langue
      const langSelect = document.getElementById("languageSelector");
      if (langSelect) {
        langSelect.value = window.chuApp.languageManager.getCurrentLanguage();
      }

      // Forcer la mise à jour initiale
      setTimeout(() => {
        window.appointmentManager.setLanguage(
          window.chuApp.languageManager.getCurrentLanguage(),
        );
      }, 100);
    }
  }
});
