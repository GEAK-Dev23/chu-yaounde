/**
 * ================================================
 * CHU YAOUNDÉ — PAGE ESPACE ÉTUDIANT
 * Stages, Formations, Concours — chargés depuis l'API
 * ================================================
 */

const API_BASE =
  (window.CHU_CONFIG && window.CHU_CONFIG.apiUrl) ||
  "http://localhost:5000/api";

// ================================================
// UTILITAIRES COMMUNS
// ================================================

function escH(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function resolveUrl(url) {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return "http://localhost:5000" + (url.startsWith("/") ? "" : "/") + url;
}

function showSection(sectionId, html) {
  const el = document.getElementById(sectionId);
  if (el) el.innerHTML = html;
}

/**
 * Ouvre un mailto via window.location.href pour contourner
 * les restrictions de Bootstrap Modal sur les <a href="mailto:">
 */
function openMailto(email, subject) {
  const dest = email || "chudeyaounde@gmail.com";
  window.location.href =
    "mailto:" + dest + "?subject=" + encodeURIComponent(subject);
}

/**
 * Télécharge un PDF via fetch + Blob pour contourner
 * les restrictions cross-origin sur l'attribut download
 */
async function downloadPdf(url, filename) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Fichier inaccessible");
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = filename || "programme.pdf";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
  } catch (err) {
    // Fallback : ouvrir dans un nouvel onglet
    window.open(url, "_blank");
  }
}

// ================================================
// SECTION STAGES
// ================================================

async function loadStages() {
  showSection(
    "stages-container",
    `<div class="col-12 text-center py-4">
       <i class="fas fa-circle-notch fa-spin fa-2x text-primary mb-3"></i>
       <p class="text-muted">Chargement des stages...</p>
     </div>`,
  );

  try {
    const res = await fetch(API_BASE + "/internships");
    const data = await res.json();

    if (!data.success || !data.data.length) {
      showSection(
        "stages-container",
        `<div class="col-12 text-center py-5">
           <i class="fas fa-briefcase fa-3x text-muted mb-3"></i>
           <h5 class="text-muted">Aucune offre de stage disponible pour le moment</h5>
           <p class="text-muted">Revenez bientôt pour découvrir nos prochaines offres.</p>
         </div>`,
      );
      return;
    }

    showSection(
      "stages-container",
      data.data
        .map(function (s) {
          return (
            '<div class="col-lg-4 col-md-6 mb-4">' +
            '<div class="stage-card">' +
            '<div class="stage-header">' +
            '<i class="fas ' +
            escH(s.icon || "fa-stethoscope") +
            ' stage-icon"></i>' +
            "<h4>" +
            escH(s.title) +
            "</h4>" +
            "</div>" +
            '<div class="stage-body">' +
            "<p>" +
            escH(s.description) +
            "</p>" +
            '<ul class="stage-features">' +
            (s.duration
              ? '<li><i class="fas fa-clock me-1 text-primary"></i>Dur\u00e9e\u00a0: ' +
                escH(s.duration) +
                "</li>"
              : "") +
            (s.level
              ? '<li><i class="fas fa-user-graduate me-1 text-primary"></i>Niveau\u00a0: ' +
                escH(s.level) +
                "</li>"
              : "") +
            (s.supervision
              ? '<li><i class="fas fa-user-tie me-1 text-primary"></i>Encadrement\u00a0: ' +
                escH(s.supervision) +
                "</li>"
              : "") +
            "</ul>" +
            '<div class="stage-actions">' +
            '<button class="btn btn-outline-primary btn-sm" onclick="openStageDetails(\'' +
            escH(s._id) +
            "')\">" +
            '<i class="fas fa-info-circle me-1"></i>Plus d\'infos' +
            "</button>" +
            '<button class="btn btn-primary btn-sm" onclick="openStageApply(\'' +
            escH(s._id) +
            "','" +
            escH(s.title) +
            "','" +
            escH(s.applyEmail || "") +
            "','" +
            escH(s.applyLink || "") +
            "')\">" +
            '<i class="fas fa-paper-plane me-1"></i>Postuler' +
            "</button>" +
            "</div>" +
            "</div>" +
            "</div>" +
            "</div>"
          );
        })
        .join(""),
    );
  } catch (err) {
    console.error("Erreur stages:", err);
    showSection(
      "stages-container",
      '<div class="col-12 text-center py-4 text-muted">' +
        '<i class="fas fa-exclamation-triangle fa-2x mb-2"></i>' +
        "<p>Impossible de charger les stages.</p>" +
        '<button class="btn btn-outline-primary btn-sm" onclick="loadStages()">' +
        '<i class="fas fa-redo me-1"></i>R\u00e9essayer' +
        "</button>" +
        "</div>",
    );
  }
}

async function openStageDetails(id) {
  try {
    const res = await fetch(API_BASE + "/internships/" + id);
    const data = await res.json();
    if (!data.success) return;
    var s = data.data;

    document.getElementById("stageDetailTitle").textContent = s.title;
    document.getElementById("stageDetailBody").innerHTML =
      "<p>" +
      escH(s.description) +
      "</p>" +
      (s.details ? '<p class="mt-2">' + escH(s.details) + "</p>" : "") +
      '<ul class="mt-3 list-unstyled">' +
      (s.duration
        ? '<li class="mb-1"><i class="fas fa-clock me-2 text-primary"></i><strong>Dur\u00e9e :</strong> ' +
          escH(s.duration) +
          "</li>"
        : "") +
      (s.level
        ? '<li class="mb-1"><i class="fas fa-user-graduate me-2 text-primary"></i><strong>Niveau requis :</strong> ' +
          escH(s.level) +
          "</li>"
        : "") +
      (s.supervision
        ? '<li class="mb-1"><i class="fas fa-user-tie me-2 text-primary"></i><strong>Encadrement :</strong> ' +
          escH(s.supervision) +
          "</li>"
        : "") +
      "</ul>";

    var modal = document.getElementById("stageDetailModal");
    modal.setAttribute("data-email", s.applyEmail || "");
    modal.setAttribute("data-link", s.applyLink || "");
    modal.setAttribute("data-title", s.title);

    new bootstrap.Modal(modal).show();
  } catch (err) {
    console.error("Erreur détail stage:", err);
  }
}

function stageDetailApply() {
  var modal = document.getElementById("stageDetailModal");
  var link = modal.getAttribute("data-link");
  var email = modal.getAttribute("data-email");
  var title = modal.getAttribute("data-title");
  if (link) {
    window.open(link, "_blank");
  } else {
    openMailto(email, "Candidature stage - " + title);
  }
}

function openStageApply(id, title, email, link) {
  document.getElementById("stageApplyTitle").textContent = title;
  var modal = document.getElementById("stageApplyModal");
  modal.setAttribute("data-email", email);
  modal.setAttribute("data-link", link);
  modal.setAttribute("data-title", title);
  new bootstrap.Modal(modal).show();
}

function stageDoApply() {
  var modal = document.getElementById("stageApplyModal");
  var link = modal.getAttribute("data-link");
  var email = modal.getAttribute("data-email");
  var title = modal.getAttribute("data-title");
  if (link) {
    window.open(link, "_blank");
  } else {
    openMailto(email, "Candidature stage - " + title);
  }
}

// ================================================
// SECTION FORMATIONS
// ================================================

async function loadFormations() {
  showSection(
    "formations-container",
    '<div class="col-12 text-center py-4">' +
      '<i class="fas fa-circle-notch fa-spin fa-2x text-primary mb-3"></i>' +
      '<p class="text-muted">Chargement des formations...</p>' +
      "</div>",
  );

  try {
    var res = await fetch(API_BASE + "/trainings");
    var data = await res.json();

    if (!data.success || !data.data.length) {
      showSection(
        "formations-container",
        '<div class="col-12 text-center py-5">' +
          '<i class="fas fa-graduation-cap fa-3x text-muted mb-3"></i>' +
          '<h5 class="text-muted">Aucune formation disponible pour le moment</h5>' +
          '<p class="text-muted">Revenez bient\u00f4t pour d\u00e9couvrir nos prochaines sessions.</p>' +
          "</div>",
      );
      return;
    }

    showSection(
      "formations-container",
      data.data
        .map(function (t) {
          var imgHtml = t.image
            ? '<img src="' +
              resolveUrl(t.image) +
              '" alt="' +
              escH(t.title) +
              '" class="adaptive-image" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\';">'
            : "";
          return (
            '<div class="col-lg-6 mb-4">' +
            '<div class="formation-card">' +
            '<div class="formation-image">' +
            imgHtml +
            '<div class="image-placeholder" style="' +
            (t.image ? "display:none" : "display:flex") +
            '">' +
            '<i class="fas fa-graduation-cap fa-3x"></i>' +
            "</div>" +
            "</div>" +
            '<div class="formation-content">' +
            '<span class="formation-category">' +
            escH(t.category) +
            "</span>" +
            "<h4>" +
            escH(t.title) +
            "</h4>" +
            "<p>" +
            escH(t.description) +
            "</p>" +
            '<div class="formation-meta">' +
            (t.duration
              ? '<span><i class="fas fa-clock me-1"></i>Dur\u00e9e\u00a0: ' +
                escH(t.duration) +
                "</span>"
              : "") +
            (t.places
              ? '<span><i class="fas fa-users me-1"></i>Places\u00a0: ' +
                t.places +
                "</span>"
              : "") +
            (t.nextSession
              ? '<span><i class="fas fa-calendar me-1"></i>Prochaine session\u00a0: ' +
                escH(t.nextSession) +
                "</span>"
              : "") +
            "</div>" +
            '<button class="btn btn-primary mt-3" onclick="openFormationRegister(\'' +
            escH(t.title) +
            "','" +
            escH(t.duration || "") +
            "','" +
            (t.places || "") +
            "','" +
            escH(t.nextSession || "") +
            "','" +
            escH(t.registerEmail || "") +
            "','" +
            escH(t.registerLink || "") +
            "')\">" +
            '<i class="fas fa-pen me-1"></i>S\'inscrire' +
            "</button>" +
            "</div>" +
            "</div>" +
            "</div>"
          );
        })
        .join(""),
    );
  } catch (err) {
    console.error("Erreur formations:", err);
    showSection(
      "formations-container",
      '<div class="col-12 text-center py-4 text-muted">' +
        '<i class="fas fa-exclamation-triangle fa-2x mb-2"></i>' +
        "<p>Impossible de charger les formations.</p>" +
        '<button class="btn btn-outline-primary btn-sm" onclick="loadFormations()">' +
        '<i class="fas fa-redo me-1"></i>R\u00e9essayer' +
        "</button>" +
        "</div>",
    );
  }
}

function openFormationRegister(
  title,
  duration,
  places,
  nextSession,
  email,
  link,
) {
  document.getElementById("formationRegisterTitle").textContent = title;
  var parts = [];
  if (duration) parts.push("Dur\u00e9e : " + duration);
  if (places) parts.push("Places : " + places);
  if (nextSession) parts.push("Prochaine session : " + nextSession);
  document.getElementById("formationRegisterMeta").textContent =
    parts.join(" \u00b7 ");

  var modal = document.getElementById("formationRegisterModal");
  modal.setAttribute("data-email", email);
  modal.setAttribute("data-link", link);
  modal.setAttribute("data-title", title);
  new bootstrap.Modal(modal).show();
}

function formationDoRegister() {
  var modal = document.getElementById("formationRegisterModal");
  var link = modal.getAttribute("data-link");
  var email = modal.getAttribute("data-email");
  var title = modal.getAttribute("data-title");
  if (link) {
    window.open(link, "_blank");
  } else {
    openMailto(email, "Inscription formation - " + title);
  }
}

// ================================================
// SECTION CONCOURS
// ================================================

var CONTEST_STATUS = {
  open: { label: "Inscriptions ouvertes", css: "bg-success" },
  soon: { label: "Bient\u00f4t", css: "bg-info" },
  closed: { label: "Cl\u00f4tur\u00e9", css: "bg-secondary" },
};

async function loadConcours() {
  showSection(
    "concours-container",
    '<div class="col-12 text-center py-4">' +
      '<i class="fas fa-circle-notch fa-spin fa-2x text-primary mb-3"></i>' +
      '<p class="text-muted">Chargement des concours...</p>' +
      "</div>",
  );

  try {
    var res = await fetch(API_BASE + "/contests");
    var data = await res.json();

    if (!data.success || !data.data.length) {
      showSection(
        "concours-container",
        '<div class="col-12 text-center py-5">' +
          '<i class="fas fa-file-alt fa-3x text-muted mb-3"></i>' +
          '<h5 class="text-muted">Aucun concours disponible pour le moment</h5>' +
          '<p class="text-muted">Revenez bient\u00f4t pour d\u00e9couvrir les prochains concours.</p>' +
          "</div>",
      );
      return;
    }

    showSection(
      "concours-container",
      data.data
        .map(function (c) {
          var st = CONTEST_STATUS[c.status] || CONTEST_STATUS.soon;
          var isClosed = c.status === "closed";
          return (
            '<div class="col-lg-6 mb-4">' +
            '<div class="exam-card">' +
            '<div class="exam-header">' +
            '<i class="fas ' +
            escH(c.icon || "fa-file-medical") +
            ' exam-icon"></i>' +
            "<div>" +
            "<h4>" +
            escH(c.title) +
            "</h4>" +
            '<span class="exam-status badge ' +
            st.css +
            '">' +
            st.label +
            "</span>" +
            "</div>" +
            "</div>" +
            '<div class="exam-body">' +
            "<p>" +
            escH(c.description) +
            "</p>" +
            '<div class="exam-details">' +
            (c.examDate
              ? '<div class="exam-detail"><i class="fas fa-calendar-alt"></i><span>Date de l\'épreuve : <strong>' +
                escH(c.examDate) +
                "</strong></span></div>"
              : "") +
            (c.registrationDeadline
              ? '<div class="exam-detail"><i class="fas fa-clock"></i><span>Date limite d\'inscription : <strong>' +
                escH(c.registrationDeadline) +
                "</strong></span></div>"
              : "") +
            (c.subjects
              ? '<div class="exam-detail"><i class="fas fa-book"></i><span>Mati\u00e8res / Sp\u00e9cialit\u00e9s : ' +
                escH(c.subjects) +
                "</span></div>"
              : "") +
            "</div>" +
            '<div class="exam-actions">' +
            '<button class="btn btn-primary' +
            (isClosed ? " disabled" : "") +
            '" ' +
            (isClosed ? "disabled" : "") +
            " onclick=\"openConcoursRegister('" +
            escH(c.title) +
            "','" +
            escH(c.examDate || "") +
            "','" +
            escH(c.registrationDeadline || "") +
            "','" +
            escH(c.registerEmail || "") +
            "','" +
            escH(c.registerLink || "") +
            "')\">" +
            '<i class="fas fa-pen me-1"></i>' +
            (isClosed ? "Inscriptions ferm\u00e9es" : "S'inscrire") +
            "</button> " +
            '<button class="btn btn-outline-primary' +
            (!c.programPdf ? " disabled" : "") +
            '" ' +
            (!c.programPdf
              ? 'disabled title="Aucun programme disponible"'
              : "") +
            " onclick=\"openConcoursPdf('" +
            escH(c.title) +
            "','" +
            escH(c.programPdf || "") +
            "')\">" +
            '<i class="fas fa-file-pdf me-1"></i>T\u00e9l\u00e9charger le programme' +
            "</button>" +
            "</div>" +
            "</div>" +
            "</div>" +
            "</div>"
          );
        })
        .join(""),
    );
  } catch (err) {
    console.error("Erreur concours:", err);
    showSection(
      "concours-container",
      '<div class="col-12 text-center py-4 text-muted">' +
        '<i class="fas fa-exclamation-triangle fa-2x mb-2"></i>' +
        "<p>Impossible de charger les concours.</p>" +
        '<button class="btn btn-outline-primary btn-sm" onclick="loadConcours()">' +
        '<i class="fas fa-redo me-1"></i>R\u00e9essayer' +
        "</button>" +
        "</div>",
    );
  }
}

function openConcoursRegister(title, examDate, deadline, email, link) {
  document.getElementById("concoursRegisterTitle").textContent = title;
  var parts = [];
  if (examDate) parts.push("\u00c9preuve : " + examDate);
  if (deadline) parts.push("Limite d'inscription : " + deadline);
  document.getElementById("concoursRegisterMeta").textContent =
    parts.join(" \u00b7 ");

  var modal = document.getElementById("concoursRegisterModal");
  modal.setAttribute("data-email", email);
  modal.setAttribute("data-link", link);
  modal.setAttribute("data-title", title);
  new bootstrap.Modal(modal).show();
}

function concoursDoRegister() {
  var modal = document.getElementById("concoursRegisterModal");
  var link = modal.getAttribute("data-link");
  var email = modal.getAttribute("data-email");
  var title = modal.getAttribute("data-title");
  if (link) {
    window.open(link, "_blank");
  } else {
    openMailto(email, "Inscription concours - " + title);
  }
}

function openConcoursPdf(title, pdfPath) {
  if (!pdfPath) return;
  document.getElementById("concoursPdfTitle").textContent = title;
  var modal = document.getElementById("concoursPdfModal");
  modal.setAttribute("data-pdf", resolveUrl(pdfPath));
  modal.setAttribute("data-title", title);
  new bootstrap.Modal(modal).show();
}

function concoursDoPdfDownload() {
  var modal = document.getElementById("concoursPdfModal");
  var url = modal.getAttribute("data-pdf");
  var title = modal.getAttribute("data-title");
  var filename = title.replace(/\s+/g, "_") + "_programme.pdf";
  downloadPdf(url, filename);
}

// ================================================
// INIT
// ================================================

document.addEventListener("DOMContentLoaded", function () {
  loadStages();
  loadFormations();
  loadConcours();
});
