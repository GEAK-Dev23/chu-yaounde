// GESTION DE LA PAGE PRÉSENTATION
class PresentationPage {
  constructor() {
    this.currentSection = "histoire";
    this.init();
  }

  async init() {
    this.setupSectionNavigation();
    this.setupScrollAnimations();
    this.setupStatsAnimation();
    this.setupInteractiveElements();
    this.setupOrganizationChart();
    this.loadPresentationData();
  }

  setupSectionNavigation() {
    const navItems = document.querySelectorAll(".presentation-nav .nav-item");
    navItems.forEach((item) => {
      item.addEventListener("click", (e) => {
        e.preventDefault();

        // Mettre à jour l'état actif
        navItems.forEach((nav) => nav.classList.remove("active"));
        item.classList.add("active");

        // Faire défiler vers la section
        const targetId = item.getAttribute("href").substring(1);
        this.scrollToSection(targetId);
      });
    });
  }

  scrollToSection(sectionId) {
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
      const offsetTop = targetSection.offsetTop - 100;
      window.scrollTo({
        top: offsetTop,
        behavior: "smooth",
      });

      this.currentSection = sectionId;
      this.trackEvent("section_navigation", { section: sectionId });
    }
  }

  setupScrollAnimations() {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.style.opacity = "1";
            entry.target.style.transform = "translateY(0)";

            // Animation spécifique pour les barres de statistiques
            if (entry.target.classList.contains("bar-fill")) {
              const width = entry.target.style.width;
              entry.target.style.width = "0";
              setTimeout(() => {
                entry.target.style.width = width;
              }, 300);
            }

            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 },
    );

    // Animer les éléments au défilement
    const animatedElements = document.querySelectorAll(
      ".timeline-item, .mission-card, .value-item, .org-card, " +
        ".figure-card, .equipment-card, .partner-card, .stats-chart, " +
        ".stats-info, .digital-features .feature-item",
    );

    animatedElements.forEach((el) => {
      el.style.opacity = "0";
      el.style.transform = "translateY(30px)";
      el.style.transition = "all 0.6s ease";
      observer.observe(el);
    });

    // Observer spécifique pour les barres de statistiques
    const barObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const bars = entry.target.querySelectorAll(".bar-fill");
            bars.forEach((bar, index) => {
              setTimeout(() => {
                const width = bar.getAttribute("data-percentage");
                bar.style.width = width;
              }, index * 200);
            });
            barObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 },
    );

    const chartSection = document.querySelector(".stats-chart");
    if (chartSection) {
      barObserver.observe(chartSection);
    }
  }

  setupStatsAnimation() {
    // Animation des chiffres clés
    const figureCards = document.querySelectorAll(".figure-card h3");
    figureCards.forEach((card) => {
      this.animateValue(card);
    });
  }

  animateValue(element) {
    const finalValue = parseInt(
      element.textContent.replace("+", "").replace(",", ""),
    );
    const duration = 2000;
    const steps = 60;
    const stepValue = finalValue / steps;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const currentValue = Math.min(
        Math.floor(stepValue * currentStep),
        finalValue,
      );

      if (element.textContent.includes("+")) {
        element.textContent = currentValue.toLocaleString() + "+";
      } else if (element.textContent.includes("/")) {
        element.textContent = currentValue + "/7";
      } else {
        element.textContent = currentValue.toLocaleString();
      }

      if (currentStep >= steps) {
        clearInterval(timer);
      }
    }, duration / steps);
  }

  setupInteractiveElements() {
    // Interactions avec les cartes de mission
    document.querySelectorAll(".mission-card").forEach((card) => {
      card.addEventListener("mouseenter", () => {
        const icon = card.querySelector(".mission-icon");
        if (icon) {
          icon.style.transform = "scale(1.1) rotate(5deg)";
        }
      });

      card.addEventListener("mouseleave", () => {
        const icon = card.querySelector(".mission-icon");
        if (icon) {
          icon.style.transform = "scale(1) rotate(0deg)";
        }
      });
    });

    // Interactions avec l'organigramme
    document.querySelectorAll(".org-card").forEach((card) => {
      card.addEventListener("click", () => {
        const title = card.querySelector("h4, h5, h6")?.textContent;
        const role = card.querySelector("p, small")?.textContent;

        if (title && role) {
          this.showOrgDetails(title, role);
        }
      });
    });
  }

  setupOrganizationChart() {
    // Animation de l'organigramme avec délais progressifs
    const orgLevels = document.querySelectorAll(".org-level");
    orgLevels.forEach((level, levelIndex) => {
      level.style.opacity = "0";
      level.style.transform = "translateY(20px)";

      setTimeout(() => {
        level.style.opacity = "1";
        level.style.transform = "translateY(0)";
        level.style.transition = "all 0.6s ease";

        // Animer les cartes à l'intérieur de chaque niveau
        const cards = level.querySelectorAll(".org-card");
        cards.forEach((card, cardIndex) => {
          card.style.opacity = "0";
          card.style.transform = "translateY(20px)";

          setTimeout(() => {
            card.style.opacity = "1";
            card.style.transform = "translateY(0)";
            card.style.transition = "all 0.4s ease";
          }, cardIndex * 100);
        });
      }, levelIndex * 400);
    });
  }

  showOrgDetails(title, role) {
    const modalContent = `
            <div class="org-details-modal">
                <h4>${title}</h4>
                <p><strong>Rôle:</strong> ${role}</p>
                <p><strong>Responsabilités:</strong> Gestion et coordination des activités liées à ce poste.</p>
                <p><strong>Contact:</strong> ${this.generateEmail(title)}</p>
            </div>
        `;

    if (typeof chuApp !== "undefined" && chuApp.showNotification) {
      chuApp.showNotification(modalContent, "info", 5000);
    } else {
      // Fallback si chuApp n'est pas disponible
      alert(
        `${title}\n\nRôle: ${role}\n\nContact: ${this.generateEmail(title)}`,
      );
    }

    this.trackEvent("org_card_click", { title: title, role: role });
  }

  generateEmail(title) {
    // Générer un email basé sur le titre du poste
    const cleanTitle = title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .replace(/\s+/g, ".")
      .trim();
    return "chudeyaounde@gmail.com";
  }

  async loadPresentationData() {
    try {
      // Charger les données de présentation depuis l'API
      if (typeof chuApp !== "undefined" && chuApp.apiCall) {
        const response = await chuApp.apiCall("/presentation/data");
        if (response.data) {
          this.updatePresentationContent(response.data);
        }
      }
    } catch (error) {
      console.error("Erreur chargement données présentation:", error);
      // Utiliser les données par défaut
    }
  }

  updatePresentationContent(data) {
    // Mettre à jour le contenu dynamiquement
    if (data.keyFigures) {
      this.updateKeyFigures(data.keyFigures);
    }

    if (data.equipment) {
      this.updateEquipment(data.equipment);
    }
  }

  updateKeyFigures(figures) {
    // Mettre à jour les chiffres clés
    const figureElements = {
      patients: ".figure-card:nth-child(1) h3",
      professionals: ".figure-card:nth-child(2) h3",
      beds: ".figure-card:nth-child(3) h3",
      specialties: ".figure-card:nth-child(4) h3",
      emergency: ".figure-card:nth-child(5) h3",
      students: ".figure-card:nth-child(6) h3",
    };

    Object.keys(figures).forEach((key) => {
      const selector = figureElements[key];
      if (selector) {
        const element = document.querySelector(selector);
        if (element) {
          element.textContent = figures[key];
          this.animateValue(element);
        }
      }
    });
  }

  updateEquipment(equipment) {
    // Mettre à jour la section équipements
    console.log("Équipements chargés:", equipment);
    // Implémentation spécifique selon la structure des données
  }

  // Gestion du responsive
  setupResponsiveBehavior() {
    this.handleResize();
    window.addEventListener(
      "resize",
      this.debounce(() => {
        this.handleResize();
      }, 250),
    );
  }

  handleResize() {
    const isMobile = window.innerWidth < 768;

    // Ajustements spécifiques pour mobile
    if (isMobile) {
      document.body.classList.add("mobile-view");
    } else {
      document.body.classList.remove("mobile-view");
    }
  }

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

  trackEvent(action, params = {}) {
    if (typeof gtag !== "undefined") {
      gtag("event", action, {
        event_category: "presentation_page",
        ...params,
      });
    }
  }

  // Export des données pour d'autres modules
  getPresentationData() {
    return {
      sections: [
        "histoire",
        "mission",
        "organigramme",
        "chiffres",
        "equipements",
        "partenaires",
      ],
      currentSection: this.currentSection,
      stats: {
        patients: 30000,
        professionals: 500,
        beds: 350,
        specialties: 25,
        emergency: "24/7",
        students: 200,
      },
    };
  }
}

// Initialisation page présentation
const presentationPage = new PresentationPage();

// Raccourcis clavier pour la navigation
document.addEventListener("keydown", (e) => {
  if (e.ctrlKey) {
    switch (e.key) {
      case "1":
        e.preventDefault();
        presentationPage.scrollToSection("histoire");
        break;
      case "2":
        e.preventDefault();
        presentationPage.scrollToSection("mission");
        break;
      case "3":
        e.preventDefault();
        presentationPage.scrollToSection("organigramme");
        break;
      case "4":
        e.preventDefault();
        presentationPage.scrollToSection("chiffres");
        break;
    }
  }
});

// Gestion du scroll pour mettre à jour la navigation active
window.addEventListener(
  "scroll",
  presentationPage.debounce(() => {
    const sections = document.querySelectorAll("section[id]");
    const navItems = document.querySelectorAll(".presentation-nav .nav-item");

    let currentSection = "";

    sections.forEach((section) => {
      const sectionTop = section.offsetTop - 150;
      const sectionHeight = section.clientHeight;
      if (
        window.scrollY >= sectionTop &&
        window.scrollY < sectionTop + sectionHeight
      ) {
        currentSection = section.getAttribute("id");
      }
    });

    navItems.forEach((item) => {
      item.classList.remove("active");
      if (item.getAttribute("href") === `#${currentSection}`) {
        item.classList.add("active");
      }
    });
  }, 100),
);
