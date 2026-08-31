// GESTION DE LA NAVIGATION ET DU MENU
class NavigationManager {
    constructor() {
        this.isPanelOpen = false;
        this.currentPage = this.getCurrentPage();
        this.init();
    }

    init() {
        this.setupMenuToggle();
        this.setupPanelClose();
        this.setupSearchToggle();
        this.setupSmoothScroll();
        this.setupActiveNav();
        this.setupKeyboardNavigation();
        this.loadNavigationData();
    }

    getCurrentPage() {
        const path = window.location.pathname;
        return path.split('/').pop() || 'index.html';
    }

    setupMenuToggle() {
        const menuToggle = document.getElementById('menuToggle');
        const sidePanel = document.getElementById('sidePanel');
        const panelOverlay = document.getElementById('panelOverlay');

        if (menuToggle && sidePanel && panelOverlay) {
            menuToggle.addEventListener('click', () => this.openPanel());
            panelOverlay.addEventListener('click', () => this.closePanel());
            
            // Animation du hamburger
            menuToggle.addEventListener('mouseenter', () => {
                if (!this.isPanelOpen) {
                    menuToggle.style.transform = 'scale(1.1)';
                }
            });
            
            menuToggle.addEventListener('mouseleave', () => {
                if (!this.isPanelOpen) {
                    menuToggle.style.transform = 'scale(1)';
                }
            });
        }
    }

    setupPanelClose() {
        const closePanel = document.getElementById('closePanel');
        if (closePanel) {
            closePanel.addEventListener('click', () => this.closePanel());
        }

        // Fermeture avec Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isPanelOpen) {
                this.closePanel();
            }
        });
    }

    setupSearchToggle() {
        const searchToggle = document.getElementById('searchToggle');
        const searchBox = document.getElementById('searchBox');
        
        if (searchToggle && searchBox) {
            searchToggle.addEventListener('click', () => {
                const isHidden = searchBox.style.display === 'none';
                searchBox.style.display = isHidden ? 'block' : 'none';
                
                if (isHidden) {
                    setTimeout(() => {
                        searchBox.querySelector('input').focus();
                    }, 100);
                }
            });
        }
    }

    setupSmoothScroll() {
        // Scroll doux pour les ancres
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }

    setupActiveNav() {
        // Marquer l'élément de navigation actif
        const currentPage = this.currentPage;
        const navLinks = document.querySelectorAll('.panel-nav-item a');
        
        navLinks.forEach(link => {
            const linkHref = link.getAttribute('href');
            if (linkHref === currentPage || 
                (currentPage === 'index.html' && linkHref === './') ||
                (linkHref && linkHref.includes(currentPage))) {
                link.style.color = 'var(--chu-blue)';
                link.style.fontWeight = '600';
            }
        });
    }

    setupKeyboardNavigation() {
        // Navigation au clavier dans le panel
        document.addEventListener('keydown', (e) => {
            if (!this.isPanelOpen) return;

            const focusableElements = this.getFocusableElements();
            const currentIndex = focusableElements.indexOf(document.activeElement);

            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    const nextIndex = (currentIndex + 1) % focusableElements.length;
                    focusableElements[nextIndex].focus();
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    const prevIndex = currentIndex > 0 ? currentIndex - 1 : focusableElements.length - 1;
                    focusableElements[prevIndex].focus();
                    break;
                case 'Home':
                    e.preventDefault();
                    focusableElements[0].focus();
                    break;
                case 'End':
                    e.preventDefault();
                    focusableElements[focusableElements.length - 1].focus();
                    break;
            }
        });
    }

    getFocusableElements() {
        const panel = document.getElementById('sidePanel');
        return panel ? Array.from(panel.querySelectorAll(
            'a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
        )) : [];
    }

    openPanel() {
        const sidePanel = document.getElementById('sidePanel');
        const panelOverlay = document.getElementById('panelOverlay');
        const menuToggle = document.getElementById('menuToggle');
        
        sidePanel.classList.add('open');
        panelOverlay.classList.add('show');
        document.body.style.overflow = 'hidden';
        this.isPanelOpen = true;

        // Animation du hamburger
        if (menuToggle) {
            menuToggle.style.transform = 'rotate(90deg)';
        }

        // Focus management pour l'accessibilité
        const firstFocusable = this.getFocusableElements()[0];
        if (firstFocusable) {
            setTimeout(() => firstFocusable.focus(), 300);
        }

        // Track analytics
        this.trackEvent('menu_open');
    }

    closePanel() {
        const sidePanel = document.getElementById('sidePanel');
        const panelOverlay = document.getElementById('panelOverlay');
        const menuToggle = document.getElementById('menuToggle');
        
        sidePanel.classList.remove('open');
        panelOverlay.classList.remove('show');
        document.body.style.overflow = 'auto';
        this.isPanelOpen = false;

        // Réinitialisation du hamburger
        if (menuToggle) {
            menuToggle.style.transform = 'scale(1)';
        }

        // Retour du focus au bouton menu
        menuToggle.focus();
    }

    async loadNavigationData() {
        try {
            // Charger les données dynamiques pour la navigation
            const [services, news] = await Promise.all([
                this.loadServices(),
                this.loadLatestNews()
            ]);

            this.updateServicesMenu(services);
            this.updateNewsMenu(news);
        } catch (error) {
            console.error('Erreur chargement navigation:', error);
        }
    }

    async loadServices() {
        try {
            const response = await chuApp.apiCall('/services');
            return response.data || [];
        } catch (error) {
            return this.getDefaultServices();
        }
    }

    async loadLatestNews() {
        try {
            const response = await chuApp.apiCall('/news/latest');
            return response.data || [];
        } catch (error) {
            return [];
        }
    }

    getDefaultServices() {
        return [
            { id: 1, name: 'Cardiologie', slug: 'cardio' },
            { id: 2, name: 'Pédiatrie', slug: 'pediatrie' },
            { id: 3, name: 'Chirurgie', slug: 'chirurgie' },
            { id: 4, name: 'Neurologie', slug: 'neurologie' }
        ];
    }

    updateServicesMenu(services) {
        const servicesMenu = document.getElementById('services-menu');
        if (servicesMenu && services.length > 0) {
            servicesMenu.innerHTML = services.map(service => `
                <a class="dropdown-item" href="services.html#${service.slug}">
                    <i class="fas fa-arrow-right me-2"></i>${service.name}
                </a>
            `).join('');
        }
    }

    updateNewsMenu(news) {
        const newsMenu = document.getElementById('news-menu');
        if (newsMenu && news.length > 0) {
            newsMenu.innerHTML = news.slice(0, 3).map(item => `
                <a class="dropdown-item" href="actualites.html#${item.id}">
                    <small>${chuApp.formatDate(item.date)}</small><br>
                    ${item.title}
                </a>
            `).join('');
        }
    }

    // Navigation programmatique
    navigateTo(page, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const url = `pages/${page}.html${queryString ? '?' + queryString : ''}`;
        
        this.trackNavigation(page);
        window.location.href = url;
    }

    trackNavigation(page) {
        // Analytics
        if (typeof gtag !== 'undefined') {
            gtag('event', 'page_view', {
                page_title: page,
                page_location: window.location.href
            });
        }
    }

    trackEvent(action, category = 'navigation') {
        // Analytics
        if (typeof gtag !== 'undefined') {
            gtag('event', action, {
                event_category: category,
                event_label: window.location.pathname
            });
        }
    }

    // Gestion du breadcrumb
    updateBreadcrumb(paths) {
        const breadcrumb = document.getElementById('breadcrumb');
        if (breadcrumb) {
            breadcrumb.innerHTML = paths.map((path, index) => `
                <li class="breadcrumb-item ${index === paths.length - 1 ? 'active' : ''}">
                    ${index === paths.length - 1 ? 
                        `<span class="text-primary">${path.name}</span>` : 
                        `<a href="${path.url}" class="text-decoration-none">${path.name}</a>`
                    }
                </li>
            `).join('');
        }
    }

    // Gestion de l'historique
    addToHistory(state, title, url) {
        window.history.pushState(state, title, url);
    }

    // Utilitaires d'URL
    getUrlParams() {
        const urlParams = new URLSearchParams(window.location.search);
        const params = {};
        for (const [key, value] of urlParams) {
            params[key] = value;
        }
        return params;
    }

    updateUrlParams(params) {
        const url = new URL(window.location);
        Object.keys(params).forEach(key => {
            url.searchParams.set(key, params[key]);
        });
        window.history.replaceState({}, '', url);
    }
}

// Initialisation navigation
const navigation = new NavigationManager();

// Gestion du retour navigateur
window.addEventListener('popstate', (event) => {
    // Recharger les données si nécessaire
    if (event.state && event.state.page) {
        navigation.loadNavigationData();
    }
});

// Export pour utilisation dans d'autres modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { NavigationManager };
}