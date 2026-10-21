/**
 * ================================================
 * CHU YAOUNDÉ - ADMIN PANEL JAVASCRIPT
 * ================================================
 * SPA complète connectée à l'API REST backend
 * Auth JWT, Dashboard live, CRUD complet
 */

"use strict";

// ================================================
// CONFIGURATION
// ================================================

const CONFIG = {
  API_BASE:
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
      ? "http://localhost:5000/api"
      : "https://chu-yaounde-backend.onrender.com/api",
  TOKEN_KEY: "chu_admin_token",
  USER_KEY: "chu_admin_user",
};
// ================================================
// REFRESH CACHE CHATBOT
// Appelé automatiquement après toute modification
// de données que le chatbot utilise
// ================================================
async function refreshChatbotCache() {
  try {
    await fetch(CONFIG.API_BASE + "/chatbot/refresh-cache", { method: "POST" });
  } catch (e) {
    // Silencieux — ne bloque jamais l'admin
  }
}

// ================================================
// API CLIENT
// ================================================

const api = {
  getToken() {
    return localStorage.getItem(CONFIG.TOKEN_KEY);
  },
  setToken(t) {
    localStorage.setItem(CONFIG.TOKEN_KEY, t);
  },
  clearToken() {
    localStorage.removeItem(CONFIG.TOKEN_KEY);
    localStorage.removeItem(CONFIG.USER_KEY);
  },
  getUser() {
    try {
      return JSON.parse(localStorage.getItem(CONFIG.USER_KEY));
    } catch {
      return null;
    }
  },
  setUser(u) {
    localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(u));
  },

  async request(method, endpoint, body = null, opts = {}) {
    const url = `${CONFIG.API_BASE}${endpoint}`;
    const headers = { "Content-Type": "application/json" };
    const token = this.getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const fetchOpts = { method, headers };
    if (body) fetchOpts.body = JSON.stringify(body);

    try {
      const res = await fetch(url, fetchOpts);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || `Erreur ${res.status}`);
      return data;
    } catch (err) {
      if (err.message.includes("401") || err.message.includes("Non autorisé")) {
        api.clearToken();
        showLogin();
      }
      throw err;
    }
  },

  get: (ep) => api.request("GET", ep),
  post: (ep, b) => api.request("POST", ep, b),
  put: (ep, b) => api.request("PUT", ep, b),
  patch: (ep, b) => api.request("PATCH", ep, b),
  delete: (ep) => api.request("DELETE", ep),
};

// ================================================
// APP STATE
// ================================================

const state = {
  currentSection: "dashboard",
  appointments: { data: [], page: 1, pages: 1, filters: {} },
  contacts: { data: [], page: 1, pages: 1, filters: {} },
  users: { data: [], page: 1, pages: 1, filters: {} },
  news: { data: [], page: 1, pages: 1, filters: {} },
  services: [],
  currentAppointmentId: null,
  currentContactId: null,
  deleteCallback: null,
};

// ================================================
// TOAST NOTIFICATIONS
// ================================================

function toast(msg, type = "info") {
  const icons = {
    success: "fa-check-circle",
    error: "fa-times-circle",
    warning: "fa-exclamation-triangle",
    info: "fa-info-circle",
  };
  const el = document.createElement("div");
  el.className = `toast toast-${type}`;
  el.innerHTML = `<i class="fas ${icons[type]}"></i><span>${msg}</span>`;
  document.getElementById("toast-container").appendChild(el);
  setTimeout(() => {
    el.style.opacity = "0";
    el.style.transform = "translateX(24px)";
    el.style.transition = ".3s";
    setTimeout(() => el.remove(), 350);
  }, 3500);
}

// ================================================
// MODAL MANAGEMENT
// ================================================

function openModal(id) {
  document.getElementById(id).classList.remove("hidden");
}
function closeModal(id) {
  document.getElementById(id).classList.add("hidden");
}

document.addEventListener("click", (e) => {
  const closeBtn = e.target.closest(".modal-close");
  if (closeBtn) {
    const modal = closeBtn.dataset.modal;
    if (modal) closeModal(modal);
  }
  if (e.target.classList.contains("modal-overlay")) {
    e.target.classList.add("hidden");
  }
});

// ================================================
// AUTH / LOGIN
// ================================================

function showLogin() {
  document.getElementById("login-screen").classList.remove("hidden");
  document.getElementById("admin-shell").classList.add("hidden");
}

function showAdmin() {
  document.getElementById("login-screen").classList.add("hidden");
  document.getElementById("admin-shell").classList.remove("hidden");
  initApp();
}

document.getElementById("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("login-email").value.trim();
  const pw = document.getElementById("login-password").value;
  const errEl = document.getElementById("login-error");
  const btnText = document.querySelector(".btn-login .btn-text");
  const btnSpinner = document.querySelector(".btn-login .btn-spinner");

  errEl.classList.add("hidden");
  btnText.textContent = "Connexion...";
  btnSpinner.classList.remove("hidden");

  try {
    const res = await api.post("/auth/login", { email, password: pw });
    if (res.token) {
      api.setToken(res.token);
      api.setUser(res.data || res.user || {});
      showAdmin();
    } else {
      throw new Error("Réponse invalide du serveur");
    }
  } catch (err) {
    errEl.textContent = err.message;
    errEl.classList.remove("hidden");
  } finally {
    btnText.textContent = "Se connecter";
    btnSpinner.classList.add("hidden");
  }
});

document.getElementById("toggle-pw").addEventListener("click", () => {
  const inp = document.getElementById("login-password");
  const icon = document.querySelector("#toggle-pw i");
  if (inp.type === "password") {
    inp.type = "text";
    icon.className = "fas fa-eye-slash";
  } else {
    inp.type = "password";
    icon.className = "fas fa-eye";
  }
});

document.getElementById("btn-logout").addEventListener("click", () => {
  api.clearToken();
  showLogin();
  toast("Déconnexion réussie", "info");
});

// ================================================
// NAVIGATION
// ================================================

const sectionTitles = {
  dashboard: "Vue d'ensemble",
  appointments: "Rendez-vous",
  services: "Services médicaux",
  news: "Actualités",
  internships: "Gestion des Stages",
  trainings: "Gestion des Formations",
  contests: "Gestion des Concours",
  contacts: "Messages de contact",
  users: "Utilisateurs",
  documents: "Gestion des Documents",
  personnel: "Notre Personnel",
};

function navigateTo(section) {
  document
    .querySelectorAll(".section")
    .forEach((s) => s.classList.add("hidden"));
  document
    .querySelectorAll(".nav-item")
    .forEach((n) => n.classList.remove("active"));

  const el = document.getElementById(`section-${section}`);
  if (el) el.classList.remove("hidden");
  document
    .querySelectorAll(`[data-section="${section}"]`)
    .forEach((n) => n.classList.add("active"));

  document.getElementById("topbar-title").textContent =
    sectionTitles[section] || section;
  state.currentSection = section;

  if (section === "dashboard") loadDashboard();
  if (section === "appointments") loadAppointments();
  if (section === "services") loadServices();
  if (section === "news") loadNews();
  if (section === "newsletter") loadNewsletter();
  if (section === "contacts") loadContacts();
  if (section === "users") loadUsers();
  if (section === "internships") loadInternships();
  if (section === "trainings") loadTrainings();
  if (section === "contests") loadContests();
  if (section === "documents") loadDocuments();
  if (section === "personnel") loadPersonnel();
}

document.querySelectorAll("[data-section]").forEach((el) => {
  el.addEventListener("click", (e) => {
    e.preventDefault();
    navigateTo(el.dataset.section);
    if (window.innerWidth <= 768)
      document.getElementById("sidebar").classList.remove("open");
  });
});

document.getElementById("sidebar-toggle").addEventListener("click", () => {
  document.getElementById("sidebar").classList.toggle("open");
});

document.getElementById("refresh-btn").addEventListener("click", () => {
  navigateTo(state.currentSection);
  toast("Données actualisées", "info");
});

// ================================================
// CLOCK
// ================================================

function updateClock() {
  const now = new Date();
  document.getElementById("topbar-time").textContent = now.toLocaleTimeString(
    "fr-FR",
    { hour: "2-digit", minute: "2-digit", second: "2-digit" },
  );
}
setInterval(updateClock, 1000);
updateClock();

// ================================================
// DASHBOARD
// ================================================

async function loadDashboard() {
  const now = new Date();
  document.getElementById("dashboard-date").textContent =
    now.toLocaleDateString("fr-FR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  try {
    const res = await api.get("/admin/dashboard");
    // Dashboard returns {data: {stats: {...}, recent: {...}}}
    const s = res.data?.stats || res.data || {};
    const recent = res.data?.recent || {};

    document.getElementById("stat-appt-today").textContent =
      s.appointments?.today ?? "0";
    document.getElementById("stat-appt-pending").textContent =
      s.appointments?.pending ?? "0";
    // Contact status "new" = non lu (pas "unread")
    document.getElementById("stat-contacts-unread").textContent =
      s.contacts?.unread ?? s.contacts?.new ?? "0";
    document.getElementById("stat-news-published").textContent =
      s.news?.published ?? "0";
    document.getElementById("stat-users-total").textContent =
      (s.users?.staff ?? 0) + (s.users?.admins ?? 0);
    document.getElementById("stat-services-total").textContent =
      s.services?.active ?? s.services?.total ?? "0";

    // Update badges
    const pendingAppt = s.appointments?.pending ?? 0;
    const badge = document.getElementById("badge-appointments");
    if (pendingAppt > 0) {
      badge.textContent = pendingAppt;
      badge.classList.remove("hidden");
    } else {
      badge.classList.add("hidden");
    }

    const unreadContacts = s.contacts?.unread ?? s.contacts?.new ?? 0;
    const contactBadge = document.getElementById("badge-contacts");
    if (unreadContacts > 0) {
      contactBadge.textContent = unreadContacts;
      contactBadge.classList.remove("hidden");
    } else {
      contactBadge.classList.add("hidden");
    }

    // Recent appointments - dashboard nests them under recent.appointments
    const recentAppts = recent.appointments || res.data.recentAppointments;
    if (recentAppts && recentAppts.length) renderDashAppointments(recentAppts);
    else loadDashAppointments();

    // Recent contacts
    const recentCts = recent.contacts || res.data.recentContacts;
    if (recentCts && recentCts.length) renderDashContacts(recentCts);
    else loadDashContacts();
  } catch (err) {
    toast("Erreur chargement dashboard: " + err.message, "error");
    loadDashAppointments();
    loadDashContacts();
  }
}

async function loadDashAppointments() {
  try {
    const res = await api.get("/appointments?limit=5&sort=-createdAt");
    renderDashAppointments(res.data);
  } catch {
    document.getElementById("dashboard-appointments").innerHTML =
      '<div class="empty-state"><i class="fas fa-calendar"></i><p>Aucun rendez-vous</p></div>';
  }
}

function renderDashAppointments(data) {
  const el = document.getElementById("dashboard-appointments");
  if (!data || !data.length) {
    el.innerHTML =
      '<div class="empty-state"><i class="fas fa-calendar"></i><p>Aucun rendez-vous récent</p></div>';
    return;
  }
  el.innerHTML = data
    .slice(0, 5)
    .map(
      (a) => `
    <div class="dash-item" onclick="viewAppointment('${a._id}')">
      <div class="dash-item-icon" style="background:${statusColor(a.status, "bg")};color:${statusColor(a.status, "text")}">
        <i class="fas fa-calendar-check"></i>
      </div>
      <div class="dash-item-info">
        <div class="dash-item-name">${a.patient?.firstName} ${a.patient?.lastName}</div>
        <div class="dash-item-sub">${serviceLabel(a.service)} — ${a.appointmentTime}</div>
      </div>
      <div class="dash-item-badge">${statusPill(a.status)}</div>
    </div>`,
    )
    .join("");
}

async function loadDashContacts() {
  try {
    const res = await api.get("/contacts?limit=5&sort=-createdAt");
    renderDashContacts(res.data);
  } catch {
    document.getElementById("dashboard-contacts").innerHTML =
      '<div class="empty-state"><i class="fas fa-envelope"></i><p>Aucun message</p></div>';
  }
}

function renderDashContacts(data) {
  const el = document.getElementById("dashboard-contacts");
  if (!data || !data.length) {
    el.innerHTML =
      '<div class="empty-state"><i class="fas fa-envelope"></i><p>Aucun message récent</p></div>';
    return;
  }
  el.innerHTML = data
    .slice(0, 5)
    .map(
      (c) => `
    <div class="dash-item" onclick="viewContact('${c._id}')">
      <div class="dash-item-icon" style="background:${priorityColor(c.priority, "bg")};color:${priorityColor(c.priority, "text")}">
        <i class="fas fa-envelope"></i>
      </div>
      <div class="dash-item-info">
        <div class="dash-item-name">${c.firstName} ${c.lastName}</div>
        <div class="dash-item-sub">${subjectLabel(c.subject)}</div>
      </div>
      <div class="dash-item-badge">${priorityPill(c.priority)}</div>
    </div>`,
    )
    .join("");
}

// ================================================
// APPOINTMENTS
// ================================================

async function loadAppointments() {
  const tbody = document.getElementById("appointments-tbody");
  tbody.innerHTML =
    '<tr><td colspan="6" class="loading-row"><i class="fas fa-circle-notch fa-spin"></i> Chargement...</td></tr>';
  try {
    const f = state.appointments.filters;
    let qs = `?page=${state.appointments.page}&limit=15`;
    if (f.status) qs += `&status=${f.status}`;
    if (f.service) qs += `&service=${f.service}`;
    if (f.date) qs += `&date=${f.date}`;
    if (f.search) qs += `&search=${encodeURIComponent(f.search)}`;

    const res = await api.get(`/appointments${qs}`);
    state.appointments.data = res.data;
    state.appointments.pages = res.pages || 1;
    renderAppointments(res.data);
    renderPagination(
      "appointments-pagination",
      state.appointments.page,
      state.appointments.pages,
      (p) => {
        state.appointments.page = p;
        loadAppointments();
      },
    );
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" class="loading-row" style="color:var(--danger)"><i class="fas fa-exclamation-circle"></i> ${err.message}</td></tr>`;
  }
}

function renderAppointments(data) {
  const tbody = document.getElementById("appointments-tbody");
  if (!data.length) {
    tbody.innerHTML =
      '<tr><td colspan="6" class="loading-row">Aucun rendez-vous trouvé</td></tr>';
    return;
  }
  tbody.innerHTML = data
    .map(
      (a) => `
    <tr>
      <td>
        <div style="font-weight:600">${a.patient?.firstName} ${a.patient?.lastName}</div>
        <div style="font-size:11px;color:var(--text-3)">${a.patient?.phone || ""}</div>
      </td>
      <td>${serviceLabel(a.service)}</td>
      <td>${a.doctor?.name || "—"}</td>
      <td>
        <div style="font-weight:600">${formatDate(a.appointmentDate)}</div>
        <div style="font-size:12px;color:var(--text-3)">${a.appointmentTime}</div>
      </td>
      <td>${statusPill(a.status)}</td>
      <td>
        <div style="display:flex;gap:4px">
          <button class="btn-icon btn-icon-primary" title="Voir" onclick="viewAppointment('${a._id}')"><i class="fas fa-eye"></i></button>
          ${a.status === "pending" ? `<button class="btn-icon btn-icon-success" title="Confirmer" onclick="confirmAppointment('${a._id}')"><i class="fas fa-check"></i></button>` : ""}
          ${["pending", "confirmed"].includes(a.status) ? `<button class="btn-icon btn-icon-danger" title="Annuler" onclick="cancelAppointmentFlow('${a._id}')"><i class="fas fa-times"></i></button>` : ""}
        </div>
      </td>
    </tr>`,
    )
    .join("");
}

document.getElementById("filter-appt-btn").addEventListener("click", () => {
  state.appointments.filters = {
    status: document.getElementById("filter-appt-status").value,
    service: document.getElementById("filter-appt-service").value,
    date: document.getElementById("filter-appt-date").value,
  };
  state.appointments.page = 1;
  loadAppointments();
});

document.getElementById("search-appointments").addEventListener(
  "input",
  debounce((e) => {
    state.appointments.filters.search = e.target.value;
    state.appointments.page = 1;
    loadAppointments();
  }, 400),
);

async function viewAppointment(id) {
  state.currentAppointmentId = id;
  try {
    const res = await api.get(`/appointments/${id}`);
    const a = res.data;
    const body = document.getElementById("modal-appt-body");
    body.innerHTML = `
      <div class="appt-detail">
        <div class="appt-section">
          <div class="appt-section-title">Patient</div>
          <div class="appt-row"><span class="appt-row-label">Nom</span><span class="appt-row-value">${a.patient?.firstName} ${a.patient?.lastName}</span></div>
          <div class="appt-row"><span class="appt-row-label">Email</span><span class="appt-row-value">${a.patient?.email || "—"}</span></div>
          <div class="appt-row"><span class="appt-row-label">Téléphone</span><span class="appt-row-value">${a.patient?.phone || "—"}</span></div>
          <div class="appt-row"><span class="appt-row-label">Date de naissance</span><span class="appt-row-value">${a.patient?.birthDate ? formatDate(a.patient.birthDate) : "—"}</span></div>
        </div>
        <div class="appt-section">
          <div class="appt-section-title">Rendez-vous</div>
          <div class="appt-row"><span class="appt-row-label">Service</span><span class="appt-row-value">${serviceLabel(a.service)}</span></div>
          <div class="appt-row"><span class="appt-row-label">Médecin</span><span class="appt-row-value">${a.doctor?.name || "—"} ${a.doctor?.specialty ? "(" + a.doctor.specialty + ")" : ""}</span></div>
          <div class="appt-row"><span class="appt-row-label">Date</span><span class="appt-row-value">${formatDate(a.appointmentDate)}</span></div>
          <div class="appt-row"><span class="appt-row-label">Heure</span><span class="appt-row-value">${a.appointmentTime}</span></div>
          <div class="appt-row"><span class="appt-row-label">Durée</span><span class="appt-row-value">${a.duration || 30} min</span></div>
          <div class="appt-row"><span class="appt-row-label">Statut</span><span class="appt-row-value">${statusPill(a.status)}</span></div>
        </div>
        ${a.reason ? `<div class="appt-section"><div class="appt-section-title">Motif</div><p style="font-size:13px;color:var(--text)">${a.reason}</p></div>` : ""}
        ${a.notes ? `<div class="appt-section"><div class="appt-section-title">Notes</div><p style="font-size:13px;color:var(--text)">${a.notes}</p></div>` : ""}
        ${a.cancellationReason ? `<div class="appt-section"><div class="appt-section-title">Motif d'annulation</div><p style="font-size:13px;color:var(--danger)">${a.cancellationReason}</p></div>` : ""}
      </div>`;

    const confirmBtn = document.getElementById("modal-appt-confirm");
    const cancelBtn = document.getElementById("modal-appt-cancel");
    confirmBtn.classList.toggle("hidden", a.status !== "pending");
    cancelBtn.classList.toggle(
      "hidden",
      !["pending", "confirmed"].includes(a.status),
    );

    openModal("modal-appointment");
  } catch (err) {
    toast("Erreur: " + err.message, "error");
  }
}

document
  .getElementById("modal-appt-confirm")
  ?.addEventListener("click", async () => {
    await confirmAppointment(state.currentAppointmentId);
    closeModal("modal-appointment");
  });

document.getElementById("modal-appt-cancel").addEventListener("click", () => {
  closeModal("modal-appointment");
  cancelAppointmentFlow(state.currentAppointmentId);
});

async function confirmAppointment(id) {
  try {
    await api.patch(`/appointments/${id}/confirm`, { status: "confirmed" });
    toast("Rendez-vous confirmé", "success");
    loadAppointments();
  } catch (err) {
    toast("Erreur: " + err.message, "error");
  }
}

function cancelAppointmentFlow(id) {
  state.currentAppointmentId = id;
  document.getElementById("cancel-reason").value = "";
  openModal("modal-cancel-appt");
}

document
  .getElementById("btn-confirm-cancel-appt")
  ?.addEventListener("click", async () => {
    const reason = document.getElementById("cancel-reason").value.trim();
    if (!reason) {
      toast("Le motif est requis", "warning");
      return;
    }
    try {
      await api.patch(`/appointments/${state.currentAppointmentId}/cancel`, {
        reason,
        cancelledBy: "hospital",
      });
      toast("Rendez-vous annulé", "success");
      closeModal("modal-cancel-appt");
      loadAppointments();
    } catch (err) {
      toast("Erreur: " + err.message, "error");
    }
  });

// ================================================
// SERVICES
// ================================================

async function loadServices() {
  const grid = document.getElementById("services-grid");
  grid.innerHTML =
    '<div class="loading-state"><i class="fas fa-circle-notch fa-spin"></i></div>';
  try {
    const res = await api.get("/services");
    state.services = res.data;
    renderServices(res.data);
  } catch (err) {
    grid.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation"></i><p>${err.message}</p></div>`;
  }
}

function renderServices(data) {
  const grid = document.getElementById("services-grid");
  if (!data.length) {
    grid.innerHTML =
      '<div class="empty-state"><i class="fas fa-clinic-medical"></i><p>Aucun service. Cliquez "Nouveau service" ou exécutez le script seed.</p></div>';
    return;
  }
  const catLabels = {
    medical: "Médical",
    surgical: "Chirurgical",
    technical: "Technique",
    specialized: "Spécialisé",
  };
  grid.innerHTML = data
    .map((s) => {
      const staffCount = (s.staff || []).length;
      const featHtml = (s.features || []).length
        ? '<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:10px">' +
          (s.features || [])
            .slice(0, 4)
            .map(
              (f) =>
                '<span style="background:var(--bg);border:1px solid var(--border);border-radius:4px;padding:2px 7px;font-size:11px;color:var(--text-2)">' +
                f +
                "</span>",
            )
            .join("") +
          (s.features.length > 4
            ? '<span style="font-size:11px;color:var(--text-3)">+' +
              (s.features.length - 4) +
              "</span>"
            : "") +
          "</div>"
        : "";
      const staffRows = (s.staff || [])
        .map((p) => {
          const sid = p.id || p._id || p.name;
          return (
            '<div class="staff-tag"><i class="fas fa-user-md"></i><span>' +
            p.name +
            (p.specialty ? " · " + p.specialty : "") +
            "</span><button onclick=\"removeStaff('" +
            s._id +
            "','" +
            sid +
            '\')" title="Retirer"><i class="fas fa-times"></i></button></div>'
          );
        })
        .join("");
      const staffHtml = staffCount
        ? '<div class="service-staff-list">' + staffRows + "</div>"
        : '<div style="font-size:11px;color:var(--text-3);font-style:italic;margin-bottom:6px">Aucun médecin assigné</div>';
      const catBadge = s.category
        ? ' <span class="pill pill-gray" style="font-size:10px;padding:1px 7px;vertical-align:middle">' +
          (catLabels[s.category] || s.category) +
          "</span>"
        : "";
      const desc = s.description
        ? '<div style="font-size:12px;color:var(--text-2);margin-bottom:10px;line-height:1.4">' +
          (s.description.length > 90
            ? s.description.slice(0, 90) + "…"
            : s.description) +
          "</div>"
        : "";
      return (
        '<div class="service-card">' +
        '<div class="service-card-header">' +
        '<div class="service-card-icon"><i class="' +
        (s.icon || "fas fa-hospital") +
        '"></i></div>' +
        '<div class="service-card-actions">' +
        '<button class="btn-icon btn-icon-primary" title="Modifier" onclick="editService(\'' +
        s._id +
        '\')"><i class="fas fa-edit"></i></button>' +
        '<button class="btn-icon btn-icon-danger" title="Supprimer" onclick="deleteService(\'' +
        s._id +
        "','" +
        s.name.replace(/'/g, "\\'") +
        '\')" ><i class="fas fa-trash"></i></button>' +
        "</div>" +
        "</div>" +
        '<div class="service-card-name">' +
        s.name +
        "</div>" +
        '<div class="service-card-dept">' +
        (s.department || "") +
        catBadge +
        "</div>" +
        desc +
        featHtml +
        '<div class="service-card-meta">' +
        (s.hours
          ? '<div class="service-meta-row"><i class="fas fa-clock"></i>' +
            s.hours +
            "</div>"
          : "") +
        (s.phone
          ? '<div class="service-meta-row"><i class="fas fa-phone"></i>' +
            s.phone +
            "</div>"
          : "") +
        (s.location
          ? '<div class="service-meta-row"><i class="fas fa-map-marker-alt"></i>' +
            s.location +
            "</div>"
          : "") +
        "</div>" +
        '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px">' +
        '<span class="pill ' +
        (s.available ? "pill-green" : "pill-gray") +
        '">' +
        (s.available ? "Disponible" : "Indisponible") +
        "</span>" +
        (s.featured
          ? '<span class="pill pill-blue"><i class="fas fa-star"></i> En avant</span>'
          : "") +
        "</div>" +
        '<div class="service-card-staff">' +
        '<div class="service-staff-label"><i class="fas fa-user-md" style="margin-right:5px"></i>Médecins RDV (' +
        staffCount +
        ")</div>" +
        staffHtml +
        '<button class="btn-sm btn-outline" style="margin-top:8px;font-size:11px;width:100%" onclick="editService(\'' +
        s._id +
        "')\">" +
        '<i class="fas fa-user-plus"></i> Gérer le personnel' +
        "</button>" +
        "</div>" +
        "</div>"
      );
    })
    .join("");
}

document
  .getElementById("btn-add-service")
  ?.addEventListener("click", () => openServiceModal());

async function uploadServiceImage(input) {
  const file = input.files[0];
  if (!file) return;

  const preview = document.getElementById("upload-image-preview");
  const previewImg = document.getElementById("upload-preview-img");
  const status = document.getElementById("upload-status");
  const imageInput = document.getElementById("service-image-input");

  // Aperçu local immédiat
  const reader = new FileReader();
  reader.onload = (e) => {
    previewImg.src = e.target.result;
    preview.style.display = "flex";
    preview.style.alignItems = "center";
  };
  reader.readAsDataURL(file);

  // Upload vers le backend
  status.textContent = "Upload en cours...";
  status.style.color = "var(--text-3)";

  try {
    const token = api.getToken();
    const formData = new FormData();
    formData.append("image", file);

    const res = await fetch(`${CONFIG.API_BASE}/services/upload-image`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Erreur upload");

    // Remplir l'URL automatiquement
    imageInput.value = data.data.url;
    status.textContent = "✓ Image uploadée";
    status.style.color = "var(--green)";
    toast("Image uploadée avec succès", "success");
  } catch (err) {
    status.textContent = "✗ " + err.message;
    status.style.color = "var(--red)";
    toast("Erreur upload : " + err.message, "error");
  }
}

function openServiceModal(service = null) {
  // Réinitialiser le preview d'image
  const preview = document.getElementById("upload-image-preview");
  const status = document.getElementById("upload-status");
  const fileInput = document.getElementById("service-image-file");
  if (preview) preview.style.display = "none";
  if (status) status.textContent = "";
  if (fileInput) fileInput.value = "";

  document.getElementById("modal-service-title").textContent = service
    ? "Modifier le service"
    : "Nouveau service";
  document.getElementById("service-id").value = service?._id || "";
  document.getElementById("service-name-input").value = service?.name || "";
  document.getElementById("service-category-input").value =
    service?.category || "medical";
  document.getElementById("service-slug-input").value = service?.slug || "";
  document.getElementById("service-dept-input").value =
    service?.department || "";
  document.getElementById("service-desc-input").value =
    service?.description || "";
  document.getElementById("service-longdesc-input").value =
    service?.longDescription || "";
  document.getElementById("service-features-input").value = (
    service?.features || []
  ).join(", ");
  document.getElementById("service-hours-input").value = service?.hours || "";
  document.getElementById("service-phone-input").value = service?.phone || "";
  document.getElementById("service-location-input").value =
    service?.location || "";
  document.getElementById("service-icon-input").value =
    service?.icon || "fas fa-hospital";
  document.getElementById("service-image-input").value = service?.image || "";
  document.getElementById("service-available-input").checked = service
    ? service.available
    : true;
  document.getElementById("service-featured-input").checked =
    service?.featured || false;

  renderPersonnelList(service?.staff || []);
  openModal("modal-service");
}

let personnelItems = [];

function renderPersonnelList(staff) {
  personnelItems = [
    ...staff.map((p) => ({
      id: p.id || p._id || Date.now(),
      name: p.name,
      specialty: p.specialty || "",
    })),
  ];
  renderPersonnel();
}

function renderPersonnel() {
  const list = document.getElementById("personnel-list");
  if (!personnelItems.length) {
    list.innerHTML =
      '<p style="font-size:12px;color:var(--text-3);text-align:center;padding:8px">Aucun personnel ajouté</p>';
    return;
  }
  list.innerHTML = personnelItems
    .map(
      (p, i) => `
    <div class="personnel-item">
      <div style="width:32px;height:32px;border-radius:50%;background:var(--accent-light);display:flex;align-items:center;justify-content:center;color:var(--accent);font-size:13px;flex-shrink:0">
        <i class="fas fa-user-md"></i>
      </div>
      <div class="personnel-item-info">
        <input type="text" value="${p.name}" placeholder="Nom et prénom" style="font-size:13px;font-weight:600;border:none;outline:none;background:transparent;width:100%;color:var(--text)"
          onchange="personnelItems[${i}].name=this.value" />
        <input type="text" value="${p.specialty}" placeholder="Spécialité..." style="font-size:11px;border:none;outline:none;background:transparent;width:100%;color:var(--text-3)"
          onchange="personnelItems[${i}].specialty=this.value" />
      </div>
      <button class="btn-icon btn-icon-danger" onclick="personnelItems.splice(${i},1);renderPersonnel()"><i class="fas fa-times"></i></button>
    </div>`,
    )
    .join("");
}

document.getElementById("btn-add-personnel").addEventListener("click", () => {
  personnelItems.push({ id: `new_${Date.now()}`, name: "", specialty: "" });
  renderPersonnel();
  const inputs = document.querySelectorAll(
    "#personnel-list .personnel-item input",
  );
  if (inputs.length) inputs[inputs.length - 2].focus();
});

document
  .getElementById("btn-save-service")
  ?.addEventListener("click", async () => {
    const name = document.getElementById("service-name-input").value.trim();
    if (!name) {
      toast("Le nom du service est requis", "warning");
      return;
    }

    const id = document.getElementById("service-id").value;
    const featuresRaw = document.getElementById("service-features-input").value;
    const body = {
      name,
      category: document.getElementById("service-category-input").value,
      slug:
        document
          .getElementById("service-slug-input")
          .value.trim()
          .toLowerCase() || name.toLowerCase().replace(/\s+/g, "-"),
      department: document.getElementById("service-dept-input").value.trim(),
      description: document.getElementById("service-desc-input").value.trim(),
      longDescription: document
        .getElementById("service-longdesc-input")
        .value.trim(),
      features: featuresRaw
        ? featuresRaw
            .split(",")
            .map((f) => f.trim())
            .filter(Boolean)
        : [],
      hours: document.getElementById("service-hours-input").value.trim(),
      phone: document.getElementById("service-phone-input").value.trim(),
      location: document.getElementById("service-location-input").value.trim(),
      icon: document.getElementById("service-icon-input").value.trim(),
      image: document.getElementById("service-image-input").value.trim(),
      available: document.getElementById("service-available-input").checked,
      featured: document.getElementById("service-featured-input").checked,
      staff: personnelItems.filter((p) => p.name.trim()),
    };

    try {
      if (id) {
        await api.put(`/services/${id}`, body);
        toast("Service mis à jour", "success");
      } else {
        await api.post("/services", body);
        toast("Service créé", "success");
      }
      closeModal("modal-service");
      loadServices();
      refreshChatbotCache();
    } catch (err) {
      toast("Erreur: " + err.message, "error");
    }
  });

async function editService(id) {
  try {
    const res = await api.get(`/services/${id}`);
    openServiceModal(res.data);
  } catch (err) {
    toast("Erreur: " + err.message, "error");
  }
}

function deleteService(id, name) {
  state.deleteCallback = async () => {
    try {
      await api.delete(`/services/${id}`);
      toast(`Service "${name}" supprimé`, "success");
      loadServices();
      refreshChatbotCache();
    } catch (err) {
      toast("Erreur: " + err.message, "error");
    }
  };
  document.getElementById("confirm-message").textContent =
    `Supprimer le service "${name}" ? Cette action est irréversible.`;
  openModal("modal-confirm");
}

async function removeStaff(serviceId, staffId) {
  try {
    const res = await api.get(`/services/${serviceId}`);
    const service = res.data;
    const staff = (service.staff || []).filter(
      (p) => (p.id || p._id) != staffId,
    );
    await api.put(`/services/${serviceId}`, { ...service, staff });
    toast("Personnel retiré", "success");
    loadServices();
    refreshChatbotCache();
  } catch (err) {
    toast("Erreur: " + err.message, "error");
  }
}

// ================================================
// NEWS
// ================================================

async function loadNews() {
  const list = document.getElementById("news-list");
  list.innerHTML =
    '<div class="loading-state"><i class="fas fa-circle-notch fa-spin"></i></div>';
  try {
    const f = state.news.filters;
    let qs = `?page=${state.news.page}&limit=20&sort=-createdAt`;
    if (f.status === "published") qs += "&published=true";
    if (f.status === "draft") qs += "&published=false";
    if (f.category) qs += `&category=${f.category}`;

    const res = await api.get(`/news/admin/all${qs}`);
    state.news.data = res.data;
    renderNews(res.data);
  } catch (err) {
    list.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation"></i><p>${err.message}</p></div>`;
  }
}

function renderNews(data) {
  const list = document.getElementById("news-list");
  if (!data.length) {
    list.innerHTML =
      '<div class="empty-state"><i class="fas fa-newspaper"></i><p>Aucune actualité trouvée</p></div>';
    return;
  }
  list.innerHTML = data
    .map(
      (n) => `
    <div class="news-item">
      <div class="news-item-img">
        ${n.image ? `<img src="${n.image}" alt="${n.title}" style="width:100%;height:100%;object-fit:cover;border-radius:var(--radius-sm)" onerror="this.parentElement.innerHTML='<i class=\\'fas fa-newspaper\\'></i>'">` : '<i class="fas fa-newspaper"></i>'}
      </div>
      <div class="news-item-content">
        <div class="news-item-title">${n.title}</div>
        <div class="news-item-meta">
          <span class="pill ${n.published ? "pill-green" : "pill-gray"}">${n.published ? "Publiée" : "Brouillon"}</span>
          <span class="pill pill-blue">${categoryLabel(n.category)}</span>
          ${n.featured ? '<span class="pill pill-orange"><i class="fas fa-star"></i> En avant</span>' : ""}
          <span><i class="fas fa-eye" style="margin-right:3px"></i>${n.views || 0} vues</span>
          <span>${n.publishedAt ? formatDate(n.publishedAt) : formatDate(n.createdAt)}</span>
        </div>
      </div>
      <div class="news-item-actions">
        <button class="btn-icon btn-icon-${n.published ? "warning" : "success"}" title="${n.published ? "Dépublier" : "Publier"}" onclick="togglePublish('${n._id}',${n.published})">
          <i class="fas fa-${n.published ? "eye-slash" : "globe"}"></i>
        </button>
        <button class="btn-icon btn-icon-primary" title="Modifier" onclick="editNews('${n._id}')"><i class="fas fa-edit"></i></button>
        <button class="btn-icon btn-icon-danger" title="Supprimer" onclick="deleteNews('${n._id}','${n.title.replace(/'/g, "&#39;")}')"><i class="fas fa-trash"></i></button>
      </div>
    </div>`,
    )
    .join("");
}

document
  .getElementById("filter-news-status")
  ?.addEventListener("change", (e) => {
    state.news.filters.status = e.target.value;
    loadNews();
    refreshChatbotCache();
  });
document
  .getElementById("filter-news-category")
  ?.addEventListener("change", (e) => {
    state.news.filters.category = e.target.value;
    loadNews();
    refreshChatbotCache();
  });

document
  .getElementById("btn-add-news")
  ?.addEventListener("click", () => openNewsModal());

function toggleEventFields(category) {
  const eventFields = document.getElementById("event-fields");
  const publicationFields = document.getElementById("publication-fields");
  if (eventFields) {
    eventFields.style.display = category === "evenement" ? "block" : "none";
  }
  if (publicationFields) {
    publicationFields.style.display =
      category === "publication" ? "block" : "none";
  }
}

function openNewsModal(news = null) {
  document.getElementById("modal-news-title").textContent = news
    ? "Modifier l'actualité"
    : "Nouvelle actualité";
  document.getElementById("news-id").value = news?._id || "";
  document.getElementById("news-title-input").value = news?.title || "";
  document.getElementById("news-category-input").value =
    news?.category || "actualite";
  document.getElementById("news-excerpt-input").value = news?.excerpt || "";
  document.getElementById("news-content-input").value = news?.content || "";
  document.getElementById("news-image-input").value = news?.image || "";
  document.getElementById("news-author-input").value = news?.authorName || "";
  document.getElementById("news-pdf-input").value = news?.pdf || "";

  // Champs événement
  const cat = news?.category || "actualite";
  toggleEventFields(cat);
  if (news?.eventStartDate) {
    document.getElementById("event-start-input").value = new Date(
      news.eventStartDate,
    )
      .toISOString()
      .slice(0, 16);
  } else {
    document.getElementById("event-start-input").value = "";
  }
  if (news?.eventEndDate) {
    document.getElementById("event-end-input").value = new Date(
      news.eventEndDate,
    )
      .toISOString()
      .slice(0, 16);
  } else {
    document.getElementById("event-end-input").value = "";
  }
  document.getElementById("event-location-input").value =
    news?.eventLocation || "";
  document.getElementById("event-type-input").value =
    news?.eventType || "conference";

  // Champs publication
  document.getElementById("publication-specialty-input").value =
    news?.specialty || "general";
  document.getElementById("publication-type-input").value =
    news?.publicationType || "journal";

  // PDF preview
  const pdfPreview = document.getElementById("news-pdf-preview");
  const pdfFilename = document.getElementById("news-pdf-filename");
  const pdfStatus = document.getElementById("news-pdf-upload-status");
  if (pdfStatus) pdfStatus.textContent = "";
  if (news?.pdf && pdfPreview && pdfFilename) {
    pdfFilename.textContent = news.pdf.split("/").pop();
    pdfPreview.style.display = "block";
  } else if (pdfPreview) {
    pdfPreview.style.display = "none";
  }

  // Gérer le preview d'image
  const previewDiv = document.getElementById("news-image-preview");
  const previewImg = document.getElementById("news-image-preview-img");
  const statusEl = document.getElementById("news-image-upload-status");
  if (statusEl) statusEl.textContent = "";
  if (news?.image && previewDiv && previewImg) {
    const imgUrl = news.image.startsWith("http")
      ? news.image
      : (news.image.startsWith("/") ? "https://chu-yaounde-backend.onrender.com" + news.image : news.image);
    previewImg.src = imgUrl;
    previewDiv.style.display = "block";
  } else if (previewDiv) {
    previewDiv.style.display = "none";
    if (previewImg) previewImg.src = "";
  }
  document.getElementById("news-published-input").checked =
    news?.published || false;
  document.getElementById("news-featured-input").checked =
    news?.featured || false;
  if (news?.publishedAt) {
    const d = new Date(news.publishedAt);
    document.getElementById("news-publishdate-input").value = d
      .toISOString()
      .slice(0, 16);
  } else {
    document.getElementById("news-publishdate-input").value = "";
  }
  openModal("modal-news");
}

async function saveNews(asDraft = false) {
  const title = document.getElementById("news-title-input").value.trim();
  const content = document.getElementById("news-content-input").value.trim();
  if (!title || !content) {
    toast("Titre et contenu requis", "warning");
    return;
  }

  const id = document.getElementById("news-id").value;
  const published = asDraft
    ? false
    : document.getElementById("news-published-input").checked;
  const pubDate = document.getElementById("news-publishdate-input").value;

  const category = document.getElementById("news-category-input").value;
  const body = {
    title,
    category,
    excerpt: document.getElementById("news-excerpt-input").value.trim(),
    content,
    image: document.getElementById("news-image-input").value.trim(),
    authorName: document.getElementById("news-author-input").value.trim(),
    pdf: document.getElementById("news-pdf-input").value.trim(),
    eventStartDate:
      category === "evenement"
        ? document.getElementById("event-start-input").value || null
        : null,
    eventEndDate:
      category === "evenement"
        ? document.getElementById("event-end-input").value || null
        : null,
    eventLocation:
      category === "evenement"
        ? document.getElementById("event-location-input").value.trim()
        : null,
    eventType:
      category === "evenement"
        ? document.getElementById("event-type-input").value
        : null,
    specialty:
      category === "publication"
        ? document.getElementById("publication-specialty-input").value
        : null,
    publicationType:
      category === "publication"
        ? document.getElementById("publication-type-input").value
        : null,
    published,
    featured: document.getElementById("news-featured-input").checked,
    publishedAt:
      published && pubDate
        ? new Date(pubDate)
        : published
          ? new Date()
          : undefined,
  };

  try {
    if (id) {
      await api.put(`/news/${id}`, body);
      toast("Actualité mise à jour", "success");
    } else {
      await api.post("/news", body);
      toast("Actualité créée", "success");
    }
    closeModal("modal-news");
    loadNews();
    refreshChatbotCache();
  } catch (err) {
    toast("Erreur: " + err.message, "error");
  }
}

document
  .getElementById("btn-save-news")
  ?.addEventListener("click", () => saveNews(false));
document
  .getElementById("btn-save-draft")
  ?.addEventListener("click", () => saveNews(true));

async function editNews(id) {
  try {
    const res = await api.get(`/news/${id}`);
    openNewsModal(res.data);
  } catch (err) {
    toast("Erreur: " + err.message, "error");
  }
}

async function togglePublish(id, currentPublished) {
  try {
    await api.put(`/news/${id}`, {
      published: !currentPublished,
      publishedAt: !currentPublished ? new Date() : undefined,
    });
    toast(
      currentPublished ? "Actualité dépubliée" : "Actualité publiée",
      "success",
    );
    loadNews();
    refreshChatbotCache();
  } catch (err) {
    toast("Erreur: " + err.message, "error");
  }
}

function deleteNews(id, title) {
  state.deleteCallback = async () => {
    try {
      await api.delete(`/news/${id}`);
      toast(`"${title}" supprimée`, "success");
      loadNews();
      refreshChatbotCache();
    } catch (err) {
      toast("Erreur: " + err.message, "error");
    }
  };
  document.getElementById("confirm-message").textContent =
    `Supprimer l'actualité "${title}" ?`;
  openModal("modal-confirm");
}

// ================================================
// CONTACTS
// ================================================

async function loadContacts() {
  const tbody = document.getElementById("contacts-tbody");
  tbody.innerHTML =
    '<tr><td colspan="6" class="loading-row"><i class="fas fa-circle-notch fa-spin"></i> Chargement...</td></tr>';
  try {
    const f = state.contacts.filters;
    let qs = `?page=${state.contacts.page}&limit=15&sort=-createdAt`;
    if (f.status) qs += `&status=${f.status}`;
    if (f.priority) qs += `&priority=${f.priority}`;

    const res = await api.get(`/contacts${qs}`);
    state.contacts.data = res.data;
    state.contacts.pages = res.pages || 1;
    renderContacts(res.data);
    renderPagination(
      "contacts-pagination",
      state.contacts.page,
      state.contacts.pages,
      (p) => {
        state.contacts.page = p;
        loadContacts();
      },
    );
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" class="loading-row" style="color:var(--danger)">${err.message}</td></tr>`;
  }
}

function renderContacts(data) {
  const tbody = document.getElementById("contacts-tbody");
  if (!data.length) {
    tbody.innerHTML =
      '<tr><td colspan="6" class="loading-row">Aucun message trouvé</td></tr>';
    return;
  }
  tbody.innerHTML = data
    .map(
      (c) => `
    <tr style="${c.status === "new" ? "font-weight:600" : ""}">
      <td>
        <div style="font-weight:600">${c.firstName} ${c.lastName}</div>
        <div style="font-size:11px;color:var(--text-3)">${c.email}</div>
      </td>
      <td>${subjectLabel(c.subject)}</td>
      <td>${priorityPill(c.priority)}</td>
      <td>${contactStatusPill(c.status)}</td>
      <td style="font-size:12px;color:var(--text-3)">${formatDate(c.createdAt)}</td>
      <td>
        <div style="display:flex;gap:4px">
          <button class="btn-icon btn-icon-primary" title="Voir" onclick="viewContact('${c._id}')"><i class="fas fa-eye"></i></button>
          <button class="btn-icon btn-icon-success" title="Répondre" onclick="replyContact('${c._id}','${c.email}','${(c.firstName + " " + c.lastName).replace(/'/g, "&#39;")}')"><i class="fas fa-reply"></i></button>
        </div>
      </td>
    </tr>`,
    )
    .join("");
}

document.getElementById("filter-contacts-btn").addEventListener("click", () => {
  state.contacts.filters = {
    status: document.getElementById("filter-contact-status").value,
    priority: document.getElementById("filter-contact-priority").value,
  };
  state.contacts.page = 1;
  loadContacts();
});

async function viewContact(id) {
  state.currentContactId = id;
  try {
    const res = await api.get(`/contacts/${id}`);
    const c = res.data;

    // Mark as read
    if (c.status === "new") {
      api.patch(`/contacts/${id}`, { status: "read" }).catch(() => {});
    }

    const body = document.getElementById("modal-contact-body");
    body.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
        <div>
          <div style="font-size:16px;font-weight:700">${c.firstName} ${c.lastName}</div>
          <div style="font-size:13px;color:var(--text-3)">${c.email} ${c.phone ? "• " + c.phone : ""}</div>
        </div>
        <div style="display:flex;gap:8px">${priorityPill(c.priority)} ${contactStatusPill(c.status)}</div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px;font-size:13px">
        <div><span style="color:var(--text-3)">Sujet:</span> <strong>${subjectLabel(c.subject)}</strong></div>
        <div><span style="color:var(--text-3)">Date:</span> <strong>${formatDate(c.createdAt)}</strong></div>
      </div>
      <div style="font-size:12px;font-weight:600;color:var(--text-3);text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px">Message</div>
      <div class="contact-msg-box">${c.message}</div>
      ${
        c.responseMessage
          ? `
        <div style="margin-top:16px">
          <div style="font-size:12px;font-weight:600;color:var(--success);text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px">Réponse envoyée (${formatDate(c.respondedAt)})</div>
          <div class="contact-msg-box" style="border-color:var(--success);background:var(--success-light)">${c.responseMessage}</div>
        </div>`
          : ""
      }`;

    document.getElementById("btn-reply-contact").onclick = () => {
      closeModal("modal-contact");
      replyContact(c._id, c.email, `${c.firstName} ${c.lastName}`);
    };

    openModal("modal-contact");
  } catch (err) {
    toast("Erreur: " + err.message, "error");
  }
}

function replyContact(id, email, name) {
  state.currentContactId = id;
  document.getElementById("reply-to").value = `${name} <${email}>`;
  document.getElementById("reply-message").value = "";
  openModal("modal-reply");
}

document
  .getElementById("btn-send-reply")
  ?.addEventListener("click", async () => {
    const msg = document.getElementById("reply-message").value.trim();
    if (!msg) {
      toast("Le message de réponse est requis", "warning");
      return;
    }
    try {
      await api.patch(`/contacts/${state.currentContactId}/reply`, {
        responseMessage: msg,
      });
      toast("Réponse envoyée", "success");
      closeModal("modal-reply");
      loadContacts();
    } catch (err) {
      toast("Erreur: " + err.message, "error");
    }
  });

// ================================================
// USERS
// ================================================

async function loadUsers() {
  const tbody = document.getElementById("users-tbody");
  tbody.innerHTML =
    '<tr><td colspan="6" class="loading-row"><i class="fas fa-circle-notch fa-spin"></i> Chargement...</td></tr>';
  try {
    const f = state.users.filters;
    let qs = `?page=${state.users.page}&limit=15`;
    if (f.role) qs += `&role=${f.role}`;
    if (f.search) qs += `&search=${encodeURIComponent(f.search)}`;

    const res = await api.get(`/users${qs}`);
    state.users.data = res.data;
    state.users.pages = res.pages || 1;
    renderUsers(res.data);
    renderPagination(
      "users-pagination",
      state.users.page,
      state.users.pages,
      (p) => {
        state.users.page = p;
        loadUsers();
      },
    );
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" class="loading-row" style="color:var(--danger)">${err.message}</td></tr>`;
  }
}

function renderUsers(data) {
  const tbody = document.getElementById("users-tbody");
  if (!data.length) {
    tbody.innerHTML =
      '<tr><td colspan="6" class="loading-row">Aucun utilisateur trouvé</td></tr>';
    return;
  }
  tbody.innerHTML = data
    .map(
      (u) => `
    <tr>
      <td>
        <div style="display:flex;align-items:center;gap:10px">
          <div style="width:34px;height:34px;border-radius:50%;background:var(--accent-light);display:flex;align-items:center;justify-content:center;color:var(--accent);font-weight:700;font-size:13px;flex-shrink:0">
            ${(u.firstName?.[0] || "?") + (u.lastName?.[0] || "")}
          </div>
          <span style="font-weight:600">${u.firstName} ${u.lastName}</span>
        </div>
      </td>
      <td style="font-size:13px;color:var(--text-2)">${u.email}</td>
      <td>${rolePill(u.role)}</td>
      <td><span class="pill ${u.isActive !== false ? "pill-green" : "pill-gray"}">${u.isActive !== false ? "Actif" : "Inactif"}</span></td>
      <td style="font-size:12px;color:var(--text-3)">${u.lastLogin ? formatDate(u.lastLogin) : "Jamais"}</td>
      <td>
        <div style="display:flex;gap:4px">
          <button class="btn-icon btn-icon-primary" title="Modifier" onclick="editUser('${u._id}')"><i class="fas fa-edit"></i></button>
          <button class="btn-icon btn-icon-danger" title="Supprimer" onclick="deleteUser('${u._id}','${u.firstName} ${u.lastName}')"><i class="fas fa-trash"></i></button>
        </div>
      </td>
    </tr>`,
    )
    .join("");
}

document
  .getElementById("btn-add-user")
  ?.addEventListener("click", () => openUserModal());

document.getElementById("search-users").addEventListener(
  "input",
  debounce((e) => {
    state.users.filters.search = e.target.value;
    state.users.page = 1;
    loadUsers();
  }, 400),
);

document.getElementById("filter-user-role").addEventListener("change", (e) => {
  state.users.filters.role = e.target.value;
  state.users.page = 1;
  loadUsers();
});

function openUserModal(user = null) {
  document.getElementById("modal-user-title").textContent = user
    ? "Modifier l'utilisateur"
    : "Nouveau membre du personnel";
  document.getElementById("user-id").value = user?._id || "";
  document.getElementById("user-firstname").value = user?.firstName || "";
  document.getElementById("user-lastname").value = user?.lastName || "";
  document.getElementById("user-email").value = user?.email || "";
  document.getElementById("user-role").value = user?.role || "staff";
  document.getElementById("user-phone").value = user?.phone || "";
  document.getElementById("user-active").checked = user
    ? user.isActive !== false
    : true;
  document.getElementById("user-password").value = "";

  const pwField = document.getElementById("user-password-field");
  const pwInput = document.getElementById("user-password");
  if (user) {
    pwField.querySelector("label").textContent =
      "Nouveau mot de passe (laisser vide pour ne pas changer)";
    pwInput.required = false;
  } else {
    pwField.querySelector("label").textContent = "Mot de passe *";
    pwInput.required = true;
  }

  openModal("modal-user");
}

document.getElementById("btn-save-user").addEventListener("click", async () => {
  const id = document.getElementById("user-id").value;
  const firstName = document.getElementById("user-firstname").value.trim();
  const lastName = document.getElementById("user-lastname").value.trim();
  const email = document.getElementById("user-email").value.trim();
  const password = document.getElementById("user-password").value;

  if (!firstName || !lastName || !email) {
    toast("Prénom, nom et email sont requis", "warning");
    return;
  }
  if (!id && !password) {
    toast("Le mot de passe est requis pour un nouvel utilisateur", "warning");
    return;
  }

  const body = {
    firstName,
    lastName,
    email,
    role: document.getElementById("user-role").value,
    phone: document.getElementById("user-phone").value.trim(),
    isActive: document.getElementById("user-active").checked,
  };
  if (password) body.password = password;

  try {
    if (id) {
      await api.put(`/users/${id}`, body);
      toast("Utilisateur mis à jour", "success");
    } else {
      await api.post("/auth/register", body);
      toast("Utilisateur créé", "success");
    }
    closeModal("modal-user");
    loadUsers();
  } catch (err) {
    toast("Erreur: " + err.message, "error");
  }
});

async function editUser(id) {
  try {
    const res = await api.get(`/users/${id}`);
    openUserModal(res.data);
  } catch (err) {
    toast("Erreur: " + err.message, "error");
  }
}

function deleteUser(id, name) {
  state.deleteCallback = async () => {
    try {
      await api.delete(`/users/${id}`);
      toast(`Utilisateur "${name}" supprimé`, "success");
      loadUsers();
    } catch (err) {
      toast("Erreur: " + err.message, "error");
    }
  };
  document.getElementById("confirm-message").textContent =
    `Supprimer l'utilisateur "${name}" ?`;
  openModal("modal-confirm");
}

document
  .getElementById("btn-confirm-delete")
  ?.addEventListener("click", async () => {
    if (state.deleteCallback) {
      await state.deleteCallback();
      state.deleteCallback = null;
    }
    closeModal("modal-confirm");
  });

// ================================================
// PAGINATION
// ================================================

function renderPagination(containerId, currentPage, totalPages, onPageClick) {
  const container = document.getElementById(containerId);
  if (totalPages <= 1) {
    container.innerHTML = "";
    return;
  }

  let html = `<button class="page-btn" ${currentPage === 1 ? "disabled" : ""} onclick="(${onPageClick.toString()})(${currentPage - 1})"><i class="fas fa-chevron-left"></i></button>`;

  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= currentPage - 1 && i <= currentPage + 1)
    ) {
      html += `<button class="page-btn ${i === currentPage ? "active" : ""}" onclick="(${onPageClick.toString()})(${i})">${i}</button>`;
    } else if (i === currentPage - 2 || i === currentPage + 2) {
      html += '<span style="color:var(--text-3);padding:0 4px">…</span>';
    }
  }

  html += `<button class="page-btn" ${currentPage === totalPages ? "disabled" : ""} onclick="(${onPageClick.toString()})(${currentPage + 1})"><i class="fas fa-chevron-right"></i></button>`;
  container.innerHTML = html;
}

// ================================================
// HELPERS / LABELS
// ================================================

function formatDate(date) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function debounce(fn, delay) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), delay);
  };
}

function serviceLabel(s) {
  const labels = {
    cardiology: "Cardiologie",
    pediatrics: "Pédiatrie",
    surgery: "Chirurgie",
    neurology: "Neurologie",
    general: "Médecine Générale",
    dentistry: "Dentisterie",
    ophthalmology: "Ophtalmologie",
    dermatology: "Dermatologie",
  };
  return labels[s] || s || "—";
}

function categoryLabel(c) {
  const labels = {
    actualite: "Actualité",
    evenement: "Événement",
    publication: "Publication Scientifique",
    // rétrocompatibilité anciens articles
    general: "Actualité",
    medical: "Actualité",
    annonce: "Actualité",
    formation: "Publication Scientifique",
  };
  return labels[c] || c || "—";
}

function subjectLabel(s) {
  const labels = {
    appointment: "Rendez-vous",
    information: "Information",
    emergency: "Urgence",
    complaint: "Plainte",
    partnership: "Partenariat",
    other: "Autre",
  };
  return labels[s] || s || "—";
}

function statusPill(status) {
  const map = {
    pending: ["pill-orange", "En attente"],
    confirmed: ["pill-blue", "Confirmé"],
    cancelled: ["pill-red", "Annulé"],
    completed: ["pill-green", "Terminé"],
    no_show: ["pill-gray", "Absent"],
  };
  const [cls, label] = map[status] || ["pill-gray", status || "—"];
  return `<span class="pill ${cls}">${label}</span>`;
}

function contactStatusPill(status) {
  const map = {
    new: ["pill-red", "Nouveau"],
    read: ["pill-blue", "Lu"],
    in_progress: ["pill-orange", "En cours"],
    resolved: ["pill-green", "Résolu"],
    closed: ["pill-gray", "Clôturé"],
  };
  const [cls, label] = map[status] || ["pill-gray", status || "—"];
  return `<span class="pill ${cls}">${label}</span>`;
}

function priorityPill(p) {
  const map = {
    urgent: ["pill-red", "Urgent"],
    high: ["pill-orange", "Haute"],
    medium: ["pill-blue", "Moyenne"],
    low: ["pill-gray", "Basse"],
  };
  const [cls, label] = map[p] || ["pill-gray", p || "—"];
  return `<span class="pill ${cls}">${label}</span>`;
}

function rolePill(role) {
  const map = {
    admin: ["pill-purple", "Administrateur"],
    doctor: ["pill-blue", "Médecin"],
    nurse: ["pill-teal", "Infirmier(e)"],
    staff: ["pill-gray", "Personnel"],
  };
  const [cls, label] = map[role] || ["pill-gray", role || "—"];
  return `<span class="pill ${cls}">${label}</span>`;
}

function statusColor(status, type) {
  const colors = {
    pending: { bg: "var(--warning-light)", text: "var(--warning)" },
    confirmed: { bg: "var(--accent-light)", text: "var(--accent)" },
    cancelled: { bg: "var(--danger-light)", text: "var(--danger)" },
    completed: { bg: "var(--success-light)", text: "var(--success)" },
  };
  return (
    colors[status]?.[type] || (type === "bg" ? "var(--bg)" : "var(--text-3)")
  );
}

function priorityColor(priority, type) {
  const colors = {
    urgent: { bg: "var(--danger-light)", text: "var(--danger)" },
    high: { bg: "var(--warning-light)", text: "var(--warning)" },
    medium: { bg: "var(--accent-light)", text: "var(--accent)" },
    low: { bg: "var(--bg)", text: "var(--text-3)" },
  };
  return (
    colors[priority]?.[type] || (type === "bg" ? "var(--bg)" : "var(--text-3)")
  );
}

// ================================================
// UPLOAD PDF NEWS
// ================================================

async function uploadNewsPdf(input) {
  const file = input.files[0];
  if (!file) return;

  const statusEl = document.getElementById("news-pdf-upload-status");
  const previewDiv = document.getElementById("news-pdf-preview");
  const filenameEl = document.getElementById("news-pdf-filename");

  statusEl.textContent = "Upload en cours...";
  statusEl.style.color = "#888";

  const formData = new FormData();
  formData.append("pdf", file);

  try {
    const token = api.getToken();
    const res = await fetch(`${CONFIG.API_BASE}/news/upload-pdf`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const data = await res.json();

    if (!res.ok || !data.success)
      throw new Error(data.message || "Erreur upload");

    document.getElementById("news-pdf-input").value = data.url;
    filenameEl.textContent = file.name;
    previewDiv.style.display = "block";
    statusEl.textContent = "✓ PDF uploadé";
    statusEl.style.color = "#2e7d32";
    toast("PDF uploadé avec succès", "success");
  } catch (err) {
    statusEl.textContent = "✗ Erreur: " + err.message;
    statusEl.style.color = "#e53e3e";
    toast("Erreur upload PDF: " + err.message, "error");
  }

  input.value = "";
}

function clearNewsPdf() {
  document.getElementById("news-pdf-input").value = "";
  document.getElementById("news-pdf-preview").style.display = "none";
  document.getElementById("news-pdf-filename").textContent = "";
  document.getElementById("news-pdf-upload-status").textContent = "";
}

// ================================================
// NEWSLETTER
// ================================================

const newsletterState = { page: 1, pages: 1, search: "" };

async function loadNewsletter() {
  const tbody = document.getElementById("newsletter-tbody");
  if (!tbody) return;
  tbody.innerHTML =
    '<tr><td colspan="6" class="loading-row"><i class="fas fa-circle-notch fa-spin"></i> Chargement...</td></tr>';

  try {
    const statusFilter = document.getElementById("newsletter-status-filter");
    const status = statusFilter ? statusFilter.value : "";
    let qs = `?page=${newsletterState.page}&limit=20`;
    if (status) qs += `&status=${status}`;
    if (newsletterState.search)
      qs += `&search=${encodeURIComponent(newsletterState.search)}`;

    const res = await api.get(`/newsletter${qs}`);

    // Stats
    document.getElementById("nl-stat-active").textContent =
      res.totalActive ?? "—";
    document.getElementById("nl-stat-inactive").textContent =
      res.totalInactive ?? "—";
    document.getElementById("nl-stat-total").textContent = res.total ?? "—";

    const rows = res.data || [];
    if (rows.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="6" class="text-center text-muted py-4">Aucun abonné trouvé</td></tr>';
      return;
    }

    tbody.innerHTML = rows
      .map((s) => {
        const date = new Date(s.createdAt).toLocaleDateString("fr-FR");
        return `<tr>
          <td><strong>${s.email}</strong></td>
          <td>${s.nom || "—"}</td>
          <td>
            <span class="pill ${s.isActive ? "pill-green" : "pill-gray"}">
              ${s.isActive ? "Actif" : "Désabonné"}
            </span>
          </td>
          <td>${date}</td>
          <td>${s.source || "website"}</td>
          <td>
            <button class="btn-icon ${s.isActive ? "btn-icon-warning" : "btn-icon-primary"}"
                    title="${s.isActive ? "Désactiver" : "Réactiver"}"
                    onclick="toggleNewsletter('${s._id}')">
              <i class="fas ${s.isActive ? "fa-pause" : "fa-play"}"></i>
            </button>
            <button class="btn-icon btn-icon-danger" title="Supprimer"
                    onclick="deleteNewsletterSubscriber('${s._id}','${s.email}')">
              <i class="fas fa-trash"></i>
            </button>
          </td>
        </tr>`;
      })
      .join("");

    newsletterState.pages = res.pages || 1;
    renderNewsletterPagination();
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center text-danger py-3">Erreur: ${err.message}</td></tr>`;
    toast("Erreur chargement newsletter: " + err.message, "error");
  }
}

function renderNewsletterPagination() {
  const container = document.getElementById("newsletter-pagination");
  if (!container) return;
  if (newsletterState.pages <= 1) {
    container.innerHTML = "";
    return;
  }

  const prev =
    newsletterState.page > 1
      ? `<button class="page-btn" onclick="newsletterState.page--;loadNewsletter()">‹ Préc</button>`
      : "";
  const next =
    newsletterState.page < newsletterState.pages
      ? `<button class="page-btn" onclick="newsletterState.page++;loadNewsletter()">Suiv ›</button>`
      : "";
  container.innerHTML = `${prev}<span class="page-info">Page ${newsletterState.page}/${newsletterState.pages}</span>${next}`;
}

function filterNewsletterSearch(q) {
  newsletterState.search = q;
  newsletterState.page = 1;
  clearTimeout(window._nlSearchTimer);
  window._nlSearchTimer = setTimeout(() => loadNewsletter(), 400);
}

async function toggleNewsletter(id) {
  try {
    await api.patch(`/newsletter/${id}/toggle`, {});
    toast("Statut abonné mis à jour", "success");
    loadNewsletter();
  } catch (err) {
    toast("Erreur: " + err.message, "error");
  }
}

function deleteNewsletterSubscriber(id, email) {
  state.deleteCallback = async () => {
    try {
      await api.delete(`/newsletter/${id}`);
      toast(`Abonné "${email}" supprimé`, "success");
      loadNewsletter();
    } catch (err) {
      toast("Erreur: " + err.message, "error");
    }
  };
  document.getElementById("confirm-message").textContent =
    `Supprimer l'abonné "${email}" ?`;
  openModal("modal-confirm");
}

// ================================================
// UPLOAD IMAGE NEWS
// ================================================

async function uploadNewsImage(input) {
  const file = input.files[0];
  if (!file) return;

  const statusEl = document.getElementById("news-image-upload-status");
  const previewDiv = document.getElementById("news-image-preview");
  const previewImg = document.getElementById("news-image-preview-img");

  statusEl.textContent = "Upload en cours...";
  statusEl.style.color = "#888";

  const formData = new FormData();
  formData.append("image", file);

  try {
    const token = api.getToken();
    const res = await fetch(`${CONFIG.API_BASE}/news/upload-image`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const data = await res.json();

    if (!res.ok || !data.success)
      throw new Error(data.message || "Erreur upload");

    const imageUrl = data.url.startsWith("http") ? data.url : "https://chu-yaounde-backend.onrender.com" + data.url;
    document.getElementById("news-image-input").value = data.url;
    previewImg.src = imageUrl;
    previewDiv.style.display = "block";
    statusEl.textContent = "✓ Image uploadée";
    statusEl.style.color = "#2e7d32";
    toast("Image uploadée avec succès", "success");
  } catch (err) {
    statusEl.textContent = "✗ Erreur: " + err.message;
    statusEl.style.color = "#e53e3e";
    toast("Erreur upload image: " + err.message, "error");
  }

  // Reset input pour permettre re-upload du même fichier
  input.value = "";
}

function clearNewsImage() {
  document.getElementById("news-image-input").value = "";
  document.getElementById("news-image-preview").style.display = "none";
  document.getElementById("news-image-preview-img").src = "";
  document.getElementById("news-image-upload-status").textContent = "";
}

// ================================================
// SECTION STAGES (INTERNSHIPS)
// ================================================

async function loadInternships() {
  const list = document.getElementById("internships-list");
  list.innerHTML =
    '<div class="loading-state"><i class="fas fa-circle-notch fa-spin"></i></div>';
  try {
    const res = await api.get("/internships/admin/all");
    renderInternships(res.data);
  } catch (err) {
    list.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation"></i><p>${err.message}</p></div>`;
  }
}

function renderInternships(data) {
  const list = document.getElementById("internships-list");
  if (!data.length) {
    list.innerHTML =
      '<div class="empty-state"><i class="fas fa-briefcase"></i><p>Aucun stage créé</p></div>';
    return;
  }
  list.innerHTML = data
    .map(
      (s) => `
    <div class="news-item">
      <div class="news-item-img" style="background:var(--sidebar-bg);display:flex;align-items:center;justify-content:center">
        <i class="fas ${s.icon || "fa-stethoscope"}" style="font-size:1.4rem;color:var(--primary)"></i>
      </div>
      <div class="news-item-content">
        <div class="news-item-title">${s.title}</div>
        <div class="news-item-meta">
          <span class="pill ${s.active ? "pill-green" : "pill-gray"}">${s.active ? "Actif" : "Inactif"}</span>
          ${s.duration ? `<span><i class="fas fa-clock" style="margin-right:3px"></i>${s.duration}</span>` : ""}
          ${s.level ? `<span><i class="fas fa-user-graduate" style="margin-right:3px"></i>${s.level}</span>` : ""}
        </div>
      </div>
      <div class="news-item-actions">
        <button class="btn-icon ${s.active ? "btn-icon-warning" : "btn-icon-success"}" title="${s.active ? "Désactiver" : "Activer"}" onclick="toggleInternship('${s._id}')">
          <i class="fas fa-${s.active ? "eye-slash" : "eye"}"></i>
        </button>
        <button class="btn-icon btn-icon-primary" title="Modifier" onclick="editInternship('${s._id}')">
          <i class="fas fa-edit"></i>
        </button>
        <button class="btn-icon btn-icon-danger" title="Supprimer" onclick="deleteInternship('${s._id}','${s.title.replace(/'/g, "&#39;")}')">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    </div>`,
    )
    .join("");
}

function openInternshipModal(s = null) {
  document.getElementById("modal-internship-title").textContent = s
    ? "Modifier le stage"
    : "Nouveau stage";
  document.getElementById("internship-id").value = s?._id || "";
  document.getElementById("internship-title").value = s?.title || "";
  document.getElementById("internship-icon").value =
    s?.icon || "fa-stethoscope";
  document.getElementById("internship-description").value =
    s?.description || "";
  document.getElementById("internship-details").value = s?.details || "";
  document.getElementById("internship-duration").value = s?.duration || "";
  document.getElementById("internship-level").value = s?.level || "";
  document.getElementById("internship-supervision").value =
    s?.supervision || "";
  document.getElementById("internship-email").value = s?.applyEmail || "";
  document.getElementById("internship-link").value = s?.applyLink || "";
  document.getElementById("internship-active").checked = s ? s.active : true;
  document.getElementById("modal-internship").classList.remove("hidden");
}

async function saveInternship() {
  const id = document.getElementById("internship-id").value;
  const title = document.getElementById("internship-title").value.trim();
  const desc = document.getElementById("internship-description").value.trim();
  if (!title || !desc) {
    toast("Le titre et la description sont obligatoires", "error");
    return;
  }

  const payload = {
    title,
    icon:
      document.getElementById("internship-icon").value.trim() ||
      "fa-stethoscope",
    description: desc,
    details: document.getElementById("internship-details").value.trim(),
    duration: document.getElementById("internship-duration").value.trim(),
    level: document.getElementById("internship-level").value.trim(),
    supervision: document.getElementById("internship-supervision").value.trim(),
    applyEmail: document.getElementById("internship-email").value.trim(),
    applyLink: document.getElementById("internship-link").value.trim(),
    active: document.getElementById("internship-active").checked,
  };

  try {
    id
      ? await api.put(`/internships/${id}`, payload)
      : await api.post("/internships", payload);
    document.getElementById("modal-internship").classList.add("hidden");
    loadInternships();
    refreshChatbotCache();
    toast(id ? "Stage modifié" : "Stage créé", "success");
  } catch (err) {
    toast("Erreur : " + err.message, "error");
  }
}

async function editInternship(id) {
  try {
    const res = await api.get(`/internships/${id}`);
    openInternshipModal(res.data);
  } catch (err) {
    toast("Impossible de charger le stage", "error");
  }
}

async function toggleInternship(id) {
  try {
    await api.request("PATCH", `/internships/${id}/toggle`);
    loadInternships();
    refreshChatbotCache();
  } catch (err) {
    toast("Erreur : " + err.message, "error");
  }
}

function deleteInternship(id, title) {
  if (!confirm(`Supprimer le stage "${title}" ?`)) return;
  api
    .delete(`/internships/${id}`)
    .then(() => {
      loadInternships();
      refreshChatbotCache();
      toast("Stage supprimé", "success");
    })
    .catch((err) => toast("Erreur : " + err.message, "error"));
}

document
  .getElementById("btn-add-internship")
  ?.addEventListener("click", () => openInternshipModal());
document
  .getElementById("btn-save-internship")
  ?.addEventListener("click", saveInternship);

// ================================================
// SECTION FORMATIONS (TRAININGS)
// ================================================

async function loadTrainings() {
  const list = document.getElementById("trainings-list");
  list.innerHTML =
    '<div class="loading-state"><i class="fas fa-circle-notch fa-spin"></i></div>';
  try {
    const res = await api.get("/trainings/admin/all");
    renderTrainings(res.data);
  } catch (err) {
    list.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation"></i><p>${err.message}</p></div>`;
  }
}

function renderTrainings(data) {
  const list = document.getElementById("trainings-list");
  if (!data.length) {
    list.innerHTML =
      '<div class="empty-state"><i class="fas fa-graduation-cap"></i><p>Aucune formation créée</p></div>';
    return;
  }
  list.innerHTML = data
    .map(
      (t) => `
    <div class="news-item">
      <div class="news-item-img" style="background:var(--sidebar-bg);display:flex;align-items:center;justify-content:center">
        ${t.image ? `<img src="${t.image}" alt="${t.title}" style="width:100%;height:100%;object-fit:cover;border-radius:var(--radius-sm)" onerror="this.parentElement.innerHTML='<i class=\\'fas fa-graduation-cap\\'></i>'">` : '<i class="fas fa-graduation-cap" style="font-size:1.4rem;color:var(--primary)"></i>'}
      </div>
      <div class="news-item-content">
        <div class="news-item-title">${t.title}</div>
        <div class="news-item-meta">
          <span class="pill ${t.active ? "pill-green" : "pill-gray"}">${t.active ? "Active" : "Inactive"}</span>
          <span class="pill pill-blue">${t.category}</span>
          ${t.duration ? `<span><i class="fas fa-clock" style="margin-right:3px"></i>${t.duration}</span>` : ""}
          ${t.places ? `<span><i class="fas fa-users" style="margin-right:3px"></i>${t.places} places</span>` : ""}
          ${t.nextSession ? `<span><i class="fas fa-calendar" style="margin-right:3px"></i>${t.nextSession}</span>` : ""}
        </div>
      </div>
      <div class="news-item-actions">
        <button class="btn-icon ${t.active ? "btn-icon-warning" : "btn-icon-success"}" title="${t.active ? "Désactiver" : "Activer"}" onclick="toggleTraining('${t._id}')">
          <i class="fas fa-${t.active ? "eye-slash" : "eye"}"></i>
        </button>
        <button class="btn-icon btn-icon-primary" title="Modifier" onclick="editTraining('${t._id}')">
          <i class="fas fa-edit"></i>
        </button>
        <button class="btn-icon btn-icon-danger" title="Supprimer" onclick="deleteTraining('${t._id}','${t.title.replace(/'/g, "&#39;")}')">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    </div>`,
    )
    .join("");
}

function openTrainingModal(t = null) {
  document.getElementById("modal-training-title").textContent = t
    ? "Modifier la formation"
    : "Nouvelle formation";
  document.getElementById("training-id").value = t?._id || "";
  document.getElementById("training-title").value = t?.title || "";
  document.getElementById("training-category").value = t?.category || "";
  document.getElementById("training-description").value = t?.description || "";
  document.getElementById("training-duration").value = t?.duration || "";
  document.getElementById("training-places").value = t?.places || "";
  document.getElementById("training-session").value = t?.nextSession || "";
  document.getElementById("training-email").value = t?.registerEmail || "";
  document.getElementById("training-link").value = t?.registerLink || "";
  document.getElementById("training-image").value = t?.image || "";
  document.getElementById("training-active").checked = t ? t.active : true;

  // Gérer l'aperçu image
  const preview = document.getElementById("training-image-preview");
  const previewImg = document.getElementById("training-image-preview-img");
  const status = document.getElementById("training-image-status");
  status.textContent = "";
  if (t?.image) {
    const url = t.image.startsWith("http")
      ? t.image
      : (t.image.startsWith("/") ? "https://chu-yaounde-backend.onrender.com" + t.image : t.image);
    previewImg.src = url;
    preview.style.display = "block";
  } else {
    previewImg.src = "";
    preview.style.display = "none";
  }

  document.getElementById("modal-training").classList.remove("hidden");
}

async function saveTraining() {
  const id = document.getElementById("training-id").value;
  const title = document.getElementById("training-title").value.trim();
  const cat = document.getElementById("training-category").value.trim();
  const desc = document.getElementById("training-description").value.trim();
  if (!title || !cat || !desc) {
    toast(
      "Le titre, la catégorie et la description sont obligatoires",
      "error",
    );
    return;
  }

  const payload = {
    title,
    category: cat,
    description: desc,
    duration: document.getElementById("training-duration").value.trim(),
    places: parseInt(document.getElementById("training-places").value) || 0,
    nextSession: document.getElementById("training-session").value.trim(),
    registerEmail: document.getElementById("training-email").value.trim(),
    registerLink: document.getElementById("training-link").value.trim(),
    image: document.getElementById("training-image").value.trim(),
    active: document.getElementById("training-active").checked,
  };

  try {
    id
      ? await api.put(`/trainings/${id}`, payload)
      : await api.post("/trainings", payload);
    document.getElementById("modal-training").classList.add("hidden");
    loadTrainings();
    refreshChatbotCache();
    toast(id ? "Formation modifiée" : "Formation créée", "success");
  } catch (err) {
    toast("Erreur : " + err.message, "error");
  }
}

async function editTraining(id) {
  try {
    const res = await api.get(`/trainings/${id}`);
    openTrainingModal(res.data);
  } catch (err) {
    toast("Impossible de charger la formation", "error");
  }
}

async function toggleTraining(id) {
  try {
    await api.request("PATCH", `/trainings/${id}/toggle`);
    loadTrainings();
    refreshChatbotCache();
  } catch (err) {
    toast("Erreur : " + err.message, "error");
  }
}

function deleteTraining(id, title) {
  if (!confirm(`Supprimer la formation "${title}" ?`)) return;
  api
    .delete(`/trainings/${id}`)
    .then(() => {
      loadTrainings();
      refreshChatbotCache();
      toast("Formation supprimée", "success");
    })
    .catch((err) => toast("Erreur : " + err.message, "error"));
}

async function uploadTrainingImage(input) {
  const file = input.files[0];
  if (!file) return;
  const statusEl = document.getElementById("training-image-status");
  const previewEl = document.getElementById("training-image-preview");
  const previewImg = document.getElementById("training-image-preview-img");
  statusEl.textContent = "Upload en cours...";
  statusEl.style.color = "#888";
  const formData = new FormData();
  formData.append("image", file);
  try {
    const token = api.getToken();
    const res = await fetch(`${CONFIG.API_BASE}/trainings/upload-image`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const data = await res.json();
    if (!res.ok || !data.success)
      throw new Error(data.message || "Erreur upload");
    document.getElementById("training-image").value = data.url;
    previewImg.src = data.url.startsWith("http") ? data.url : "https://chu-yaounde-backend.onrender.com" + data.url;
    previewEl.style.display = "block";
    statusEl.textContent = "✓ Image uploadée";
    statusEl.style.color = "#2e7d32";
    toast("Image uploadée avec succès", "success");
  } catch (err) {
    statusEl.textContent = "✗ Erreur : " + err.message;
    statusEl.style.color = "#e53e3e";
    toast("Erreur upload image : " + err.message, "error");
  }
  input.value = "";
}

function clearTrainingImage() {
  document.getElementById("training-image").value = "";
  document.getElementById("training-image-preview").style.display = "none";
  document.getElementById("training-image-preview-img").src = "";
  document.getElementById("training-image-status").textContent = "";
}

document
  .getElementById("btn-add-training")
  ?.addEventListener("click", () => openTrainingModal());
document
  .getElementById("btn-save-training")
  ?.addEventListener("click", saveTraining);

// ================================================
// SECTION CONCOURS (CONTESTS)
// ================================================

const CONTEST_STATUS_LABELS = {
  open: { label: "Ouvert", pill: "pill-green" },
  soon: { label: "Bientôt", pill: "pill-blue" },
  closed: { label: "Clôturé", pill: "pill-gray" },
};

async function loadContests() {
  const list = document.getElementById("contests-list");
  list.innerHTML =
    '<div class="loading-state"><i class="fas fa-circle-notch fa-spin"></i></div>';
  try {
    const res = await api.get("/contests/admin/all");
    renderContests(res.data);
  } catch (err) {
    list.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation"></i><p>${err.message}</p></div>`;
  }
}

function renderContests(data) {
  const list = document.getElementById("contests-list");
  if (!data.length) {
    list.innerHTML =
      '<div class="empty-state"><i class="fas fa-file-alt"></i><p>Aucun concours créé</p></div>';
    return;
  }
  list.innerHTML = data
    .map((c) => {
      const st = CONTEST_STATUS_LABELS[c.status] || CONTEST_STATUS_LABELS.soon;
      return `
    <div class="news-item">
      <div class="news-item-img" style="background:var(--sidebar-bg);display:flex;align-items:center;justify-content:center">
        <i class="fas ${c.icon || "fa-file-alt"}" style="font-size:1.4rem;color:var(--primary)"></i>
      </div>
      <div class="news-item-content">
        <div class="news-item-title">${c.title}</div>
        <div class="news-item-meta">
          <span class="pill ${c.active ? "pill-green" : "pill-gray"}">${c.active ? "Actif" : "Inactif"}</span>
          <span class="pill ${st.pill}">${st.label}</span>
          ${c.examDate ? `<span><i class="fas fa-calendar-alt" style="margin-right:3px"></i>${c.examDate}</span>` : ""}
          ${c.registrationDeadline ? `<span><i class="fas fa-clock" style="margin-right:3px"></i>Limite: ${c.registrationDeadline}</span>` : ""}
          ${c.programPdf ? `<span style="color:#2e7d32"><i class="fas fa-file-pdf" style="margin-right:3px"></i>PDF</span>` : ""}
        </div>
      </div>
      <div class="news-item-actions">
        <button class="btn-icon ${c.active ? "btn-icon-warning" : "btn-icon-success"}" title="${c.active ? "Désactiver" : "Activer"}" onclick="toggleContest('${c._id}')">
          <i class="fas fa-${c.active ? "eye-slash" : "eye"}"></i>
        </button>
        <button class="btn-icon btn-icon-primary" title="Modifier" onclick="editContest('${c._id}')">
          <i class="fas fa-edit"></i>
        </button>
        <button class="btn-icon btn-icon-danger" title="Supprimer" onclick="deleteContest('${c._id}','${c.title.replace(/'/g, "&#39;")}')">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    </div>`;
    })
    .join("");
}

function openContestModal(c = null) {
  document.getElementById("modal-contest-title").textContent = c
    ? "Modifier le concours"
    : "Nouveau concours";
  document.getElementById("contest-id").value = c?._id || "";
  document.getElementById("contest-title").value = c?.title || "";
  document.getElementById("contest-icon").value = c?.icon || "fa-file-medical";
  document.getElementById("contest-description").value = c?.description || "";
  document.getElementById("contest-examdate").value = c?.examDate || "";
  document.getElementById("contest-deadline").value =
    c?.registrationDeadline || "";
  document.getElementById("contest-status").value = c?.status || "soon";
  document.getElementById("contest-subjects").value = c?.subjects || "";
  document.getElementById("contest-email").value = c?.registerEmail || "";
  document.getElementById("contest-link").value = c?.registerLink || "";
  document.getElementById("contest-pdf").value = c?.programPdf || "";
  document.getElementById("contest-active").checked = c ? c.active : true;

  const preview = document.getElementById("contest-pdf-preview");
  const filename = document.getElementById("contest-pdf-filename");
  if (c?.programPdf) {
    filename.textContent = c.programPdf.split("/").pop();
    preview.style.display = "block";
  } else {
    preview.style.display = "none";
    filename.textContent = "";
  }
  document.getElementById("contest-pdf-status").textContent = "";
  document.getElementById("modal-contest").classList.remove("hidden");
}

async function saveContest() {
  const id = document.getElementById("contest-id").value;
  const title = document.getElementById("contest-title").value.trim();
  const desc = document.getElementById("contest-description").value.trim();
  if (!title || !desc) {
    toast("Le titre et la description sont obligatoires", "error");
    return;
  }

  const payload = {
    title,
    icon:
      document.getElementById("contest-icon").value.trim() || "fa-file-medical",
    description: desc,
    examDate: document.getElementById("contest-examdate").value.trim(),
    registrationDeadline: document
      .getElementById("contest-deadline")
      .value.trim(),
    status: document.getElementById("contest-status").value,
    subjects: document.getElementById("contest-subjects").value.trim(),
    registerEmail: document.getElementById("contest-email").value.trim(),
    registerLink: document.getElementById("contest-link").value.trim(),
    programPdf: document.getElementById("contest-pdf").value.trim(),
    active: document.getElementById("contest-active").checked,
  };

  try {
    id
      ? await api.put(`/contests/${id}`, payload)
      : await api.post("/contests", payload);
    document.getElementById("modal-contest").classList.add("hidden");
    loadContests();
    refreshChatbotCache();
    toast(id ? "Concours modifié" : "Concours créé", "success");
  } catch (err) {
    toast("Erreur : " + err.message, "error");
  }
}

async function editContest(id) {
  try {
    const res = await api.get(`/contests/${id}`);
    openContestModal(res.data);
  } catch (err) {
    toast("Impossible de charger le concours", "error");
  }
}

async function toggleContest(id) {
  try {
    await api.request("PATCH", `/contests/${id}/toggle`);
    loadContests();
    refreshChatbotCache();
  } catch (err) {
    toast("Erreur : " + err.message, "error");
  }
}

function deleteContest(id, title) {
  if (!confirm(`Supprimer le concours "${title}" ?`)) return;
  api
    .delete(`/contests/${id}`)
    .then(() => {
      loadContests();
      refreshChatbotCache();
      toast("Concours supprimé", "success");
    })
    .catch((err) => toast("Erreur : " + err.message, "error"));
}

async function uploadContestPdf(input) {
  const file = input.files[0];
  if (!file) return;
  const statusEl = document.getElementById("contest-pdf-status");
  const previewEl = document.getElementById("contest-pdf-preview");
  const nameEl = document.getElementById("contest-pdf-filename");
  statusEl.textContent = "Upload en cours...";
  statusEl.style.color = "#888";
  const formData = new FormData();
  formData.append("pdf", file);
  try {
    const token = api.getToken();
    const res = await fetch(`${CONFIG.API_BASE}/contests/upload-pdf`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const data = await res.json();
    if (!res.ok || !data.success)
      throw new Error(data.message || "Erreur upload");
    document.getElementById("contest-pdf").value = data.url;
    nameEl.textContent = file.name;
    previewEl.style.display = "block";
    statusEl.textContent = "✓ PDF uploadé";
    statusEl.style.color = "#2e7d32";
    toast("PDF uploadé avec succès", "success");
  } catch (err) {
    statusEl.textContent = "✗ Erreur: " + err.message;
    statusEl.style.color = "#e53e3e";
    toast("Erreur upload: " + err.message, "error");
  }
  input.value = "";
}

function clearContestPdf() {
  document.getElementById("contest-pdf").value = "";
  document.getElementById("contest-pdf-preview").style.display = "none";
  document.getElementById("contest-pdf-filename").textContent = "";
  document.getElementById("contest-pdf-status").textContent = "";
}

document
  .getElementById("btn-add-contest")
  ?.addEventListener("click", () => openContestModal());
document
  .getElementById("btn-save-contest")
  ?.addEventListener("click", saveContest);

// ================================================
// INIT APP
// ================================================

function initApp() {
  // Set user info in sidebar
  const user = api.getUser();
  if (user) {
    const initials =
      (
        (user.firstName?.[0] || "") + (user.lastName?.[0] || "")
      ).toUpperCase() || "AD";
    document.getElementById("user-avatar-initials").textContent = initials;
    document.getElementById("user-display-name").textContent =
      `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Admin";
    document.getElementById("user-display-role").textContent =
      user.role || "admin";
  }

  navigateTo("dashboard");
  // Auto-refresh dashboard every 2 minutes
  setInterval(() => {
    if (state.currentSection === "dashboard") loadDashboard();
  }, 120000);
}

// ================================================
// BOOT
// ================================================

(function boot() {
  if (api.getToken()) {
    showAdmin();
  } else {
    showLogin();
  }
})();

// ================================================
// GESTION DES DOCUMENTS (Formulaires, Appels d'Offres, Rapports)
// ================================================

// Données par défaut pré-chargées depuis documents.html
const DEFAULT_DOCUMENTS = [
  // ---- FORMULAIRES ----
  {
    id: "doc-default-1",
    category: "formulaire",
    title: "Formulaire d'Admission",
    description: "Formulaire de demande d'admission au CHU",
    icon: "fas fa-file-medical",
    fileSize: "245 KB",
    url: "#",
    previewUrl: "#",
  },
  {
    id: "doc-default-2",
    category: "formulaire",
    title: "Formulaire de Consentement",
    description: "Consentement éclairé pour les soins",
    icon: "fas fa-user-check",
    fileSize: "180 KB",
    url: "#",
    previewUrl: "#",
  },
  {
    id: "doc-default-3",
    category: "formulaire",
    title: "Formulaire de Rendez-vous",
    description: "Demande de rendez-vous médical",
    icon: "fas fa-calendar-check",
    fileSize: "210 KB",
    url: "#",
    previewUrl: "#",
  },
  {
    id: "doc-default-4",
    category: "formulaire",
    title: "Formulaire de Réclamation",
    description: "Formulaire pour déposer une réclamation",
    icon: "fas fa-comment-medical",
    fileSize: "195 KB",
    url: "#",
    previewUrl: "#",
  },
  {
    id: "doc-default-5",
    category: "formulaire",
    title: "Formulaire Données Médicales",
    description: "Autorisation d'utilisation des données",
    icon: "fas fa-clipboard-list",
    fileSize: "220 KB",
    url: "#",
    previewUrl: "#",
  },
  {
    id: "doc-default-6",
    category: "formulaire",
    title: "Formulaire de Sortie",
    description: "Document de sortie d'hospitalisation",
    icon: "fas fa-sign-out-alt",
    fileSize: "230 KB",
    url: "#",
    previewUrl: "#",
  },
  // ---- APPELS D'OFFRES ----
  {
    id: "doc-default-7",
    category: "appel_offre",
    title: "Équipements de Radiologie",
    description:
      "Acquisition d'appareils de radiologie numérique pour le service d'imagerie médicale",
    ref: "AO-2024-001",
    tenderStatus: "open",
    deadline: "15 Mars 2024",
    budget: "250.000.000 FCFA",
    url: "#",
    previewUrl: "#",
  },
  {
    id: "doc-default-8",
    category: "appel_offre",
    title: "Maintenance des Ascenseurs",
    description:
      "Contrat de maintenance préventive et corrective des ascenseurs du bâtiment principal",
    ref: "AO-2024-002",
    tenderStatus: "closed",
    deadline: "28 Février 2024",
    budget: "45.000.000 FCFA",
    url: "#",
    previewUrl: "#",
  },
  // ---- RAPPORTS ----
  {
    id: "doc-default-9",
    category: "rapport",
    title: "Rapport Annuel 2023",
    description: "Bilan des activités et performances du CHU",
    reportIcon: "fas fa-chart-line",
    pubDate: "15 Jan 2024",
    pages: "156 pages",
    url: "#",
    previewUrl: "#",
  },
  {
    id: "doc-default-10",
    category: "rapport",
    title: "Rapport Qualité 2023",
    description: "Évaluation de la qualité des soins et services",
    reportIcon: "fas fa-award",
    pubDate: "20 Jan 2024",
    pages: "89 pages",
    url: "#",
    previewUrl: "#",
  },
  {
    id: "doc-default-11",
    category: "rapport",
    title: "Rapport Financier 2023",
    description: "Bilan financier et comptable de l'exercice",
    reportIcon: "fas fa-chart-pie",
    pubDate: "25 Jan 2024",
    pages: "124 pages",
    url: "#",
    previewUrl: "#",
  },
];

const DOC_STORAGE_KEY = "chu_documents";

// Récupère tous les documents (localStorage ou défauts)
function getStoredDocuments() {
  try {
    const raw = localStorage.getItem(DOC_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  // Premier chargement : initialiser avec les données par défaut
  saveDocuments(DEFAULT_DOCUMENTS);
  return DEFAULT_DOCUMENTS;
}

function saveDocuments(docs) {
  localStorage.setItem(DOC_STORAGE_KEY, JSON.stringify(docs));
}

// Tab actif
let currentDocTab = "formulaire";

function switchDocTab(tab, btn) {
  currentDocTab = tab;
  document
    .querySelectorAll(".doc-tab-btn")
    .forEach((b) => b.classList.remove("active"));
  if (btn) btn.classList.add("active");
  renderDocumentsList();
}

function loadDocuments() {
  // S'assurer que les données par défaut sont chargées
  getStoredDocuments();
  renderDocumentsList();
}

function renderDocumentsList() {
  const docs = getStoredDocuments();
  const filtered = docs.filter((d) => d.category === currentDocTab);
  const container = document.getElementById("documents-list");
  if (!container) return;

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="text-align:center;padding:40px;color:var(--text-3)">
        <i class="fas fa-folder-open" style="font-size:2.5rem;margin-bottom:12px;opacity:.4"></i>
        <p>Aucun document dans cette catégorie.</p>
        <button class="btn-primary" onclick="openDocumentModal()">
          <i class="fas fa-plus"></i> Ajouter un document
        </button>
      </div>`;
    return;
  }

  let html = `<div class="table-card"><div class="table-wrap"><table class="data-table">
    <thead><tr>
      <th>Titre</th>
      <th>Description</th>
      ${currentDocTab === "appel_offre" ? "<th>Référence</th><th>Statut</th><th>Date limite</th><th>Budget</th>" : ""}
      ${currentDocTab === "rapport" ? "<th>Publication</th><th>Pages</th>" : ""}
      ${currentDocTab === "formulaire" ? "<th>Taille</th>" : ""}
      <th>Lien</th>
      <th>Actions</th>
    </tr></thead><tbody>`;

  filtered.forEach((doc) => {
    const isDefault = doc.id.startsWith("doc-default-");
    const badgeDefault = isDefault
      ? `<span style="font-size:10px;background:#e3f2fd;color:#1565c0;border-radius:4px;padding:1px 6px;margin-left:6px">défaut</span>`
      : "";

    let extraCols = "";
    if (currentDocTab === "appel_offre") {
      const statusMap = {
        open: ["bg-success", "Ouvert"],
        closed: ["bg-warning", "Clôturé"],
        awarded: ["bg-secondary", "Attribué"],
      };
      const [cls, lbl] = statusMap[doc.tenderStatus] || [
        "bg-secondary",
        doc.tenderStatus,
      ];
      extraCols = `
        <td>${doc.ref || "—"}</td>
        <td><span class="badge ${cls}">${lbl}</span></td>
        <td>${doc.deadline || "—"}</td>
        <td>${doc.budget || "—"}</td>`;
    } else if (currentDocTab === "rapport") {
      extraCols = `<td>${doc.pubDate || "—"}</td><td>${doc.pages || "—"}</td>`;
    } else {
      extraCols = `<td>${doc.fileSize || "—"}</td>`;
    }

    const linkDisplay =
      doc.url && doc.url !== "#"
        ? `<a href="${doc.url}" target="_blank" style="font-size:12px;color:var(--accent)"><i class="fas fa-external-link-alt"></i> Voir</a>`
        : `<span style="color:var(--text-3);font-size:12px">—</span>`;

    html += `<tr>
      <td><strong>${doc.title}</strong>${badgeDefault}</td>
      <td style="max-width:220px;white-space:normal;font-size:13px">${doc.description || "—"}</td>
      ${extraCols}
      <td>${linkDisplay}</td>
      <td>
        <div style="display:flex;gap:6px">
          <button class="btn-sm btn-outline" onclick="openDocumentModal('${doc.id}')" title="Modifier">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn-sm btn-danger" onclick="deleteDocument('${doc.id}')" title="Supprimer">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </td>
    </tr>`;
  });

  html += `</tbody></table></div></div>`;
  container.innerHTML = html;
}

// Ouvre le modal (création ou édition)
function openDocumentModal(docId) {
  const isEdit = !!docId;
  document.getElementById("modal-document-title").textContent = isEdit
    ? "Modifier le document"
    : "Nouveau document";
  document.getElementById("document-id").value = docId || "";

  // Reset champs
  [
    "document-title",
    "document-description",
    "document-icon",
    "document-filesize",
    "document-ref",
    "document-deadline",
    "document-budget",
    "document-report-icon",
    "document-pubdate",
    "document-pages",
    "document-url",
    "document-preview-url",
  ].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
  // Reset PDF preview
  document.getElementById("document-pdf-preview").style.display = "none";
  document.getElementById("document-pdf-filename").textContent = "";
  document.getElementById("document-pdf-upload-status").textContent = "";
  document.getElementById("document-category").value = currentDocTab;
  document.getElementById("document-tender-status").value = "open";
  toggleDocFields(currentDocTab);

  if (isEdit) {
    const docs = getStoredDocuments();
    const doc = docs.find((d) => d.id === docId);
    if (doc) {
      document.getElementById("document-title").value = doc.title || "";
      document.getElementById("document-category").value =
        doc.category || "formulaire";
      document.getElementById("document-description").value =
        doc.description || "";
      document.getElementById("document-icon").value = doc.icon || "";
      document.getElementById("document-filesize").value = doc.fileSize || "";
      document.getElementById("document-ref").value = doc.ref || "";
      document.getElementById("document-tender-status").value =
        doc.tenderStatus || "open";
      document.getElementById("document-deadline").value = doc.deadline || "";
      document.getElementById("document-budget").value = doc.budget || "";
      document.getElementById("document-report-icon").value =
        doc.reportIcon || "";
      document.getElementById("document-pubdate").value = doc.pubDate || "";
      document.getElementById("document-pages").value = doc.pages || "";
      document.getElementById("document-url").value = doc.url || "";
      document.getElementById("document-preview-url").value =
        doc.previewUrl || "";
      toggleDocFields(doc.category);
    }
  }

  document.getElementById("modal-document").classList.remove("hidden");
}

function toggleDocFields(cat) {
  ["formulaire", "appel_offre", "rapport"].forEach((c) => {
    const el = document.getElementById(`doc-fields-${c}`);
    if (el) el.style.display = c === cat ? "" : "none";
  });
}

// Liaison du select catégorie dans le modal
document
  .getElementById("document-category")
  ?.addEventListener("change", function () {
    toggleDocFields(this.value);
  });

function saveDocument() {
  const id = document.getElementById("document-id").value;
  const title = document.getElementById("document-title").value.trim();
  const category = document.getElementById("document-category").value;

  if (!title) {
    toast("Le titre est obligatoire", "error");
    return;
  }
  if (!category) {
    toast("La catégorie est obligatoire", "error");
    return;
  }

  const doc = {
    id: id || "doc-" + Date.now(),
    category,
    title,
    description: document.getElementById("document-description").value.trim(),
    icon:
      document.getElementById("document-icon").value.trim() ||
      "fas fa-file-pdf",
    fileSize: document.getElementById("document-filesize").value.trim(),
    ref: document.getElementById("document-ref").value.trim(),
    tenderStatus: document.getElementById("document-tender-status").value,
    deadline: document.getElementById("document-deadline").value.trim(),
    budget: document.getElementById("document-budget").value.trim(),
    reportIcon:
      document.getElementById("document-report-icon").value.trim() ||
      "fas fa-chart-bar",
    pubDate: document.getElementById("document-pubdate").value.trim(),
    pages: document.getElementById("document-pages").value.trim(),
    url: document.getElementById("document-url").value.trim() || "#",
    previewUrl:
      document.getElementById("document-preview-url").value.trim() || "#",
  };

  const docs = getStoredDocuments();
  const idx = docs.findIndex((d) => d.id === id);
  if (idx >= 0) {
    docs[idx] = doc;
    toast("Document modifié avec succès", "success");
  } else {
    docs.push(doc);
    toast("Document ajouté avec succès", "success");
  }

  saveDocuments(docs);

  // Switcher vers l'onglet de la catégorie enregistrée
  currentDocTab = category;
  document.querySelectorAll(".doc-tab-btn").forEach((b) => {
    b.classList.toggle("active", b.dataset.tab === category);
  });

  document.getElementById("modal-document").classList.add("hidden");
  renderDocumentsList();
}

function deleteDocument(docId) {
  const docs = getStoredDocuments();
  const doc = docs.find((d) => d.id === docId);
  if (!doc) return;

  // Réutilisation du modal de confirmation existant
  document.getElementById("confirm-message").textContent =
    `Êtes-vous sûr de vouloir supprimer "${doc.title}" ? Cette action est irréversible.`;
  document.getElementById("btn-confirm-delete").onclick = () => {
    const updated = docs.filter((d) => d.id !== docId);
    saveDocuments(updated);
    document.getElementById("modal-confirm").classList.add("hidden");
    toast("Document supprimé", "success");
    renderDocumentsList();
  };
  document.getElementById("modal-confirm").classList.remove("hidden");
}

// Upload PDF document depuis le PC
async function uploadDocumentPdf(input) {
  const file = input.files[0];
  if (!file) return;

  const statusEl = document.getElementById("document-pdf-upload-status");
  const previewDiv = document.getElementById("document-pdf-preview");
  const filenameEl = document.getElementById("document-pdf-filename");

  statusEl.textContent = "Upload en cours...";
  statusEl.style.color = "#888";

  const formData = new FormData();
  formData.append("pdf", file);

  try {
    const token = api.getToken();
    const res = await fetch(`${CONFIG.API_BASE}/documents/upload-pdf`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const data = await res.json();

    if (!res.ok || !data.success)
      throw new Error(data.message || "Erreur upload");

    document.getElementById("document-url").value = data.url;
    filenameEl.textContent = file.name;
    previewDiv.style.display = "block";
    statusEl.textContent = "✓ PDF uploadé";
    statusEl.style.color = "#2e7d32";
    toast("PDF uploadé avec succès", "success");
  } catch (err) {
    statusEl.textContent = "✗ Erreur : " + err.message;
    statusEl.style.color = "#e53e3e";
    toast("Erreur upload PDF : " + err.message, "error");
  }

  input.value = "";
}

function clearDocumentPdf() {
  document.getElementById("document-url").value = "";
  document.getElementById("document-pdf-preview").style.display = "none";
  document.getElementById("document-pdf-filename").textContent = "";
  document.getElementById("document-pdf-upload-status").textContent = "";
}

// Boutons du modal document
document
  .getElementById("btn-add-document")
  ?.addEventListener("click", () => openDocumentModal());
document
  .getElementById("btn-save-document")
  ?.addEventListener("click", saveDocument);

// ================================================

// ================================================
// GESTION DU PERSONNEL
// ================================================

var _pHtml = (function () {
  function e(s) {
    return String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }
  return e;
})();

/* ── Charger la liste ── */
async function loadPersonnel() {
  var grid = document.getElementById("personnel-admin-grid");
  if (!grid) return;
  grid.innerHTML =
    '<div class="loading-state"><i class="fas fa-circle-notch fa-spin"></i></div>';
  try {
    var res = await api.get("/personnel");
    _renderPersonnelGrid(res.data || []);
  } catch (err) {
    grid.innerHTML =
      '<p style="color:var(--danger);padding:16px">Erreur : ' +
      _pHtml(err.message) +
      "</p>";
  }
}

/* ── Afficher les cartes ── */
function _renderPersonnelGrid(members) {
  var grid = document.getElementById("personnel-admin-grid");
  if (!grid) return;

  if (!members.length) {
    grid.innerHTML =
      '<div style="grid-column:1/-1;text-align:center;padding:48px 0;color:var(--text-2)">' +
      '<i class="fas fa-id-badge" style="font-size:44px;opacity:.18;display:block;margin-bottom:14px"></i>' +
      "Aucun membre enregistré.<br><small>Cliquez sur « Ajouter un membre » pour commencer.</small>" +
      "</div>";
    return;
  }

  grid.innerHTML = members
    .map(function (m) {
      var base = CONFIG.API_BASE.replace("/api", "");
      var photoHtml = m.photo
        ? '<img src="' + base + m.photo + '" alt="' + _pHtml(m.name) + '">'
        : '<div class="personnel-admin-placeholder"><i class="fas fa-user-md"></i></div>';

      return (
        '<div class="personnel-admin-card" data-pid="' +
        _pHtml(m.id) +
        '">' +
        '<div class="personnel-admin-photo" onclick="openPersPhotoModal(\'' +
        _pHtml(m.id) +
        '\')" title="Cliquer pour changer la photo">' +
        photoHtml +
        '<div class="photo-overlay"><i class="fas fa-camera"></i></div>' +
        "</div>" +
        '<div class="personnel-admin-info">' +
        '<div class="personnel-admin-name" title="' +
        _pHtml(m.name) +
        '">' +
        _pHtml(m.name) +
        "</div>" +
        '<div class="personnel-admin-poste" title="' +
        _pHtml(m.poste) +
        '">' +
        _pHtml(m.poste) +
        "</div>" +
        "</div>" +
        '<div class="personnel-admin-actions">' +
        '<button class="btn-pers-photo" onclick="openPersPhotoModal(\'' +
        _pHtml(m.id) +
        '\')" title="Photo">' +
        '<i class="fas fa-camera"></i> Photo' +
        "</button>" +
        '<button class="btn-pers-edit" onclick="openPersMemberModal(\'' +
        _pHtml(m.id) +
        "','" +
        _pHtml(m.name) +
        "','" +
        _pHtml(m.poste) +
        '\')" title="Modifier">' +
        '<i class="fas fa-pen"></i>' +
        "</button>" +
        '<button class="btn-pers-del" onclick="deletePersMember(\'' +
        _pHtml(m.id) +
        "','" +
        _pHtml(m.name) +
        '\')" title="Supprimer">' +
        '<i class="fas fa-trash"></i>' +
        "</button>" +
        "</div>" +
        "</div>"
      );
    })
    .join("");
}

/* ── Modal Ajouter / Modifier ── */
function openPersMemberModal(id, name, poste) {
  document.getElementById("personnel-member-id").value = id || "";
  document.getElementById("personnel-member-name").value = name || "";
  document.getElementById("personnel-member-poste").value = poste || "";
  document.getElementById("modal-personnel-title").textContent = id
    ? "Modifier le membre"
    : "Ajouter un membre";
  openModal("modal-personnel-member");
  setTimeout(function () {
    document.getElementById("personnel-member-name").focus();
  }, 100);
}

async function savePersMember() {
  var id = document.getElementById("personnel-member-id").value;
  var name = document.getElementById("personnel-member-name").value.trim();
  var poste = document.getElementById("personnel-member-poste").value.trim();
  if (!name) {
    toast("Le nom est requis", "warning");
    return;
  }
  if (!poste) {
    toast("Le poste est requis", "warning");
    return;
  }

  var btn = document.getElementById("btn-save-personnel-member");
  btn.disabled = true;
  try {
    if (id) {
      await api.put("/personnel/" + id, { name: name, poste: poste });
      toast("Membre modifié", "success");
    } else {
      await api.post("/personnel", { name: name, poste: poste });
      toast("Membre ajouté", "success");
    }
    closeModal("modal-personnel-member");
    loadPersonnel();
  } catch (err) {
    toast("Erreur : " + err.message, "error");
  } finally {
    btn.disabled = false;
  }
}

/* ── Modal Upload Photo ── */
function openPersPhotoModal(id) {
  document.getElementById("personnel-photo-member-id").value = id;
  document.getElementById("personnel-photo-file").value = "";
  document.getElementById("personnel-photo-preview-wrap").style.display =
    "none";
  openModal("modal-personnel-photo");
}

document
  .getElementById("personnel-photo-file")
  ?.addEventListener("change", function () {
    var file = this.files[0];
    if (!file) return;
    var wrap = document.getElementById("personnel-photo-preview-wrap");
    var preview = document.getElementById("personnel-photo-preview");
    var reader = new FileReader();
    reader.onload = function (e) {
      preview.src = e.target.result;
      wrap.style.display = "block";
    };
    reader.readAsDataURL(file);
  });

async function uploadPersPhoto() {
  var id = document.getElementById("personnel-photo-member-id").value;
  var file = document.getElementById("personnel-photo-file").files[0];
  if (!id) {
    toast("Membre introuvable", "error");
    return;
  }
  if (!file) {
    toast("Sélectionnez une image", "warning");
    return;
  }

  var btn = document.getElementById("btn-upload-personnel-photo");
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Envoi...';

  try {
    var fd = new FormData();
    fd.append("photo", file);
    var token = api.getToken();
    var res = await fetch(CONFIG.API_BASE + "/personnel/" + id + "/photo", {
      method: "POST",
      headers: token ? { Authorization: "Bearer " + token } : {},
      body: fd,
    });
    var data = await res.json();
    if (!res.ok) throw new Error(data.message || "Erreur upload");
    toast("Photo mise à jour", "success");
    closeModal("modal-personnel-photo");
    loadPersonnel();
  } catch (err) {
    toast("Erreur : " + err.message, "error");
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-upload"></i> Télécharger';
  }
}

/* ── Suppression ── */
function deletePersMember(id, name) {
  if (!confirm('Supprimer "' + name + '" ?\nCette action est irréversible.'))
    return;
  api
    .delete("/personnel/" + id)
    .then(function () {
      toast("Membre supprimé", "success");
      loadPersonnel();
    })
    .catch(function (err) {
      toast("Erreur : " + err.message, "error");
    });
}

/* ── Listeners ── */
document
  .getElementById("btn-add-personnel-member")
  ?.addEventListener("click", function () {
    openPersMemberModal(null, "", "");
  });
document
  .getElementById("btn-save-personnel-member")
  ?.addEventListener("click", savePersMember);
document
  .getElementById("btn-upload-personnel-photo")
  ?.addEventListener("click", uploadPersPhoto);
