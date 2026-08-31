/**
 * CONFIGURATION GLOBALE FRONTEND
 */

// Détection automatique de l'URL de l'API selon l'environnement
function detectApiBaseUrl() {
    const hostname = window.location.hostname;
    // Si on est en local (dev)
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'http://localhost:5000/api';
    }
    // En production : même domaine, port 5000, ou variable d'environnement injectée
    if (window.__API_BASE_URL__) return window.__API_BASE_URL__;
    // Fallback : même origine avec /api
    return window.location.origin + '/api';
}

const APP_CONFIG = {
    // URL de base de l'API (détectée automatiquement)
    API_BASE_URL: detectApiBaseUrl(),
    
    // Informations de l'application
    APP_NAME: 'CHU Yaoundé',
    VERSION: '2.0.0',
    
    // Langue par défaut
    DEFAULT_LANGUAGE: 'fr',
    SUPPORTED_LANGUAGES: ['fr', 'en'],
    
    // Endpoints API
    ENDPOINTS: {
        AUTH: '/auth',
        PATIENTS: '/patients',
        APPOINTMENTS: '/appointments',
        SERVICES: '/services',
        NEWS: '/news',
        EMERGENCIES: '/emergencies',
        CONTACTS: '/contacts',
        PRESENTATION: '/presentation',
        CHATBOT: '/chatbot',
        DOCUMENTS: '/documents'
    },
    
    // Timeouts
    REQUEST_TIMEOUT: 30000, // 30 secondes
    
    // Clés de stockage local
    STORAGE_KEYS: {
        TOKEN: 'patient_token',
        USER_DATA: 'patient_data',
        LANGUAGE: 'app_language',
        THEME: 'app_theme'
    },
    
    // Configuration de pagination
    PAGINATION: {
        DEFAULT_PAGE_SIZE: 10,
        MAX_PAGE_SIZE: 100
    },
    
    // Messages par défaut
    MESSAGES: {
        ERROR: {
            NETWORK: 'Erreur de connexion au serveur. Veuillez réessayer.',
            UNAUTHORIZED: 'Vous devez être connecté pour accéder à cette ressource.',
            FORBIDDEN: 'Vous n\'avez pas les permissions nécessaires.',
            NOT_FOUND: 'Ressource non trouvée.',
            SERVER_ERROR: 'Erreur serveur. Veuillez réessayer plus tard.',
            VALIDATION: 'Les données fournies sont invalides.'
        },
        SUCCESS: {
            SAVE: 'Enregistrement réussi!',
            UPDATE: 'Mise à jour réussie!',
            DELETE: 'Suppression réussie!',
            LOGIN: 'Connexion réussie!',
            LOGOUT: 'Déconnexion réussie!',
            REGISTER: 'Inscription réussie!'
        }
    },
    
    // Formats de date
    DATE_FORMATS: {
        DISPLAY: 'DD/MM/YYYY',
        DISPLAY_WITH_TIME: 'DD/MM/YYYY HH:mm',
        API: 'YYYY-MM-DD',
        API_WITH_TIME: 'YYYY-MM-DDTHH:mm:ss'
    },
    
    // Validation
    VALIDATION: {
        EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        PHONE_REGEX: /^\+?237?[0-9]{9}$/,
        PASSWORD_MIN_LENGTH: 6,
        PASSWORD_MAX_LENGTH: 50
    },
    
    // URLs des réseaux sociaux
    SOCIAL_MEDIA: {
        FACEBOOK: 'https://facebook.com/chuyaounde',
        TWITTER: 'https://twitter.com/chuyaounde',
        INSTAGRAM: 'https://instagram.com/chuyaounde',
        LINKEDIN: 'https://linkedin.com/company/chuyaounde'
    }
};

// Helper pour obtenir l'URL complète d'un endpoint
function getApiUrl(endpoint) {
    return APP_CONFIG.API_BASE_URL + endpoint;
}

// Helper pour obtenir le token stocké
function getAuthToken() {
    return localStorage.getItem(APP_CONFIG.STORAGE_KEYS.TOKEN);
}

// Helper pour vérifier si l'utilisateur est connecté
function isAuthenticated() {
    return !!getAuthToken();
}

// Helper pour formater une date
function formatDate(date, format = APP_CONFIG.DATE_FORMATS.DISPLAY) {
    // Implémentation simple - peut être améliorée avec une bibliothèque comme moment.js
    if (!date) return '';
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    
    if (format === APP_CONFIG.DATE_FORMATS.DISPLAY) {
        return `${day}/${month}/${year}`;
    }
    return date;
}

// Export pour utilisation
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        APP_CONFIG,
        getApiUrl,
        getAuthToken,
        isAuthenticated,
        formatDate
    };
}
