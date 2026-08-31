/**
 * ================================================
 * CHU YAOUNDÉ — PAGE ACTUALITÉS
 * Connectée à l'API REST backend
 * ================================================
 */

const API_BASE = "http://localhost:5000/api";

class ActualitesPage {
  constructor() {
    this.newsPage = 1;
    this.newsPerPage = 6;
    this.totalNewsPages = 1;
    this.currentCategory = "all";
    this.currentSearch = "";

    this.newsData = [];
    this.eventsData = [];
    this.publicationsData = [];

    this.filters = {
      news: "all",
      events: { type: "all", sort: "date" },
      publications: { specialty: "all", year: "all", type: "all" },
    };

    this.init();
  }

  async init() {
    this.setupSectionNavigation();
    this.setupFilters();
    this.setupSearch();
    this.setupScrollAnimations();
    this.setupEventListeners();
    this.setupNewsletter();
    await this.loadInitialData();
  }

  // ────────────────────────────────────────────
  // NAVIGATION
  // ────────────────────────────────────────────

  setupSectionNavigation() {
    const navItems = document.querySelectorAll(".actualites-nav .nav-item");
    navItems.forEach((item) => {
      item.addEventListener("click", (e) => {
        e.preventDefault();
        navItems.forEach((n) => n.classList.remove("active"));
        item.classList.add("active");
        const targetId = item.getAttribute("href").substring(1);
        this.scrollToSection(targetId);
      });
    });
  }

  scrollToSection(sectionId) {
    const target = document.getElementById(sectionId);
    if (target) {
      window.scrollTo({ top: target.offsetTop - 100, behavior: "smooth" });
    }
  }

  // ────────────────────────────────────────────
  // CHARGEMENT DONNÉES DEPUIS L'API
  // ────────────────────────────────────────────

  async loadInitialData() {
    this.showNewsLoading();
    const urlParams = new URLSearchParams(window.location.search);
    const qParam = urlParams.get("q") ? urlParams.get("q").trim() : "";
    try {
      await Promise.all([
        this.loadNews(1, "all", qParam),
        this.loadEvents(),
        this.loadPublications(),
      ]);
      if (qParam) {
        const searchInput = document.querySelector(".search-box-large input");
        if (searchInput) searchInput.value = qParam;
        this.currentSearch = qParam;
        const newsSection = document.getElementById("news");
        if (newsSection)
          setTimeout(
            () =>
              newsSection.scrollIntoView({
                behavior: "smooth",
                block: "start",
              }),
            300,
          );
      }
    } catch (err) {
      console.error("Erreur chargement initial:", err);
      this.showNewsError();
    }
  }

  async loadNews(page = 1, category = "all", search = "") {
    this.showNewsLoading();
    try {
      // Tout passe par la route principale GET /news avec ?q= pour la recherche
      let url = `${API_BASE}/news?page=${page}&limit=${this.newsPerPage}&sort=-publishedAt&published=true`;
      if (category && category !== "all") url += `&category=${category}`;
      if (search && search.trim() !== "")
        url += `&q=${encodeURIComponent(search.trim())}`;

      const res = await fetch(url);
      const data = await res.json();

      if (!data.success) throw new Error(data.message);

      this.newsData = data.data || [];
      this.totalNewsPages = data.pages || 1;
      this.newsPage = page;

      this.renderFeaturedNews(this.newsData);
      this.renderNewsGrid(this.newsData);
      this.updateLoadMoreBtn();
    } catch (err) {
      console.error("Erreur chargement actualités:", err);
      this.showNewsError();
    }
  }

  async loadEvents() {
    // Les événements sont des actualités de catégorie "evenement"
    try {
      const res = await fetch(
        `${API_BASE}/news?category=evenement&published=true&limit=20&sort=-publishedAt`,
      );
      const data = await res.json();
      this.eventsData = (data.data || []).map((item) => {
        // Utiliser eventStartDate si défini, sinon publishedAt
        const hasEventDate = !!item.eventStartDate;
        const eventDate = item.eventStartDate
          ? new Date(item.eventStartDate)
          : new Date(item.publishedAt || item.createdAt);
        const eventEndDate = item.eventEndDate
          ? new Date(item.eventEndDate)
          : null;
        return {
          id: item._id,
          title: item.title,
          description: item.excerpt || item.content.substring(0, 150) + "...",
          date: eventDate,
          endDate: eventEndDate,
          hasEventDate,
          time: item.eventStartDate
            ? new Date(item.eventStartDate).toLocaleTimeString("fr-FR", {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "Horaire à confirmer",
          location: item.eventLocation || "CHU Yaoundé",
          type: item.eventType || "conference",
          speakers: [],
          capacity: 100,
          registered: item.views || 0,
          image: item.image,
          fullContent: item.content,
        };
      });
      this.displayEvents(this.eventsData);
    } catch (err) {
      console.error("Erreur chargement événements:", err);
      this.displayEventsError();
    }
  }

  async loadPublications() {
    // Les publications sont des actualités de catégorie "formation" ou "medical"
    try {
      const res = await fetch(
        `${API_BASE}/news?category=publication&published=true&limit=20&sort=-publishedAt`,
      );
      const data = await res.json();
      this.publicationsData = (data.data || []).map((item) => ({
        id: item._id,
        title: item.title,
        authors: item.authorName
          ? item.authorName
          : item.author
            ? `${item.author.firstName} ${item.author.lastName}`
            : "CHU Yaoundé",
        journal: "Publications CHU Yaoundé",
        year: new Date(item.publishedAt || item.createdAt).getFullYear(),
        type: item.publicationType || "journal",
        specialty: item.specialty || "general",
        abstract: item.excerpt || item.content.substring(0, 200) + "...",
        doi: "",
        citations: item.views || 0,
        pdf: item.pdf || null,
        fullContent: item.content,
      }));
      this.displayPublications(
        this.publicationsData.slice(0, this.publicationsPerPage || 9),
      );
    } catch (err) {
      console.error("Erreur chargement publications:", err);
    }
  }

  // ────────────────────────────────────────────
  // RENDU ACTUALITÉS
  // ────────────────────────────────────────────

  renderFeaturedNews(newsArray) {
    const featuredSection = document.getElementById("featuredNewsSection");
    const secondarySection = document.getElementById("secondaryNewsSection");
    if (!featuredSection) return;

    if (!newsArray || newsArray.length === 0) {
      featuredSection.innerHTML = "";
      if (secondarySection) secondarySection.innerHTML = "";
      return;
    }

    // Article à la une (premier article featured ou premier de la liste)
    const featured = newsArray.find((a) => a.featured) || newsArray[0];
    const secondary = newsArray
      .filter((a) => a._id !== featured._id)
      .slice(0, 2);

    featuredSection.innerHTML = this.createFeaturedCard(featured);
    if (secondarySection) {
      secondarySection.innerHTML = secondary
        .map((a) => this.createSecondaryCard(a))
        .join("");
    }
  }

  createFeaturedCard(article) {
    const date = this.formatDate(article.publishedAt || article.createdAt);
    const catLabel = this.getCategoryLabel(article.category);
    const imageUrl = article.image ? this.resolveImageUrl(article.image) : null;
    const catColors = {
      actualite: "#003087",
      evenement: "#e63946",
      publication: "#0a9396",
    };
    const catColor = catColors[article.category] || "#003087";

    return `
      <div style="background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,48,135,0.10);height:100%;">
        <div style="position:relative;height:280px;background:linear-gradient(135deg,#003087,#0057b7);overflow:hidden;">
          ${
            imageUrl
              ? `<img src="${imageUrl}" alt="${this.escHtml(article.title)}"
                style="width:100%;height:100%;object-fit:cover;opacity:0.85;"
                onerror="this.style.display='none'">`
              : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;">
                <i class="fas fa-newspaper fa-5x" style="color:rgba(255,255,255,0.2)"></i>
              </div>`
          }
          <div style="position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,0.7) 0%,transparent 60%)"></div>
          <div style="position:absolute;top:16px;left:16px;">
            <span style="background:${catColor};color:#fff;padding:5px 14px;border-radius:20px;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.5px">${catLabel}</span>
            <span style="background:rgba(255,255,255,0.9);color:#333;padding:5px 14px;border-radius:20px;font-size:12px;margin-left:8px;">⭐ À la une</span>
          </div>
        </div>
        <div style="padding:28px 28px 24px;">
          <div style="display:flex;align-items:center;gap:16px;margin-bottom:14px;font-size:13px;color:#888;">
            <span><i class="far fa-calendar me-1 text-primary"></i>${date}</span>
            ${article.authorName ? `<span><i class="fas fa-user me-1 text-primary"></i>${this.escHtml(article.authorName)}</span>` : ""}
            <span><i class="far fa-eye me-1 text-primary"></i>${article.views || 0} vues</span>
          </div>
          <h2 style="font-size:22px;font-weight:700;color:#003087;line-height:1.3;margin-bottom:14px">${this.escHtml(article.title)}</h2>
          <p style="font-size:15px;color:#555;line-height:1.7;margin-bottom:20px">${this.escHtml(article.excerpt || article.content?.substring(0, 200) || "")}</p>
          <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;">
            <button class="btn btn-primary" onclick="actualitesPage.readArticle('${article._id}')"
              style="border-radius:10px;padding:10px 24px;font-weight:600;">
              <i class="fas fa-book-open me-2"></i>Lire l'article
            </button>
            <div style="display:flex;gap:8px;">
              <a href="#" onclick="actualitesPage.shareArticle('${article._id}','facebook');return false;"
                 style="width:34px;height:34px;background:#1877f2;color:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;text-decoration:none;font-size:14px;"><i class="fab fa-facebook-f"></i></a>
              <a href="#" onclick="actualitesPage.shareArticle('${article._id}','twitter');return false;"
                 style="width:34px;height:34px;background:#1da1f2;color:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;text-decoration:none;font-size:14px;"><i class="fab fa-twitter"></i></a>
              <a href="#" onclick="actualitesPage.shareArticle('${article._id}','linkedin');return false;"
                 style="width:34px;height:34px;background:#0077b5;color:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;text-decoration:none;font-size:14px;"><i class="fab fa-linkedin-in"></i></a>
            </div>
          </div>
        </div>
      </div>`;
  }

  createSecondaryCard(article) {
    const date = this.formatDate(article.publishedAt || article.createdAt);
    const catLabel = this.getCategoryLabel(article.category);
    const imageUrl = article.image ? this.resolveImageUrl(article.image) : null;
    const catColors = {
      actualite: "#003087",
      evenement: "#e63946",
      publication: "#0a9396",
    };
    const catColor = catColors[article.category] || "#003087";

    return `
      <div style="background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 2px 12px rgba(0,48,135,0.07);
                  display:flex;gap:0;margin-bottom:16px;transition:transform .2s,box-shadow .2s;"
           onmouseenter="this.style.transform='translateY(-2px)';this.style.boxShadow='0 6px 24px rgba(0,48,135,0.13)'"
           onmouseleave="this.style.transform='';this.style.boxShadow='0 2px 12px rgba(0,48,135,0.07)'">
        <div style="width:110px;min-width:110px;background:linear-gradient(135deg,#003087,#0057b7);position:relative;overflow:hidden;">
          ${
            imageUrl
              ? `<img src="${imageUrl}" alt="" style="width:100%;height:100%;object-fit:cover;opacity:0.8;" onerror="this.style.display='none'">`
              : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;">
                <i class="fas fa-newspaper fa-2x" style="color:rgba(255,255,255,0.3)"></i>
              </div>`
          }
        </div>
        <div style="padding:14px 16px;flex:1;display:flex;flex-direction:column;">
          <div style="margin-bottom:6px">
            <span style="background:${catColor};color:#fff;padding:2px 10px;border-radius:12px;font-size:11px;font-weight:600">${catLabel}</span>
            <span style="font-size:11px;color:#aaa;margin-left:8px">${date}</span>
          </div>
          <h5 style="font-size:14px;font-weight:700;color:#003087;line-height:1.3;margin-bottom:6px;
                     display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">
            ${this.escHtml(article.title)}
          </h5>
          <p style="font-size:12px;color:#666;line-height:1.4;margin-bottom:8px;
                    display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">
            ${this.escHtml(article.excerpt || "")}
          </p>
          <button onclick="actualitesPage.readArticle('${article._id}')"
            style="background:none;border:none;color:#003087;font-size:12px;font-weight:600;padding:0;
                   text-align:left;cursor:pointer;margin-top:auto">
            Lire plus <i class="fas fa-arrow-right ms-1" style="font-size:10px"></i>
          </button>
        </div>
      </div>`;
  }

  renderNewsGrid(newsArray) {
    const container = document.getElementById("newsGrid");
    if (!container) return;

    if (!newsArray || newsArray.length === 0) {
      container.innerHTML = `
        <div class="col-12 text-center py-5">
          <i class="fas fa-newspaper fa-3x text-muted mb-3"></i>
          <h4 class="text-muted">Aucune actualité trouvée</h4>
          <p class="text-muted">Essayez avec d'autres critères de filtrage</p>
        </div>`;
      return;
    }

    // La grille affiche les articles après les 3 premiers (featured + 2 secondary)
    const gridArticles = newsArray.slice(3);

    if (gridArticles.length === 0) {
      container.innerHTML = "";
      return;
    }

    const gridHtml = gridArticles
      .map((article) => {
        const date = this.formatDate(article.publishedAt || article.createdAt);
        const catLabel = this.getCategoryLabel(article.category);
        const catClass = article.category || "general";
        const imageUrl = article.image
          ? this.resolveImageUrl(article.image)
          : null;

        const catColor =
          {
            actualite: "#003087",
            evenement: "#e63946",
            publication: "#0a9396",
          }[article.category] || "#003087";
        return `
          <div class="col-md-6 col-lg-4 mb-4" data-article-id="${article._id}">
            <div style="background:#fff;border-radius:16px;overflow:hidden;
                        box-shadow:0 2px 16px rgba(0,48,135,0.08);height:100%;
                        display:flex;flex-direction:column;
                        transition:transform .25s,box-shadow .25s;"
                 onmouseenter="this.style.transform='translateY(-5px)';this.style.boxShadow='0 10px 36px rgba(0,48,135,0.15)'"
                 onmouseleave="this.style.transform='';this.style.boxShadow='0 2px 16px rgba(0,48,135,0.08)'">
              <div style="height:200px;background:linear-gradient(135deg,#003087,#0057b7);position:relative;overflow:hidden;">
                ${
                  imageUrl
                    ? `<img src="${imageUrl}" alt="${this.escHtml(article.title)}"
                      style="width:100%;height:100%;object-fit:cover;opacity:0.85;"
                      onerror="this.style.display='none'">`
                    : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;">
                      <i class="fas fa-newspaper fa-4x" style="color:rgba(255,255,255,0.15)"></i>
                    </div>`
                }
                <div style="position:absolute;top:12px;left:12px;">
                  <span style="background:${catColor};color:#fff;padding:4px 12px;border-radius:16px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.4px">${catLabel}</span>
                  ${article.featured ? `<span style="background:#f59e0b;color:#fff;padding:4px 12px;border-radius:16px;font-size:11px;font-weight:700;margin-left:6px">⭐ Une</span>` : ""}
                </div>
              </div>
              <div style="padding:20px;flex:1;display:flex;flex-direction:column;">
                <div style="font-size:12px;color:#aaa;margin-bottom:10px;display:flex;gap:12px;flex-wrap:wrap">
                  <span><i class="far fa-calendar me-1"></i>${date}</span>
                  <span><i class="far fa-eye me-1"></i>${article.views || 0} vues</span>
                  ${article.authorName ? `<span><i class="fas fa-user me-1"></i>${this.escHtml(article.authorName)}</span>` : ""}
                </div>
                <h4 style="font-size:16px;font-weight:700;color:#003087;line-height:1.4;margin-bottom:10px;
                           display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">
                  ${this.escHtml(article.title)}
                </h4>
                <p style="font-size:13px;color:#666;line-height:1.6;flex:1;margin-bottom:16px;
                          display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden">
                  ${this.escHtml(article.excerpt || article.content?.substring(0, 150) || "")}
                </p>
                <div style="display:flex;align-items:center;justify-content:space-between;margin-top:auto">
                  <button onclick="actualitesPage.readArticle('${article._id}')"
                    class="btn btn-primary btn-sm"
                    style="border-radius:8px;padding:7px 18px;font-size:13px;font-weight:600">
                    <i class="fas fa-book-open me-1"></i>Lire
                  </button>
                  <div style="display:flex;gap:6px;">
                    <a href="#" onclick="actualitesPage.shareArticle('${article._id}','facebook');return false;"
                       style="width:28px;height:28px;background:#e8edf5;color:#1877f2;border-radius:50%;display:flex;align-items:center;justify-content:center;text-decoration:none;font-size:12px;transition:background .2s"
                       onmouseenter="this.style.background='#1877f2';this.style.color='#fff'"
                       onmouseleave="this.style.background='#e8edf5';this.style.color='#1877f2'"><i class="fab fa-facebook-f"></i></a>
                    <a href="#" onclick="actualitesPage.shareArticle('${article._id}','twitter');return false;"
                       style="width:28px;height:28px;background:#e8edf5;color:#1da1f2;border-radius:50%;display:flex;align-items:center;justify-content:center;text-decoration:none;font-size:12px;transition:background .2s"
                       onmouseenter="this.style.background='#1da1f2';this.style.color='#fff'"
                       onmouseleave="this.style.background='#e8edf5';this.style.color='#1da1f2'"><i class="fab fa-twitter"></i></a>
                    <a href="#" onclick="actualitesPage.shareArticle('${article._id}','linkedin');return false;"
                       style="width:28px;height:28px;background:#e8edf5;color:#0077b5;border-radius:50%;display:flex;align-items:center;justify-content:center;text-decoration:none;font-size:12px;transition:background .2s"
                       onmouseenter="this.style.background='#0077b5';this.style.color='#fff'"
                       onmouseleave="this.style.background='#e8edf5';this.style.color='#0077b5'"><i class="fab fa-linkedin-in"></i></a>
                  </div>
                </div>
              </div>
            </div>
          </div>`;
      })
      .join("");
    container.innerHTML = `<div class="row g-4">${gridHtml}</div>`;
  }

  showNewsLoading() {
    const container = document.getElementById("newsGrid");
    if (container) {
      container.innerHTML = `
        <div class="col-12 text-center py-5">
          <i class="fas fa-circle-notch fa-spin fa-2x text-primary mb-3"></i>
          <p class="text-muted">Chargement des actualités...</p>
        </div>`;
    }
  }

  showNewsError() {
    const container = document.getElementById("newsGrid");
    if (container) {
      container.innerHTML = `
        <div class="col-12 text-center py-5">
          <i class="fas fa-exclamation-triangle fa-2x text-warning mb-3"></i>
          <h5 class="text-muted">Impossible de charger les actualités</h5>
          <p class="text-muted">Vérifiez votre connexion et réessayez.</p>
          <button class="btn btn-outline-primary" onclick="actualitesPage.loadInitialData()">
            <i class="fas fa-redo me-2"></i>Réessayer
          </button>
        </div>`;
    }
  }

  updateLoadMoreBtn() {
    const btn = document.getElementById("loadMoreNews");
    if (!btn) return;
    if (this.newsPage >= this.totalNewsPages) {
      btn.disabled = true;
      btn.innerHTML =
        "<i class='fas fa-check me-2'></i>Toutes les actualités sont chargées";
    } else {
      btn.disabled = false;
      btn.innerHTML =
        "<i class='fas fa-plus me-2'></i>Charger plus d'actualités";
    }
  }

  // ────────────────────────────────────────────
  // LIRE UN ARTICLE (MODAL)
  // ────────────────────────────────────────────

  async readArticle(articleId) {
    try {
      const res = await fetch(`${API_BASE}/news/${articleId}`);
      const data = await res.json();

      if (!data.success || !data.data) throw new Error("Article non trouvé");

      const article = data.data;
      const modalLabel = document.getElementById("articleModalLabel");
      const modalContent = document.getElementById("articleModalContent");

      if (!modalLabel || !modalContent) return;

      const date = this.formatDate(article.publishedAt || article.createdAt);
      const catLabel = this.getCategoryLabel(article.category);
      const imageUrl = article.image
        ? this.resolveImageUrl(article.image)
        : null;

      modalLabel.textContent = article.title;
      modalContent.innerHTML = `
        ${
          imageUrl
            ? `<img src="${imageUrl}" alt="${this.escHtml(article.title)}"
                  class="img-fluid rounded mb-3 w-100"
                  style="max-height:300px;object-fit:cover;"
                  onerror="this.style.display='none';">`
            : ""
        }
        <div class="article-meta mb-3">
          <span class="badge bg-primary me-2">${catLabel}</span>
          <small class="text-muted">
            <i class="far fa-calendar me-1"></i>${date} &nbsp;
            <i class="far fa-eye me-1"></i>${article.views || 0} vues
          </small>
        </div>
        ${
          article.excerpt
            ? `<p class="lead text-muted border-start border-primary border-3 ps-3 mb-3">${this.escHtml(article.excerpt)}</p>`
            : ""
        }
        <div class="article-full-content">
          ${article.content.replace(/\n/g, "<br>")}
        </div>
        <hr>
        <div class="d-flex align-items-center justify-content-between flex-wrap gap-2">
          <small class="text-muted">
            <i class="fas fa-user me-1"></i>
            ${
              article.authorName
                ? article.authorName
                : article.author
                  ? article.author.firstName + " " + article.author.lastName
                  : "CHU Yaoundé"
            }
          </small>
          ${
            article.pdf
              ? `<a href="${this.resolveImageUrl(article.pdf)}" download
                  class="btn btn-danger btn-sm">
                <i class="fas fa-file-pdf me-1"></i>Télécharger le PDF
              </a>`
              : ""
          }
        </div>`;

      // Ouvrir la modal Bootstrap
      const modal = document.getElementById("articleModal");
      if (modal) {
        const bsModal =
          bootstrap.Modal.getInstance(modal) || new bootstrap.Modal(modal);
        bsModal.show();
      }
    } catch (err) {
      console.error("Erreur lecture article:", err);
      this.showNotification("Impossible de charger l'article", "error");
    }
  }

  // ────────────────────────────────────────────
  // FILTRES & RECHERCHE
  // ────────────────────────────────────────────

  setupFilters() {
    // Boutons filtres actualités
    document.querySelectorAll(".filter-buttons .btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        document
          .querySelectorAll(".filter-buttons .btn")
          .forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        const filterVal = btn.getAttribute("data-filter") || "all";
        // Map filter labels to DB categories
        const filterToCategory = {
          all: "all",
          news: "actualite",
          events: "evenement",
          publications: "publication",
        };
        this.currentCategory = filterToCategory[filterVal] || filterVal;
        this.newsPage = 1;
        this.loadNews(1, this.currentCategory, this.currentSearch);
      });
    });

    // Filtre événements
    const eventTypeFilter = document.getElementById("eventTypeFilter");
    if (eventTypeFilter) {
      eventTypeFilter.addEventListener("change", (e) => {
        this.filters.events.type = e.target.value;
        this.filterEvents();
      });
    }

    const eventSort = document.getElementById("eventSort");
    if (eventSort) {
      eventSort.addEventListener("change", (e) => {
        this.filters.events.sort = e.target.value;
        this.sortEvents();
      });
    }

    // Filtres publications
    const specFilter = document.getElementById("specialtyFilter");
    if (specFilter)
      specFilter.addEventListener("change", (e) => {
        this.filters.publications.specialty = e.target.value;
        this.filterPublications();
      });

    const yearFilter = document.getElementById("yearFilter");
    if (yearFilter)
      yearFilter.addEventListener("change", (e) => {
        this.filters.publications.year = e.target.value;
        this.filterPublications();
      });

    const pubTypeFilter = document.getElementById("publicationTypeFilter");
    if (pubTypeFilter)
      pubTypeFilter.addEventListener("change", (e) => {
        this.filters.publications.type = e.target.value;
        this.filterPublications();
      });
  }

  setupSearch() {
    const searchInput = document.querySelector(".search-box-large input");
    const searchBtn = document.querySelector(".search-btn-large");

    if (!searchInput || !searchBtn) return;

    const doSearch = () => {
      const q = searchInput.value.trim();
      this.currentSearch = q;
      this.newsPage = 1;
      if (q === "") {
        this.loadNews(1, this.currentCategory, "");
      } else {
        // Recherche globale : activer le filtre "Tout" et chercher
        document
          .querySelectorAll(".filter-buttons .btn")
          .forEach((b) => b.classList.remove("active"));
        const allBtn = document.querySelector(
          '.filter-buttons .btn[data-filter="all"]',
        );
        if (allBtn) allBtn.classList.add("active");
        this.currentCategory = "all";
        this.loadNews(1, "all", q);
        // Scroll vers les résultats
        const newsSection = document.getElementById("news");
        if (newsSection)
          newsSection.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };

    searchBtn.addEventListener("click", doSearch);
    searchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") doSearch();
    });
    searchInput.addEventListener("input", this.debounce(doSearch, 600));
  }

  filterEvents() {
    let filtered = [...this.eventsData];
    if (this.filters.events.type !== "all") {
      filtered = filtered.filter((e) => e.type === this.filters.events.type);
    }
    this.displayEvents(filtered);
  }

  sortEvents() {
    let sorted = [...this.eventsData];
    const now = new Date();
    switch (this.filters.events.sort) {
      case "date":
        sorted.sort((a, b) => a.date - b.date);
        break;
      case "recent":
        sorted.sort((a, b) => b.date - a.date);
        break;
      case "popularity":
        sorted.sort((a, b) => b.registered - a.registered);
        break;
    }
    this.displayEvents(sorted);
  }

  filterPublications() {
    let filtered = [...this.publicationsData];
    const { specialty, year, type } = this.filters.publications;
    if (specialty !== "all")
      filtered = filtered.filter((p) => p.specialty === specialty);
    if (year !== "all")
      filtered = filtered.filter((p) => p.year.toString() === year);
    if (type !== "all") filtered = filtered.filter((p) => p.type === type);
    this.displayPublications(filtered.slice(0, 9));
  }

  // ────────────────────────────────────────────
  // AFFICHAGE ÉVÉNEMENTS
  // ────────────────────────────────────────────

  displayEvents(events) {
    const upcomingContainer = document.getElementById("upcomingEvents");
    const pastContainer = document.getElementById("pastEvents");
    if (!upcomingContainer || !pastContainer) return;

    const now = new Date();
    // Un événement est "à venir" si :
    // - sa date de fin est dans le futur (si définie)
    // - OU sa date de début est dans le futur
    // - OU s'il n'a pas de date d'événement spécifique (eventStartDate non défini), il est "à venir" par défaut
    const upcoming = events.filter((e) => {
      if (e.endDate) return e.endDate >= now; // fin dans le futur = encore actif
      if (e.hasEventDate) return e.date >= now; // debut dans le futur
      return true; // pas de date = à venir par défaut
    });
    const past = events.filter((e) => {
      if (e.endDate) return e.endDate < now;
      if (e.hasEventDate) return e.date < now;
      return false;
    });

    if (upcoming.length === 0) {
      upcomingContainer.innerHTML = `
        <div class="text-center py-5 text-muted">
          <i class="fas fa-calendar fa-3x mb-3 d-block" style="color:#cdd5e0"></i>
          <p style="font-size:16px">Aucun événement à venir pour le moment</p>
        </div>`;
    } else {
      upcomingContainer.innerHTML = `<div class="row g-4">${upcoming
        .map((e) => this.createEventCard(e, false))
        .join("")}</div>`;
    }

    pastContainer.innerHTML =
      past.length > 0
        ? `<div class="row g-4">${past.map((e) => this.createEventCard(e, true)).join("")}</div>`
        : '<p class="text-muted text-center py-3">Aucun événement passé</p>';
  }

  displayEventsError() {
    const upcomingContainer = document.getElementById("upcomingEvents");
    if (upcomingContainer) {
      upcomingContainer.innerHTML = `<div class="col-12 text-center py-4 text-muted">
        <i class="fas fa-calendar-times fa-2x mb-2"></i>
        <p>Impossible de charger les événements</p>
      </div>`;
    }
  }

  createEventCard(event, isPast = false) {
    const d = new Date(event.date);
    const day = d.getDate();
    const month = this.getMonthName(d.getMonth());
    const year = d.getFullYear();

    // End date display
    let endDateHtml = "";
    if (event.endDate) {
      const de = new Date(event.endDate);
      endDateHtml = `<span style="font-size:12px;color:var(--chu-gray-600,#666)">
        <i class="fas fa-arrow-right mx-1" style="font-size:10px"></i>
        ${de.getDate()} ${this.getMonthName(de.getMonth())} ${de.getFullYear()}
        à ${de.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
      </span>`;
    }

    const statusBadge = isPast
      ? `<span class="badge" style="background:#6c757d;color:#fff;padding:4px 10px;border-radius:20px;font-size:11px;">Terminé</span>`
      : `<span class="badge" style="background:#198754;color:#fff;padding:4px 10px;border-radius:20px;font-size:11px;">À venir</span>`;

    const eventTypeColors = {
      conference: "#003087",
      seminar: "#0a9396",
      workshop: "#e76f51",
      training: "#6a4c93",
    };
    const typeColor = eventTypeColors[event.type] || "#003087";
    const typeBadge = `<span style="background:${typeColor};color:#fff;padding:4px 10px;border-radius:20px;font-size:11px;font-weight:600;">${this.getEventTypeLabel(event.type)}</span>`;

    return `
      <div class="col-md-6 col-lg-4 mb-4">
        <div style="background:#fff;border-radius:16px;box-shadow:0 2px 16px rgba(0,48,135,0.08);overflow:hidden;height:100%;display:flex;flex-direction:column;transition:transform .2s,box-shadow .2s;"
             onmouseenter="this.style.transform='translateY(-4px)';this.style.boxShadow='0 8px 32px rgba(0,48,135,0.15)'"
             onmouseleave="this.style.transform='';this.style.boxShadow='0 2px 16px rgba(0,48,135,0.08)'">
          ${
            event.image
              ? `<img src="${this.resolveImageUrl(event.image)}" alt="${this.escHtml(event.title)}"
            style="width:100%;height:180px;object-fit:cover;" onerror="this.style.display='none'">`
              : `<div style="width:100%;height:120px;background:linear-gradient(135deg,#003087,#0057b7);display:flex;align-items:center;justify-content:center;">
              <i class="fas fa-calendar-alt fa-3x" style="color:rgba(255,255,255,0.4)"></i>
            </div>`
          }
          <div style="padding:20px;flex:1;display:flex;flex-direction:column;">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;flex-wrap:wrap;">
              ${statusBadge}
              ${typeBadge}
              <div style="display:flex;align-items:center;gap:6px;background:#f0f4ff;border-radius:8px;padding:4px 10px;">
                <span style="background:#003087;color:#fff;border-radius:6px;padding:2px 8px;font-size:13px;font-weight:700;min-width:28px;text-align:center">${day}</span>
                <span style="font-size:12px;font-weight:600;color:#003087;text-transform:uppercase">${month} ${year}</span>
              </div>
            </div>
            <h5 style="font-size:16px;font-weight:700;color:#003087;margin-bottom:8px;line-height:1.3">${this.escHtml(event.title)}</h5>
            <div style="display:flex;flex-direction:column;gap:4px;margin-bottom:10px;">
              <span style="font-size:13px;color:#555"><i class="far fa-clock me-2 text-primary"></i>${event.time}</span>
              <span style="font-size:13px;color:#555"><i class="fas fa-map-marker-alt me-2 text-primary"></i>${event.location}</span>
              ${endDateHtml}
            </div>
            <p style="font-size:14px;color:#666;line-height:1.5;flex:1;margin-bottom:14px">${this.escHtml(event.description)}</p>
            <div style="margin-top:auto">
              <button class="btn btn-primary btn-sm w-100"
                      onclick="actualitesPage.readArticle('${event.id}')"
                      style="border-radius:8px;padding:8px">
                <i class="fas fa-info-circle me-2"></i>Voir les détails
              </button>
            </div>
          </div>
        </div>
      </div>`;
  }

  // ────────────────────────────────────────────
  // AFFICHAGE PUBLICATIONS
  // ────────────────────────────────────────────

  displayPublications(publications) {
    const container = document.getElementById("publicationsGrid");
    if (!container) return;

    if (!publications || publications.length === 0) {
      container.innerHTML = `
        <div class="col-12 text-center py-4">
          <i class="fas fa-book fa-2x text-muted mb-2"></i>
          <p class="text-muted">Aucune publication disponible</p>
        </div>`;
      return;
    }

    container.innerHTML = `<div class="row g-4">${publications
      .map(
        (pub) => `
      <div class="col-md-6 col-lg-4">
        <div style="background:#fff;border-radius:16px;padding:24px;box-shadow:0 2px 16px rgba(10,147,150,0.08);
                    height:100%;display:flex;flex-direction:column;border-top:4px solid #0a9396;
                    transition:transform .2s,box-shadow .2s;"
             onmouseenter="this.style.transform='translateY(-4px)';this.style.boxShadow='0 8px 32px rgba(10,147,150,0.15)'"
             onmouseleave="this.style.transform='';this.style.boxShadow='0 2px 16px rgba(10,147,150,0.08)'">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap;gap:6px;">
            <div style="display:flex;gap:6px;flex-wrap:wrap;">
              <span style="background:#e6f7f7;color:#0a9396;padding:4px 12px;border-radius:12px;font-size:11px;font-weight:700;text-transform:uppercase">
                ${this.getPublicationTypeLabel(pub.type)}
              </span>
              ${pub.specialty && pub.specialty !== "general" ? `<span style="background:#f0f4ff;color:#003087;padding:4px 12px;border-radius:12px;font-size:11px;font-weight:600;">${this.getSpecialtyLabel(pub.specialty)}</span>` : ""}
            </div>
            <span style="font-size:13px;color:#aaa;font-weight:600">${pub.year}</span>
          </div>
          <h5 style="font-size:15px;font-weight:700;color:#003087;line-height:1.4;margin-bottom:10px;
                     display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden">
            ${this.escHtml(pub.title)}
          </h5>
          <p style="font-size:13px;color:#0a9396;font-weight:500;margin-bottom:4px">
            <i class="fas fa-user me-1"></i>${this.escHtml(pub.authors)}
          </p>
          <p style="font-size:12px;color:#888;font-style:italic;margin-bottom:12px">
            ${this.escHtml(pub.journal)}
          </p>
          <p style="font-size:13px;color:#555;line-height:1.6;flex:1;margin-bottom:16px;
                    display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden">
            ${this.escHtml(pub.abstract)}
          </p>
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:auto;align-items:center;">
            <button onclick="actualitesPage.readArticle('${pub.id}')"
              style="background:#003087;color:#fff;border:none;border-radius:8px;padding:7px 16px;font-size:12px;font-weight:600;cursor:pointer;">
              <i class="fas fa-book-open me-1"></i>Lire
            </button>
            ${
              pub.pdf
                ? `<a href="${this.resolveImageUrl(pub.pdf)}" download
                    style="background:#e63946;color:#fff;border-radius:8px;padding:7px 16px;font-size:12px;font-weight:600;text-decoration:none;">
                  <i class="fas fa-file-pdf me-1"></i>PDF
                </a>`
                : ""
            }
            <span style="font-size:12px;color:#aaa;margin-left:auto">
              <i class="far fa-eye me-1"></i>${pub.citations} vues
            </span>
          </div>
        </div>
      </div>`,
      )
      .join("")}</div>`;
  }

  // ────────────────────────────────────────────
  // EVENT LISTENERS (load more, etc.)
  // ────────────────────────────────────────────

  setupEventListeners() {
    const loadMoreBtn = document.getElementById("loadMoreNews");
    if (loadMoreBtn) {
      loadMoreBtn.addEventListener("click", () => this.loadMoreNews());
    }

    // Bouton newsletter
    const subBtn = document.querySelector(".newsletter-form button");
    if (subBtn) {
      subBtn.addEventListener("click", () => this.subscribeNewsletter());
    }

    // Enter sur le champ newsletter
    const emailInput = document.querySelector(".newsletter-form input");
    if (emailInput) {
      emailInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") this.subscribeNewsletter();
      });
    }
  }

  async loadMoreNews() {
    if (this.newsPage >= this.totalNewsPages) return;
    this.newsPage++;
    try {
      let url = `${API_BASE}/news?page=${this.newsPage}&limit=${this.newsPerPage}&sort=-publishedAt&published=true`;
      if (this.currentCategory && this.currentCategory !== "all")
        url += `&category=${this.currentCategory}`;
      if (this.currentSearch && this.currentSearch.trim() !== "")
        url += `&q=${encodeURIComponent(this.currentSearch.trim())}`;

      const res = await fetch(url);
      const data = await res.json();
      if (!data.success) throw new Error(data.message);

      const more = data.data || [];
      this.newsData = [...this.newsData, ...more];
      this.totalNewsPages = data.pages;

      // Ajouter les nouveaux articles à la grille
      const container = document.getElementById("newsGrid");
      if (container) {
        const newCards = more.map((article) => {
          const date = this.formatDate(
            article.publishedAt || article.createdAt,
          );
          const catLabel = this.getCategoryLabel(article.category);
          const catClass = article.category || "general";
          const imageUrl = article.image
            ? this.resolveImageUrl(article.image)
            : null;

          const div = document.createElement("div");
          div.className = "news-card";
          div.setAttribute("data-article-id", article._id);
          div.innerHTML = `
            <div class="article-image">
              ${
                imageUrl
                  ? `<img src="${imageUrl}" alt="${this.escHtml(article.title)}" class="adaptive-image"
                        onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">`
                  : ""
              }
              <div class="image-placeholder" style="${imageUrl ? "display:none" : "display:flex"}">
                <i class="fas fa-newspaper fa-3x"></i>
              </div>
            </div>
            <div class="article-content">
              <div class="article-meta">
                <span class="category ${catClass}">${catLabel}</span>
                <span class="date"><i class="far fa-calendar me-1"></i> ${date}</span>
                <span class="views"><i class="far fa-eye me-1"></i> ${article.views || 0} vues</span>
              </div>
              <h3 class="article-title">${this.escHtml(article.title)}</h3>
              <p class="article-excerpt">${this.escHtml(article.excerpt || "")}</p>
              <div class="article-actions">
                <button class="btn btn-primary btn-sm"
                        onclick="actualitesPage.readArticle('${article._id}')">
                  Lire l'article
                </button>
              </div>
            </div>`;
          container.appendChild(div);
        });
      }

      this.updateLoadMoreBtn();
    } catch (err) {
      console.error("Erreur chargement plus:", err);
    }
  }

  // ────────────────────────────────────────────
  // NEWSLETTER
  // ────────────────────────────────────────────

  setupNewsletter() {
    // Initialisé dans setupEventListeners
  }

  async subscribeNewsletter() {
    const emailInput = document.querySelector(".newsletter-form input");
    const email = emailInput ? emailInput.value.trim() : "";

    if (!this.validateEmail(email)) {
      this.showNotification(
        "Veuillez entrer une adresse email valide",
        "warning",
      );
      return;
    }

    const btn = document.querySelector(".newsletter-form button");
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<i class="fas fa-circle-notch fa-spin me-1"></i>...';
    }

    try {
      const res = await fetch(`${API_BASE}/newsletter/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (data.success) {
        this.showNotification(data.message, "success");
        if (emailInput) emailInput.value = "";
      } else {
        this.showNotification(
          data.message || "Erreur lors de l'abonnement",
          "error",
        );
      }
    } catch (err) {
      console.error("Erreur newsletter:", err);
      this.showNotification("Erreur de connexion au serveur", "error");
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = "S'abonner";
      }
    }
  }

  // ────────────────────────────────────────────
  // PARTAGE
  // ────────────────────────────────────────────

  shareArticle(articleId, platform) {
    const url = encodeURIComponent(
      window.location.href + "#article-" + articleId,
    );
    const article = this.newsData.find((a) => a._id === articleId);
    const title = encodeURIComponent(
      article ? article.title : "Article CHU Yaoundé",
    );

    let shareUrl;
    switch (platform) {
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
        break;
      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?text=${title}&url=${url}`;
        break;
      case "linkedin":
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
        break;
    }
    if (shareUrl) window.open(shareUrl, "_blank", "width=600,height=400");
  }

  // ────────────────────────────────────────────
  // SCROLL ANIMATIONS
  // ────────────────────────────────────────────

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

    document.querySelectorAll(".stat-card, .section-header").forEach((el) => {
      el.style.opacity = "0";
      el.style.transform = "translateY(20px)";
      el.style.transition = "all 0.5s ease";
      observer.observe(el);
    });
  }

  // ────────────────────────────────────────────
  // UTILITAIRES
  // ────────────────────────────────────────────

  resolveImageUrl(imageUrl) {
    if (!imageUrl) return null;
    if (imageUrl.startsWith("http")) return imageUrl;
    if (imageUrl.startsWith("/")) return `http://localhost:5000${imageUrl}`;
    return `http://localhost:5000/${imageUrl}`;
  }

  formatDate(dateStr) {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  escHtml(str) {
    if (!str) return "";
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  getCategoryLabel(cat) {
    const labels = {
      actualite: "Actualité",
      evenement: "Événement",
      publication: "Publication",
      general: "Général",
      medical: "Médical",
      annonce: "Annonce",
      formation: "Formation",
      news: "Actualité",
      health: "Santé",
      research: "Recherche",
    };
    return labels[cat] || cat || "Actualité";
  }

  getPublicationTypeLabel(type) {
    const labels = {
      journal: "Article",
      conference: "Communication",
      thesis: "Thèse",
      book: "Livre",
    };
    return labels[type] || type || "Publication";
  }

  getEventTypeLabel(type) {
    const labels = {
      conference: "Conférence",
      seminar: "Séminaire",
      workshop: "Atelier",
      training: "Formation",
    };
    return labels[type] || type || "Événement";
  }

  getSpecialtyLabel(specialty) {
    const labels = {
      general: "Général",
      cardiology: "Cardiologie",
      oncology: "Oncologie",
      neurology: "Neurologie",
      pediatrics: "Pédiatrie",
      surgery: "Chirurgie",
    };
    return labels[specialty] || specialty || "Général";
  }

  getMonthName(idx) {
    return [
      "Jan",
      "Fév",
      "Mar",
      "Avr",
      "Mai",
      "Jun",
      "Jul",
      "Aoû",
      "Sep",
      "Oct",
      "Nov",
      "Déc",
    ][idx];
  }

  validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  debounce(func, wait) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => func.apply(this, args), wait);
    };
  }

  showNotification(msg, type = "info") {
    if (typeof chuApp !== "undefined" && chuApp.showNotification) {
      chuApp.showNotification(msg, type);
      return;
    }
    // Fallback toast
    const colors = {
      success: "#198754",
      error: "#dc3545",
      warning: "#ffc107",
      info: "#0d6efd",
    };
    const toast = document.createElement("div");
    toast.style.cssText = `
      position:fixed;bottom:20px;right:20px;z-index:9999;
      background:${colors[type] || colors.info};color:white;
      padding:12px 20px;border-radius:8px;box-shadow:0 4px 15px rgba(0,0,0,.2);
      font-size:14px;max-width:350px;transition:opacity .3s;
    `;
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = "0";
      setTimeout(() => toast.remove(), 350);
    }, 4000);
  }

  scrollToSection(sectionId) {
    const el =
      document.getElementById(sectionId) ||
      document.querySelector(`[data-section="${sectionId}"]`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  async openResearchDatabase() {
    // Affiche toutes les actualités et publications dans la section principale
    document
      .querySelectorAll(".filter-buttons .btn")
      .forEach((b) => b.classList.remove("active"));
    const allBtn = document.querySelector(
      '.filter-buttons .btn[data-filter="all"]',
    );
    if (allBtn) allBtn.classList.add("active");
    this.currentCategory = "all";
    this.currentSearch = "";
    await this.loadNews(1, "all", "");
    // Scroll vers la section actualités
    const newsSection =
      document.getElementById("news") ||
      document.querySelector(".actualites-section");
    if (newsSection) {
      newsSection.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      window.scrollTo({ top: 400, behavior: "smooth" });
    }
    this.showToast(
      "📚 Affichage de toutes les publications et actualités",
      "info",
    );
  }

  async downloadCatalogue() {
    const btn = document.getElementById("btn-download-catalogue");
    if (btn) {
      btn.innerHTML =
        '<i class="fas fa-circle-notch fa-spin me-2"></i>Génération...';
      btn.disabled = true;
    }
    try {
      const res = await fetch(
        `${API_BASE}/news?published=true&limit=100&sort=-publishedAt`,
      );
      const data = await res.json();
      const publications = (data.data || []).filter((item) =>
        ["formation", "medical", "general"].includes(item.category),
      );

      const html = `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8">
<title>Catalogue Publications CHU Yaoundé</title>
<style>
  body{font-family:Arial,sans-serif;margin:40px;color:#333}
  h1{color:#003087;border-bottom:3px solid #e63946;padding-bottom:10px}
  .pub{border:1px solid #ddd;border-radius:8px;padding:16px;margin-bottom:16px}
  .pub-title{font-size:16px;font-weight:bold;color:#003087;margin-bottom:6px}
  .pub-meta{font-size:13px;color:#666;margin-bottom:8px}
  .badge{background:#003087;color:#fff;padding:2px 8px;border-radius:4px;font-size:12px}
</style></head><body>
<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:30px">
  <h1>📚 Catalogue des Publications<br><small style="font-size:16px;color:#666">CHU Yaoundé</small></h1>
  <div style="color:#999;font-size:13px">Généré le ${new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}</div>
</div>
<p style="color:#666;margin-bottom:24px">${publications.length} publication(s)</p>
${publications
  .map(
    (p, i) => `
  <div class="pub">
    <div class="pub-title">${i + 1}. ${p.title || ""}</div>
    <div class="pub-meta">
      <span class="badge">${p.category || "Général"}</span>
      &nbsp;Auteur : ${p.authorName || (p.author ? (p.author.firstName || "") + " " + (p.author.lastName || "") : "CHU Yaoundé")}
      &nbsp;|&nbsp; ${p.publishedAt ? new Date(p.publishedAt).toLocaleDateString("fr-FR") : ""}
    </div>
    <div>${p.excerpt || p.content?.substring(0, 200) || ""}</div>
    ${p.pdf ? `<div style="margin-top:8px"><a href="${p.pdf}" style="color:#e63946">📄 Télécharger le PDF</a></div>` : ""}
  </div>`,
  )
  .join("")}
</body></html>`;

      const blob = new Blob([html], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `catalogue-chu-${new Date().getFullYear()}.html`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Erreur : " + err.message);
    } finally {
      if (btn) {
        btn.innerHTML =
          '<i class="fas fa-download me-2"></i>Télécharger le catalogue';
        btn.disabled = false;
      }
    }
  }
}

// Initialisation

const actualitesPage = new ActualitesPage();

// Scroll navigation active
window.addEventListener(
  "scroll",
  (() => {
    let t;
    return () => {
      clearTimeout(t);
      t = setTimeout(() => {
        const sections = document.querySelectorAll("section[id]");
        const navItems = document.querySelectorAll(".actualites-nav .nav-item");
        let current = "";
        sections.forEach((s) => {
          if (window.scrollY >= s.offsetTop - 150) current = s.id;
        });
        navItems.forEach((item) => {
          item.classList.remove("active");
          if (item.getAttribute("href") === `#${current}`)
            item.classList.add("active");
        });
      }, 100);
    };
  })(),
);

// Raccourcis clavier
document.addEventListener("keydown", (e) => {
  if (e.ctrlKey) {
    if (e.key === "1") {
      e.preventDefault();
      actualitesPage.scrollToSection("news");
    }
    if (e.key === "2") {
      e.preventDefault();
      actualitesPage.scrollToSection("events");
    }
    if (e.key === "3") {
      e.preventDefault();
      actualitesPage.scrollToSection("publications");
    }
  }
});
