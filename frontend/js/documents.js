// documents.js - Gestion de la page Documents (dynamique depuis admin)

const DOC_STORAGE_KEY = "chu_documents";

// Données par défaut (identiques à celles dans admin.js)
const DEFAULT_DOCUMENTS = [
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

function getDocuments() {
  try {
    const raw = localStorage.getItem(DOC_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return DEFAULT_DOCUMENTS;
}

// ---- RENDU FORMULAIRES ----
function renderFormulaires() {
  const grid = document.getElementById("formulaires-grid");
  if (!grid) return;
  const docs = getDocuments().filter((d) => d.category === "formulaire");

  if (!docs.length) {
    grid.innerHTML = `<div class="col-12 text-center text-muted py-4"><i class="fas fa-folder-open fa-2x mb-2"></i><p>Aucun formulaire disponible pour le moment.</p></div>`;
    return;
  }

  grid.innerHTML = docs
    .map(
      (doc) => `
    <div class="col-md-6 col-lg-4">
      <div class="document-card">
        <div class="document-icon">
          <i class="${doc.icon || "fas fa-file-pdf"}"></i>
        </div>
        <div class="document-content">
          <h5>${doc.title}</h5>
          <p>${doc.description || ""}</p>
          <div class="document-meta">
            <span class="badge bg-primary">PDF</span>
            ${doc.fileSize ? `<span class="file-size">${doc.fileSize}</span>` : ""}
          </div>
          <div class="document-actions">
            <a href="${doc.url || "#"}" class="btn btn-primary btn-sm" ${doc.url && doc.url !== "#" ? 'target="_blank"' : ""}>Télécharger</a>
            <a href="${doc.previewUrl || "#"}" class="btn btn-outline-primary btn-sm" ${doc.previewUrl && doc.previewUrl !== "#" ? 'target="_blank"' : ""}>Aperçu</a>
          </div>
        </div>
      </div>
    </div>
  `,
    )
    .join("");
}

// ---- RENDU APPELS D'OFFRES ----
function renderAppelsOffres(filterStatus = "", filterSearch = "") {
  const grid = document.getElementById("tendersGrid");
  if (!grid) return;

  let docs = getDocuments().filter((d) => d.category === "appel_offre");
  if (filterStatus) docs = docs.filter((d) => d.tenderStatus === filterStatus);
  if (filterSearch) {
    const s = filterSearch.toLowerCase();
    docs = docs.filter(
      (d) =>
        (d.title || "").toLowerCase().includes(s) ||
        (d.description || "").toLowerCase().includes(s),
    );
  }

  if (!docs.length) {
    grid.innerHTML = `<div class="col-12 text-center text-muted py-4"><i class="fas fa-search fa-2x mb-2"></i><p>Aucun appel d'offres trouvé.</p></div>`;
    return;
  }

  const statusMap = {
    open: ["bg-success", "Ouvert"],
    closed: ["bg-warning", "Clôturé"],
    awarded: ["bg-secondary", "Attribué"],
  };

  grid.innerHTML = docs
    .map((doc) => {
      const [cls, lbl] = statusMap[doc.tenderStatus] || [
        "bg-secondary",
        doc.tenderStatus || "—",
      ];
      return `
      <div class="col-lg-6">
        <div class="tender-card">
          <div class="tender-header">
            <span class="badge ${cls}">${lbl}</span>
            ${doc.ref ? `<span class="tender-ref">${doc.ref}</span>` : ""}
          </div>
          <div class="tender-body">
            <h5>${doc.title}</h5>
            <p>${doc.description || ""}</p>
            <div class="tender-details">
              ${doc.deadline ? `<div class="detail-item"><i class="fas fa-calendar-alt"></i> Date limite : <strong>${doc.deadline}</strong></div>` : ""}
              ${doc.budget ? `<div class="detail-item"><i class="fas fa-money-bill-wave"></i> Budget : <strong>${doc.budget}</strong></div>` : ""}
            </div>
          </div>
          <div class="tender-actions">
            <a href="${doc.url || "#"}" class="btn btn-primary" ${doc.url && doc.url !== "#" ? 'target="_blank"' : ""}>Télécharger le dossier</a>
            <a href="${doc.previewUrl || "#"}" class="btn btn-outline-primary" ${doc.previewUrl && doc.previewUrl !== "#" ? 'target="_blank"' : ""}>Voir détails</a>
          </div>
        </div>
      </div>`;
    })
    .join("");
}

// ---- RENDU RAPPORTS ----
function renderRapports() {
  const grid = document.getElementById("rapports-grid");
  if (!grid) return;
  const docs = getDocuments().filter((d) => d.category === "rapport");

  if (!docs.length) {
    grid.innerHTML = `<div class="col-12 text-center text-muted py-4"><i class="fas fa-folder-open fa-2x mb-2"></i><p>Aucun rapport disponible pour le moment.</p></div>`;
    return;
  }

  grid.innerHTML = docs
    .map(
      (doc) => `
    <div class="col-md-6 col-lg-4">
      <div class="report-card">
        <div class="report-badge">
          <i class="${doc.reportIcon || "fas fa-chart-bar"}"></i>
        </div>
        <div class="report-content">
          <h5>${doc.title}</h5>
          <p>${doc.description || ""}</p>
          <div class="report-meta">
            ${doc.pubDate ? `<span class="date">Publié le : ${doc.pubDate}</span>` : ""}
            ${doc.pages ? `<span class="pages">${doc.pages}</span>` : ""}
          </div>
          <div class="report-actions">
            <a href="${doc.url || "#"}" class="btn btn-primary" ${doc.url && doc.url !== "#" ? 'target="_blank"' : ""}>Télécharger</a>
            <a href="${doc.previewUrl || "#"}" class="btn btn-outline-primary" ${doc.previewUrl && doc.previewUrl !== "#" ? 'target="_blank"' : ""}>Lire en ligne</a>
          </div>
        </div>
      </div>
    </div>
  `,
    )
    .join("");
}

// ---- INIT ----
const documentsPage = {
  init: function () {
    renderFormulaires();
    renderAppelsOffres();
    renderRapports();
    this.bindFilters();
    this.initSmoothScroll();
    console.log("Documents page initialisée (données dynamiques)");
  },

  bindFilters: function () {
    const statusFilter = document.getElementById("tenderStatus");
    const searchInput = document.getElementById("tenderSearch");

    if (statusFilter)
      statusFilter.addEventListener("change", () => this.applyTenderFilters());
    if (searchInput)
      searchInput.addEventListener("input", () => this.applyTenderFilters());
  },

  applyTenderFilters: function () {
    const status = document.getElementById("tenderStatus")?.value || "";
    const search = document.getElementById("tenderSearch")?.value || "";
    renderAppelsOffres(status, search);
  },

  initSmoothScroll: function () {
    document
      .querySelectorAll(".documents-nav a, .panel-submenu a[href^='#']")
      .forEach((link) => {
        link.addEventListener("click", function (e) {
          const href = this.getAttribute("href");
          if (href && href.startsWith("#")) {
            e.preventDefault();
            const target = document.getElementById(href.substring(1));
            if (target) {
              window.scrollTo({
                top: target.offsetTop - 100,
                behavior: "smooth",
              });
              history.pushState(null, null, href);
            }
          }
        });
      });

    if (window.location.hash) {
      const target = document.getElementById(window.location.hash.substring(1));
      if (target)
        setTimeout(
          () =>
            window.scrollTo({
              top: target.offsetTop - 100,
              behavior: "smooth",
            }),
          500,
        );
    }
  },
};

document.addEventListener("DOMContentLoaded", function () {
  documentsPage.init();

  if (window.chuApp) {
    console.log("Application CHU initialisée sur la page documents");
    setTimeout(() => {
      if (window.chuApp.languageManager) {
        window.chuApp.languageManager.updateContent();
        window.chuApp.languageManager.updateLogos();
      }
    }, 100);
  }

  const langSelect = document.getElementById("languageSelector");
  if (langSelect && window.chuApp) {
    langSelect.value = window.chuApp.languageManager.getCurrentLanguage();
    langSelect.addEventListener("change", function () {
      window.chuApp.languageManager.setLanguage(this.value);
    });
  }
});

window.documentsPage = documentsPage;
