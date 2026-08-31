/**
 * ESPACE PATIENT - Authentification, dashboard et fonctionnalités
 */

class PatientSpace {
  constructor() {
    this.apiBaseUrl =
      typeof APP_CONFIG !== "undefined"
        ? APP_CONFIG.API_BASE_URL
        : "http://localhost:5000/api";
    this.currentPatient = null;
    this.token = null;
    this.init();
  }

  init() {
    this.checkAuthStatus();
    this.setupEventListeners();
    // Définir la date min du RDV à demain
    const rdvDateInput = document.getElementById("rdvDate");
    if (rdvDateInput) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      rdvDateInput.min = tomorrow.toISOString().split("T")[0];
    }
    // Pré-charger les services dès l'init pour peupler le select RDV
    this._loadServicesIntoRdvSelect();
  }

  async _loadServicesIntoRdvSelect() {
    if (typeof ServicesLoader !== "undefined") {
      await ServicesLoader.populateSelect("rdvService", {
        placeholder: "-- Sélectionner un service --",
        onSelect: () => {
          // Recharger les créneaux quand le service change
          this.loadSlots();
        },
      });
    }
  }

  setupEventListeners() {
    const loginForm = document.getElementById("loginForm");
    if (loginForm)
      loginForm.addEventListener("submit", (e) => this.handleLogin(e));

    const registerForm = document.getElementById("registerForm");
    if (registerForm)
      registerForm.addEventListener("submit", (e) => this.handleRegister(e));
  }

  // ─────────────────────────────────────────
  // AUTHENTIFICATION
  // ─────────────────────────────────────────

  async handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;

    if (!email || !password) {
      this.showAlert("Veuillez remplir tous les champs", "danger");
      return;
    }

    try {
      const res = await fetch(`${this.apiBaseUrl}/patients/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (data.success) {
        this.token = data.token;
        localStorage.setItem("patient_token", data.token);
        localStorage.setItem("patient_data", JSON.stringify(data.data.patient));
        this.showAlert("Connexion réussie!", "success");
        setTimeout(() => this.showDashboard(data.data.patient), 1000);
      } else {
        this.showAlert(data.message || "Erreur de connexion", "danger");
      }
    } catch (error) {
      this.showAlert("Erreur de connexion au serveur", "danger");
    }
  }

  async handleRegister(e) {
    e.preventDefault();
    const password = document.getElementById("registerPassword").value;
    const passwordConfirm = document.getElementById(
      "registerPasswordConfirm",
    ).value;

    if (password !== passwordConfirm) {
      this.showAlert("Les mots de passe ne correspondent pas", "danger");
      return;
    }
    if (password.length < 6) {
      this.showAlert(
        "Le mot de passe doit contenir au moins 6 caractères",
        "danger",
      );
      return;
    }

    const formData = {
      firstName: document.getElementById("registerFirstName").value.trim(),
      lastName: document.getElementById("registerLastName").value.trim(),
      dateOfBirth: document.getElementById("registerDOB").value,
      gender: document.getElementById("registerGender").value,
      phone: document.getElementById("registerPhone").value.trim(),
      email: document.getElementById("registerEmail").value.trim(),
      address: document.getElementById("registerAddress").value.trim(),
      bloodGroup: document.getElementById("registerBloodGroup").value,
      emergencyContact: document
        .getElementById("registerEmergencyContact")
        .value.trim(),
      password,
    };

    if (
      !formData.firstName ||
      !formData.lastName ||
      !formData.dateOfBirth ||
      !formData.gender ||
      !formData.phone ||
      !formData.email ||
      !formData.address
    ) {
      this.showAlert(
        "Veuillez remplir tous les champs obligatoires (*)",
        "danger",
      );
      return;
    }

    try {
      const res = await fetch(`${this.apiBaseUrl}/patients/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (data.success) {
        this.token = data.token;
        localStorage.setItem("patient_token", data.token);
        localStorage.setItem("patient_data", JSON.stringify(data.data.patient));
        this.showAlert(
          "Inscription réussie! Bienvenue au CHU de Yaoundé",
          "success",
        );
        setTimeout(() => this.showDashboard(data.data.patient), 1500);
      } else {
        this.showAlert(
          data.message || "Erreur lors de l'inscription",
          "danger",
        );
      }
    } catch (error) {
      this.showAlert("Erreur de connexion au serveur.", "danger");
    }
  }

  checkAuthStatus() {
    const token = localStorage.getItem("patient_token");
    const patientData = localStorage.getItem("patient_data");
    if (token && patientData) {
      try {
        this.token = token;
        const patient = JSON.parse(patientData);
        this.showDashboard(patient);
      } catch (error) {
        this.logout();
      }
    }
  }

  // ─────────────────────────────────────────
  // DASHBOARD
  // ─────────────────────────────────────────

  showDashboard(patient) {
    this.currentPatient = patient;

    const authSection = document.getElementById("authSection");
    const authContainer = document.getElementById("authContainer");
    const benefitsSection = document.querySelector(".benefits");
    if (authSection) authSection.style.display = "none";
    if (authContainer) authContainer.style.display = "none";
    if (benefitsSection) benefitsSection.style.display = "none";

    const dashboardSection = document.getElementById("dashboardSection");
    if (dashboardSection) {
      dashboardSection.style.display = "block";
      const nameEl = document.getElementById("patientName");
      const dossierEl = document.getElementById("dossierNumber");
      if (nameEl)
        nameEl.textContent = `${patient.firstName} ${patient.lastName}`;
      if (dossierEl) dossierEl.textContent = patient.dossierNumber;

      const apptEl = document.getElementById("appointmentsCount");
      const docEl = document.getElementById("documentsCount");
      const prescEl = document.getElementById("prescriptionsCount");
      const visitEl = document.getElementById("visitsCount");
      if (apptEl) apptEl.textContent = patient.appointments?.length || 0;
      if (docEl) docEl.textContent = patient.documents?.length || 0;
      if (prescEl) prescEl.textContent = 0;
      if (visitEl) visitEl.textContent = patient.medicalHistory?.length || 0;
    }

    // Charger les rendez-vous
    this.loadAppointments();
    window.scrollTo(0, 0);
  }

  async loadAppointments() {
    try {
      const res = await fetch(`${this.apiBaseUrl}/patients/appointments`, {
        headers: { Authorization: `Bearer ${this.token}` },
      });
      const data = await res.json();
      const container = document.getElementById("appointmentsList");
      if (!container) return;

      if (data.success && data.data && data.data.length > 0) {
        // Charger les noms de services dynamiquement
        let serviceNames = {};
        if (typeof ServicesLoader !== "undefined") {
          serviceNames = await ServicesLoader.getServiceNames();
        }
        // Fallback si vide
        if (Object.keys(serviceNames).length === 0) {
          serviceNames = {
            general: "Médecine Générale",
            cardiology: "Cardiologie",
            pediatrics: "Pédiatrie",
            surgery: "Chirurgie",
            neurology: "Neurologie",
            ophthalmology: "Ophtalmologie",
            dermatology: "Dermatologie",
            dentistry: "Dentisterie",
            gynecology: "Gynécologie",
            orthopedics: "Orthopédie",
          };
        }
        const statusBadge = {
          pending: '<span class="badge bg-warning">En attente</span>',
          confirmed: '<span class="badge bg-success">Confirmé</span>',
          cancelled: '<span class="badge bg-danger">Annulé</span>',
          completed: '<span class="badge bg-secondary">Terminé</span>',
        };

        const upcoming = data.data.filter(
          (a) => a.status !== "cancelled" && a.status !== "completed",
        );
        if (upcoming.length > 0) {
          container.innerHTML = upcoming
            .map(
              (a) => `
                        <div class="d-flex align-items-center justify-content-between p-3 border rounded mb-2">
                            <div>
                                <strong>${serviceNames[a.service] || a.service}</strong>
                                <div class="text-muted small">
                                    ${new Date(a.appointmentDate).toLocaleDateString("fr-FR")} à ${a.appointmentTime}
                                </div>
                                ${a.reason ? `<div class="text-muted small">Motif: ${a.reason}</div>` : ""}
                            </div>
                            <div>${statusBadge[a.status] || a.status}</div>
                        </div>
                    `,
            )
            .join("");

          // Mettre à jour le compteur
          const apptEl = document.getElementById("appointmentsCount");
          if (apptEl) apptEl.textContent = upcoming.length;
        } else {
          container.innerHTML = `<div class="alert alert-info"><i class="fas fa-info-circle me-2"></i>Aucun rendez-vous à venir. <a href="#" class="alert-link ms-1" onclick="patientSpace.openModal('rdv'); return false;">Prendre rendez-vous</a></div>`;
        }
      }
    } catch (error) {
      console.log("Impossible de charger les rendez-vous:", error.message);
    }
  }

  // ─────────────────────────────────────────
  // MODALS
  // ─────────────────────────────────────────

  openModal(type) {
    const modals = {
      rdv: "modalRdv",
      resultats: "modalResultats",
      messagerie: "modalMessagerie",
      profil: "modalProfil",
    };
    const modalId = modals[type];
    if (!modalId) return;

    if (type === "profil") this.prefillProfile();
    if (type === "messagerie") this.loadMessages();

    const modalEl = document.getElementById(modalId);
    if (modalEl && typeof bootstrap !== "undefined") {
      new bootstrap.Modal(modalEl).show();
    }
  }

  // ─────────────────────────────────────────
  // RENDEZ-VOUS
  // ─────────────────────────────────────────

  async loadSlots() {
    const service = document.getElementById("rdvService")?.value;
    const date = document.getElementById("rdvDate")?.value;
    const slotsContainer = document.getElementById("rdvSlotsContainer");
    const slotsDiv = document.getElementById("rdvSlots");
    const timeInput = document.getElementById("rdvTime");

    if (!service || !date) return;

    slotsDiv.innerHTML =
      '<div class="text-muted"><i class="fas fa-spinner fa-spin me-1"></i>Chargement des créneaux...</div>';
    if (slotsContainer) slotsContainer.style.display = "block";
    if (timeInput) timeInput.value = "";

    try {
      const res = await fetch(
        `${this.apiBaseUrl}/patients/slots?date=${date}&service=${service}`,
      );
      const data = await res.json();

      if (data.success && data.slots && data.slots.length > 0) {
        slotsDiv.innerHTML = data.slots
          .map(
            (slot) => `
                    <button type="button"
                        class="btn btn-outline-primary btn-sm slot-btn"
                        onclick="patientSpace.selectSlot('${slot.time}', this)">
                        ${slot.time}
                    </button>
                `,
          )
          .join("");
      } else {
        slotsDiv.innerHTML =
          '<div class="text-warning"><i class="fas fa-exclamation-triangle me-1"></i>Aucun créneau disponible pour cette date. Choisissez une autre date.</div>';
      }
    } catch (error) {
      slotsDiv.innerHTML =
        '<div class="text-danger">Erreur lors du chargement des créneaux.</div>';
    }
  }

  selectSlot(time, btn) {
    document
      .querySelectorAll(".slot-btn")
      .forEach((b) => b.classList.remove("active", "btn-primary"));
    btn.classList.add("active", "btn-primary");
    btn.classList.remove("btn-outline-primary");
    const timeInput = document.getElementById("rdvTime");
    if (timeInput) timeInput.value = time;
  }

  async submitRdv() {
    const service = document.getElementById("rdvService")?.value;
    const date = document.getElementById("rdvDate")?.value;
    const time = document.getElementById("rdvTime")?.value;
    const reason = document.getElementById("rdvReason")?.value?.trim();

    if (!service) {
      this.showAlert("Veuillez sélectionner un service", "warning");
      return;
    }
    if (!date) {
      this.showAlert("Veuillez choisir une date", "warning");
      return;
    }
    if (!time) {
      this.showAlert("Veuillez sélectionner un créneau horaire", "warning");
      return;
    }

    try {
      const res = await fetch(`${this.apiBaseUrl}/patients/appointments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.token}`,
        },
        body: JSON.stringify({
          service,
          appointmentDate: date,
          appointmentTime: time,
          reason,
        }),
      });
      const data = await res.json();

      if (data.success) {
        // Fermer le modal
        const modalEl = document.getElementById("modalRdv");
        if (modalEl) bootstrap.Modal.getInstance(modalEl)?.hide();

        this.showAlert(
          "Rendez-vous confirmé! Vous serez contacté pour confirmation.",
          "success",
        );

        // Réinitialiser le formulaire
        document.getElementById("rdvService").value = "";
        document.getElementById("rdvDate").value = "";
        document.getElementById("rdvTime").value = "";
        document.getElementById("rdvReason").value = "";
        document.getElementById("rdvSlotsContainer").style.display = "none";

        // Recharger les rendez-vous
        setTimeout(() => this.loadAppointments(), 500);
      } else {
        this.showAlert(
          data.message || "Erreur lors de la création du rendez-vous",
          "danger",
        );
      }
    } catch (error) {
      this.showAlert("Erreur de connexion au serveur", "danger");
    }
  }

  // ─────────────────────────────────────────
  // MESSAGERIE
  // ─────────────────────────────────────────

  async loadMessages() {
    const container = document.getElementById("messagesList");
    if (!container) return;
    container.innerHTML =
      '<div class="text-muted"><i class="fas fa-spinner fa-spin me-1"></i>Chargement...</div>';

    try {
      const res = await fetch(`${this.apiBaseUrl}/patients/messages`, {
        headers: { Authorization: `Bearer ${this.token}` },
      });
      const data = await res.json();

      if (data.success && data.data && data.data.length > 0) {
        container.innerHTML = data.data
          .map(
            (msg) => `
                    <div class="border rounded p-3 mb-2 ${msg.from === "patient" ? "bg-light" : "border-primary"}">
                        <div class="d-flex justify-content-between mb-1">
                            <strong>${msg.from === "patient" ? "Vous" : "Équipe médicale"}</strong>
                            <small class="text-muted">${new Date(msg.date).toLocaleDateString("fr-FR")}</small>
                        </div>
                        <div class="fw-bold small">${msg.subject}</div>
                        <div class="mt-1">${msg.content}</div>
                        ${msg.reply ? `<div class="mt-2 p-2 bg-white border-start border-primary border-3 rounded"><small class="text-primary fw-bold">Réponse:</small> ${msg.reply}</div>` : ""}
                    </div>
                `,
          )
          .join("");
      } else {
        container.innerHTML =
          '<p class="text-muted text-center py-3"><i class="fas fa-inbox fa-2x d-block mb-2"></i>Aucun message pour le moment.</p>';
      }
    } catch (error) {
      container.innerHTML =
        '<p class="text-muted text-center">Impossible de charger les messages.</p>';
    }
  }

  async sendMessage() {
    const subject = document.getElementById("msgSubject")?.value?.trim();
    const content = document.getElementById("msgContent")?.value?.trim();

    if (!subject || !content) {
      this.showAlert("Veuillez remplir le sujet et le message", "warning");
      return;
    }

    try {
      const res = await fetch(`${this.apiBaseUrl}/patients/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.token}`,
        },
        body: JSON.stringify({ subject, content }),
      });
      const data = await res.json();

      if (data.success) {
        document.getElementById("msgSubject").value = "";
        document.getElementById("msgContent").value = "";
        this.showAlert("Message envoyé avec succès!", "success");
        this.loadMessages();
      } else {
        this.showAlert(data.message || "Erreur lors de l'envoi", "danger");
      }
    } catch (error) {
      this.showAlert("Erreur de connexion au serveur", "danger");
    }
  }

  // ─────────────────────────────────────────
  // PROFIL
  // ─────────────────────────────────────────

  prefillProfile() {
    if (!this.currentPatient) return;
    const p = this.currentPatient;
    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = val || "";
    };
    set("profilFirstName", p.firstName);
    set("profilLastName", p.lastName);
    set("profilPhone", p.phone);
    set("profilAddress", p.address);
    set("profilBloodGroup", p.bloodGroup);
    set("profilEmergencyContact", p.emergencyContact);
    // Réinitialiser les champs mot de passe
    ["profilCurrentPwd", "profilNewPwd", "profilNewPwdConfirm"].forEach((id) =>
      set(id, ""),
    );
  }

  async saveProfile() {
    const newPwd = document.getElementById("profilNewPwd")?.value;
    const newPwdConfirm = document.getElementById("profilNewPwdConfirm")?.value;

    if (newPwd && newPwd !== newPwdConfirm) {
      this.showAlert(
        "Les nouveaux mots de passe ne correspondent pas",
        "danger",
      );
      return;
    }

    const body = {
      firstName: document.getElementById("profilFirstName")?.value?.trim(),
      lastName: document.getElementById("profilLastName")?.value?.trim(),
      phone: document.getElementById("profilPhone")?.value?.trim(),
      address: document.getElementById("profilAddress")?.value?.trim(),
      bloodGroup: document.getElementById("profilBloodGroup")?.value,
      emergencyContact: document
        .getElementById("profilEmergencyContact")
        ?.value?.trim(),
    };

    if (newPwd) {
      body.currentPassword = document.getElementById("profilCurrentPwd")?.value;
      body.newPassword = newPwd;
    }

    try {
      const res = await fetch(`${this.apiBaseUrl}/patients/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.token}`,
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (data.success) {
        // Mettre à jour les données locales
        const updatedPatient = data.data.patient;
        this.currentPatient = updatedPatient;
        localStorage.setItem("patient_data", JSON.stringify(updatedPatient));

        // Mettre à jour l'affichage du nom
        const nameEl = document.getElementById("patientName");
        if (nameEl)
          nameEl.textContent = `${updatedPatient.firstName} ${updatedPatient.lastName}`;

        // Fermer le modal
        const modalEl = document.getElementById("modalProfil");
        if (modalEl) bootstrap.Modal.getInstance(modalEl)?.hide();

        this.showAlert("Profil mis à jour avec succès!", "success");
      } else {
        this.showAlert(
          data.message || "Erreur lors de la mise à jour",
          "danger",
        );
      }
    } catch (error) {
      this.showAlert("Erreur de connexion au serveur", "danger");
    }
  }

  // ─────────────────────────────────────────
  // UTILITAIRES
  // ─────────────────────────────────────────

  logout() {
    localStorage.removeItem("patient_token");
    localStorage.removeItem("patient_data");
    this.currentPatient = null;
    this.token = null;
    window.location.reload();
  }

  showAlert(message, type = "info") {
    const alertDiv = document.createElement("div");
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3`;
    alertDiv.style.zIndex = "9999";
    alertDiv.style.minWidth = "300px";
    alertDiv.style.maxWidth = "500px";
    alertDiv.innerHTML = `${message}<button type="button" class="btn-close" data-bs-dismiss="alert"></button>`;
    document.body.appendChild(alertDiv);
    setTimeout(() => alertDiv.remove(), 5000);
  }
}

let patientSpace;
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    patientSpace = new PatientSpace();
  });
} else {
  patientSpace = new PatientSpace();
}
