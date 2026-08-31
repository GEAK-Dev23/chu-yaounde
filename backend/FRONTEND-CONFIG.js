/**
 * ================================================
 * CONFIGURATION FRONTEND - CHU Yaoundé
 * ================================================
 * 
 * IMPORTANT: Modifiez API_BASE_URL selon votre environnement
 */

// ⚠️ CONFIGURATION DE L'URL DE L'API ⚠️
// Changez cette URL selon votre environnement:

// Pour développement local (backend sur port 5000):
const API_BASE_URL = "http://localhost:5000/api";

// Pour production (remplacez par votre URL Render/Heroku/etc):
// const API_BASE_URL = "https://chu-yaounde-api.onrender.com/api";

// ================================================

/**
 * Configuration globale de l'application
 */
window.CHU_CONFIG = {
  // URL de base de l'API
  apiBaseUrl: API_BASE_URL,
  
  // Nom de l'application
  appName: "CHU Yaoundé",
  
  // Version
  version: "2.0.0",
  
  // Durée de vie du token (en ms)
  tokenExpiry: 30 * 24 * 60 * 60 * 1000, // 30 jours
  
  // Délai d'expiration des requêtes (en ms)
  requestTimeout: 30000, // 30 secondes
  
  // Pagination par défaut
  defaultPageSize: 10,
  
  // Langue par défaut
  defaultLanguage: "fr",
  
  // Formats de date
  dateFormat: {
    fr: "DD/MM/YYYY",
    en: "MM/DD/YYYY"
  },
  
  // Configuration du chatbot
  chatbot: {
    enabled: true,
    welcomeMessage: {
      fr: "Bonjour! Comment puis-je vous aider?",
      en: "Hello! How can I help you?"
    }
  },
  
  // Téléphone d'urgence
  emergencyPhone: "119",
  
  // Email de contact
  contactEmail: "contact@chuy.cm",
  
  // Réseaux sociaux
  social: {
    facebook: "https://facebook.com/chuyaounde",
    twitter: "https://twitter.com/chuyaounde",
    instagram: "https://instagram.com/chuyaounde"
  },
  
  // Configuration des uploads
  upload: {
    maxSize: 5 * 1024 * 1024, // 5 MB
    allowedTypes: ["image/jpeg", "image/png", "application/pdf"]
  },
  
  // Google Maps (optionnel)
  googleMaps: {
    apiKey: "", // Ajoutez votre clé API si nécessaire
    center: {
      lat: 3.8667,
      lng: 11.5167
    }
  }
};

/**
 * Fonction helper pour faire des requêtes API
 */
window.apiCall = async function(endpoint, options = {}) {
  const token = localStorage.getItem("chu_token");
  
  const defaultHeaders = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` })
  };
  
  const config = {
    method: "GET",
    headers: { ...defaultHeaders, ...options.headers },
    ...options
  };
  
  try {
    const response = await fetch(
      `${window.CHU_CONFIG.apiBaseUrl}${endpoint}`,
      config
    );
    
    // Gérer les erreurs HTTP
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `HTTP ${response.status}: ${response.statusText}`
      );
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("API Error:", error);
    
    // Afficher une notification d'erreur si disponible
    if (window.chuApp && window.chuApp.showNotification) {
      window.chuApp.showNotification(
        error.message || "Erreur de connexion au serveur",
        "error"
      );
    }
    
    throw error;
  }
};

/**
 * Fonction helper pour vérifier si le backend est accessible
 */
window.checkBackendHealth = async function() {
  try {
    const response = await fetch(`${API_BASE_URL.replace('/api', '')}/health`);
    const data = await response.json();
    console.log("✅ Backend accessible:", data);
    return true;
  } catch (error) {
    console.error("❌ Backend non accessible:", error);
    console.error("Vérifiez que le backend est démarré sur:", API_BASE_URL);
    return false;
  }
};

// Vérifier la connexion au backend au chargement
document.addEventListener("DOMContentLoaded", () => {
  window.checkBackendHealth();
});

console.log("📡 Configuration chargée. API URL:", window.CHU_CONFIG.apiBaseUrl);
