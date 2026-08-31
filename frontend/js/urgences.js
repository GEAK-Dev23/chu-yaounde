// GESTION DE LA PAGE URGENCES
class UrgencesPage {
  constructor() {
    this.waitTime = 25;
    this.emergencyStatus = "open";
    this.init();
  }

  async init() {
    this.setupEmergencyStatus();
    this.setupEmergencyActions();
    this.setupWaitTimeUpdates();
    this.setupEmergencyGuide();
    this.setupScrollAnimations();
    this.setupEmergencyCases();
  }

  setupEmergencyStatus() {
    // Mettre à jour le statut des urgences
    this.updateEmergencyStatus();

    // Vérifier périodiquement le statut
    setInterval(() => {
      this.updateEmergencyStatus();
    }, 30000); // Toutes les 30 secondes
  }

  updateEmergencyStatus() {
    // Simulation - À remplacer par appel API
    const status = Math.random() > 0.1 ? "open" : "busy";
    this.emergencyStatus = status;

    const statusElement = document.querySelector(".status-indicator");
    if (statusElement) {
      const dot = statusElement.querySelector(".fa-circle");
      const text = statusElement.querySelector("span");

      if (status === "open") {
        dot.style.color = "#4CAF50";
        text.textContent =
          chuApp.languageManager.getCurrentLanguage() === "fr"
            ? "Ouvert"
            : "Open";
      } else {
        dot.style.color = "#FF9800";
        text.textContent =
          chuApp.languageManager.getCurrentLanguage() === "fr"
            ? "Très occupé"
            : "Very busy";
      }
    }
  }

  setupEmergencyActions() {
    // Gestion des actions d'urgence
    document.addEventListener("click", (e) => {
      if (
        e.target.closest(".btn-danger") ||
        e.target.closest('[onclick*="callEmergency"]')
      ) {
        this.callEmergency();
      }
    });
  }

  callEmergency() {
    // Simulation d'appel d'urgence
    if (
      confirm(
        chuApp.languageManager.getCurrentLanguage() === "fr"
          ? "Composer le numéro d'urgence 651 94 80 64 ?"
          : "Call emergency number 651 94 80 64?",
      )
    ) {
      // En environnement mobile, composer le numéro
      if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
        window.location.href = "tel:+237651948064";
      } else {
        chuApp.showNotification(
          chuApp.languageManager.getCurrentLanguage() === "fr"
            ? "Numéro d'urgence : 651 94 80 64 - Veuillez composer ce numéro depuis votre téléphone"
            : "Emergency number: 651 94 80 64 - Please dial this number from your phone",
          "info",
          5000,
        );
      }

      this.trackEvent("emergency_call");
    }
  }

  setupWaitTimeUpdates() {
    // Mettre à jour le temps d'attente
    this.updateWaitTime();

    setInterval(() => {
      this.updateWaitTime();
    }, 60000); // Toutes les minutes
  }

  updateWaitTime() {
    // Simulation de variation du temps d'attente
    const variation = Math.floor(Math.random() * 10) - 5; // -5 à +5 minutes
    this.waitTime = Math.max(15, Math.min(45, this.waitTime + variation));

    const waitTimeElement = document.getElementById("waitTime");
    if (waitTimeElement) {
      waitTimeElement.textContent = `${this.waitTime} minutes`;
    }
  }

  setupEmergencyGuide() {
    // Préparer le contenu du guide d'urgence
    this.emergencyGuideContent = {
      fr: {
        title: "Guide des Urgences",
        sections: [
          {
            title: "Quand venir aux urgences ?",
            content:
              "Les urgences sont destinées aux situations médicales graves et potentiellement mortelles qui nécessitent une attention immédiate.",
          },
          {
            title: "Procédure à suivre",
            content:
              "1. Présentez-vous à l'accueil des urgences\n2. L'infirmière de triage vous évaluera\n3. Attente selon le niveau de priorité\n4. Prise en charge médicale",
          },
          {
            title: "Documents à apporter",
            content:
              "- Carte d'identité\n- Carte d'assurance maladie\n- Dossier médical\n- Liste des médicaments",
          },
          {
            title: "Numéros d'urgence",
            content:
              "Urgences médicales : 651 94 80 64\nPompiers : 118\nPolice : 117",
          },
        ],
      },
      en: {
        title: "Emergency Guide",
        sections: [
          {
            title: "When to come to emergency?",
            content:
              "Emergency department is for serious and potentially life-threatening medical situations that require immediate attention.",
          },
          {
            title: "Procedure to follow",
            content:
              "1. Go to emergency reception\n2. Triage nurse will assess you\n3. Wait according to priority level\n4. Medical care",
          },
          {
            title: "Documents to bring",
            content:
              "- ID card\n- Health insurance card\n- Medical records\n- Medication list",
          },
          {
            title: "Emergency numbers",
            content:
              "Medical emergency: 651 94 80 64\nFire department: 118\nPolice: 117",
          },
        ],
      },
    };
  }

  showEmergencyGuide() {
    const modal = new bootstrap.Modal(
      document.getElementById("emergencyGuideModal"),
    );
    const contentElement = document.getElementById("emergencyGuideContent");
    const lang = chuApp.languageManager.getCurrentLanguage();
    const guide =
      this.emergencyGuideContent[lang] || this.emergencyGuideContent.fr;

    contentElement.innerHTML = `
            <div class="emergency-guide">
                ${guide.sections
                  .map(
                    (section) => `
                    <div class="guide-section mb-4">
                        <h5 class="text-primary">${section.title}</h5>
                        <p class="text-muted">${section.content.replace(/\n/g, "<br>")}</p>
                    </div>
                `,
                  )
                  .join("")}
            </div>
        `;

    modal.show();
    this.trackEvent("emergency_guide_view");
  }

  showDirections() {
    // Simulation d'affichage d'itinéraire
    const address = "CHU Yaoundé, Yaoundé, Cameroun";

    if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
      // Ouvrir l'application de navigation
      window.open(
        `https://maps.google.com/?q=${encodeURIComponent(address)}`,
        "_blank",
      );
    } else {
      // Ouvrir Google Maps dans un nouvel onglet
      window.open(
        `https://maps.google.com/?q=${encodeURIComponent(address)}`,
        "_blank",
      );
    }

    this.trackEvent("emergency_directions");
  }

  setupEmergencyCases() {
    // Ajouter des interactions aux cartes de cas d'urgence
    document.querySelectorAll(".emergency-case-card").forEach((card) => {
      card.addEventListener("click", (e) => {
        if (!e.target.closest("a") && !e.target.closest("button")) {
          const caseType = Array.from(card.classList).find(
            (cls) =>
              cls.includes("cardiac") ||
              cls.includes("trauma") ||
              cls.includes("neurological"),
          );

          if (caseType) {
            this.showCaseDetails(caseType);
          }
        }
      });
    });
  }

  showCaseDetails(caseType) {
    const caseDetails = {
      cardiac: {
        fr: {
          title: "Urgence Cardiaque",
          description:
            "Les symptômes cardiaques nécessitent une attention immédiate. Ne retardez pas la prise en charge.",
          actions: [
            "Appelez immédiatement le 651 94 80 64",
            "Restez calme et asseyez-vous",
            "Ne conduisez pas vous-même",
            "Informez le personnel des symptômes",
          ],
        },
        en: {
          title: "Cardiac Emergency",
          description:
            "Cardiac symptoms require immediate attention. Do not delay care.",
          actions: [
            "Call 651 94 80 64 immediately",
            "Stay calm and sit down",
            "Do not drive yourself",
            "Inform staff of symptoms",
          ],
        },
      },
      trauma: {
        fr: {
          title: "Traumatisme",
          description:
            "Les traumatismes graves peuvent mettre la vie en danger. Une prise en charge rapide est essentielle.",
          actions: [
            "Appelez le 651 94 80 64 pour les traumatismes graves",
            "Ne déplacez pas la personne si blessure spinale suspectée",
            "Contrôlez les saignements avec pression",
            "Gardez la personne au chaud",
          ],
        },
        en: {
          title: "Trauma",
          description:
            "Serious trauma can be life-threatening. Rapid care is essential.",
          actions: [
            "Call 651 94 80 64 for serious trauma",
            "Do not move person if spinal injury suspected",
            "Control bleeding with pressure",
            "Keep person warm",
          ],
        },
      },
      neurological: {
        fr: {
          title: "Urgence Neurologique",
          description:
            "Les symptômes neurologiques soudains peuvent indiquer un AVC ou autre condition grave.",
          actions: [
            "Appelez le 651 94 80 64 immédiatement",
            "Notez l'heure d'apparition des symptômes",
            "Ne donnez rien à manger ou boire",
            "Surveillez l'état de conscience",
          ],
        },
        en: {
          title: "Neurological Emergency",
          description:
            "Sudden neurological symptoms may indicate stroke or other serious condition.",
          actions: [
            "Call 651 94 80 64 immediately",
            "Note time symptoms started",
            "Do not give food or drink",
            "Monitor consciousness",
          ],
        },
      },
    };

    const lang = chuApp.languageManager.getCurrentLanguage();
    const details = caseDetails[caseType][lang] || caseDetails[caseType].fr;

    chuApp.showNotification(
      `
            <strong>${details.title}</strong><br>
            ${details.description}<br><br>
            <strong>Actions:</strong><br>
            ${details.actions.map((action) => `• ${action}`).join("<br>")}
        `,
      "warning",
      8000,
    );

    this.trackEvent("emergency_case_view", { case_type: caseType });
  }

  setupScrollAnimations() {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.style.opacity = "1";
            entry.target.style.transform = "translateY(0)";
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 },
    );

    // Animer les éléments au défilement
    document
      .querySelectorAll(
        ".priority-item, .step, .info-card-large, .emergency-case-card",
      )
      .forEach((el) => {
        el.style.opacity = "0";
        el.style.transform = "translateY(30px)";
        el.style.transition = "all 0.6s ease";
        observer.observe(el);
      });
  }

  trackEvent(action, params = {}) {
    if (typeof gtag !== "undefined") {
      gtag("event", action, {
        event_category: "urgences_page",
        ...params,
      });
    }
  }
}

// Initialisation page urgences
const urgencesPage = new UrgencesPage();

// Gestion des urgences vitales - Fonction globale accessible
window.handleEmergency = function (emergencyType) {
  switch (emergencyType) {
    case "cardiac":
      urgencesPage.showCaseDetails("cardiac");
      break;
    case "trauma":
      urgencesPage.showCaseDetails("trauma");
      break;
    case "neurological":
      urgencesPage.showCaseDetails("neurological");
      break;
    default:
      urgencesPage.callEmergency();
  }
};

// Raccourci clavier pour les urgences
document.addEventListener("keydown", (e) => {
  if (e.ctrlKey && e.key === "e") {
    e.preventDefault();
    urgencesPage.callEmergency();
  }
});
