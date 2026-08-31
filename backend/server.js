/**
 * ================================================
 * CHU YAOUNDÉ - SERVEUR BACKEND PRINCIPAL
 * ================================================
 * Version: 2.0.0
 * Description: API REST sécurisée pour la gestion hospitalière
 * Auteur: Système de Gestion CHU Yaoundé
 */

const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");
const compression = require("compression");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const path = require("path");

// Charger les variables d'environnement
dotenv.config();

// Connexion à la base de données
const connectDB = require("./config/database");
connectDB();

const app = express();

// =====================================
// MIDDLEWARES DE SÉCURITÉ
// =====================================

// Helmet pour sécuriser les headers HTTP
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  }),
);

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // En développement : accepter tout localhost/127.0.0.1 quel que soit le port
    if (process.env.NODE_ENV === "development") {
      if (!origin) return callback(null, true);
      if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
        return callback(null, true);
      }
    }
    // En production : vérifier ALLOWED_ORIGINS
    const allowedOrigins = (
      process.env.ALLOWED_ORIGINS || "http://localhost:5000"
    )
      .split(",")
      .map((o) => o.trim());
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Non autorisé par CORS"));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); // Enable pre-flight

// Body parser
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// Sanitization contre NoSQL injection
app.use(mongoSanitize());

// Protection XSS
app.use(xss());

// Protection contre HTTP Parameter Pollution
app.use(
  hpp({
    whitelist: ["status", "service", "date", "sort", "limit", "page", "fields"],
  }),
);

// Compression des réponses
app.use(compression());

// Logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

// Servir les fichiers statiques (uploads)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Servir le frontend statique depuis ../frontend
const frontendPath = path.join(__dirname, "../frontend");
app.use(express.static(frontendPath));

// Servir le panel admin depuis ../admin-panel
const adminPanelPath = path.join(__dirname, "../admin-panel");
app.use("/admin-panel", express.static(adminPanelPath));

// =====================================
// RATE LIMITING
// =====================================

// Rate limiter général
const generalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    success: false,
    message: "Trop de requêtes depuis cette IP, veuillez réessayer plus tard.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter strict pour l'authentification
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 tentatives max
  skipSuccessfulRequests: true,
  message: {
    success: false,
    message:
      "Trop de tentatives de connexion. Veuillez réessayer dans 15 minutes.",
  },
});

// Rate limiter pour les urgences (plus permissif)
const emergencyLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10,
  message: {
    success: false,
    message: "Trop de signalements d'urgence. Contactez directement le 119.",
  },
});

// Le rate limiter global est désactivé en dehors de la production : le
// serveur de dev (`npm run dev`) est celui utilisé pour lancer la suite de
// tests (voir tests/helpers.js, qui envoie de vraies requêtes HTTP à
// localhost:5000). Avec max=100/15min, la suite de tests dépasse le seuil
// en quelques secondes et tout se met à répondre 429, masquant les vrais
// codes de statut attendus (200/400/401...).
if (process.env.NODE_ENV === "production") {
  app.use("/api/", generalLimiter);
}

// =====================================
// ROUTES - Avec gestion d'erreur
// =====================================

// Route racine → servir le frontend
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

// Route de santé (health check)
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API CHU Yaoundé opérationnelle",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    database: "Connected",
  });
});

// Fonction helper pour charger les routes
const loadRoute = (path, routePath) => {
  try {
    const route = require(path);
    if (route && typeof route === "function") {
      app.use(routePath, route);
      console.log(`✅ Route chargée: ${routePath}`);
    } else {
      console.error(`❌ Erreur: ${path} n'exporte pas un router valide`);
    }
  } catch (error) {
    console.error(`❌ Erreur chargement route ${routePath}:`, error.message);
  }
};

// Route testimonials (données statiques)
app.get("/api/testimonials", (req, res) => {
  res.status(200).json({
    success: true,
    count: 0,
    data: [],
  });
});

// Charger toutes les routes
loadRoute("./routes/auth", "/api/auth");
loadRoute("./routes/emergencies", "/api/emergencies");
loadRoute("./routes/appointments", "/api/appointments");
loadRoute("./routes/contacts", "/api/contacts");
loadRoute("./routes/news", "/api/news");
loadRoute("./routes/services", "/api/services");
loadRoute("./routes/users", "/api/users");
loadRoute("./routes/admin", "/api/admin");
loadRoute("./routes/chatbot", "/api/chatbot");
loadRoute("./routes/documents", "/api/documents");
loadRoute("./routes/presentation", "/api/presentation");
loadRoute("./routes/patients", "/api/patients");
loadRoute("./routes/newsletter", "/api/newsletter");
loadRoute("./routes/internships", "/api/internships");
loadRoute("./routes/trainings", "/api/trainings");
loadRoute("./routes/contests", "/api/contests");
loadRoute("./routes/personnel", "/api/personnel");

// Route 404 : pour les routes API inconnues → JSON
// Pour les autres routes (navigation HTML) → servir index.html
app.use("*", (req, res) => {
  // Si c'est une requête API, retourner JSON 404
  if (req.originalUrl.startsWith("/api/")) {
    return res.status(404).json({
      success: false,
      message: "Route non trouvée",
      path: req.originalUrl,
    });
  }
  // Si c'est une route admin-panel, servir admin.html
  if (req.originalUrl.startsWith("/admin-panel")) {
    return res.sendFile(path.join(__dirname, "../admin-panel/admin.html"));
  }
  // Sinon servir index.html (navigation côté client)
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

// =====================================
// GESTION GLOBALE DES ERREURS
// =====================================

app.use((err, req, res, next) => {
  console.error("❌ Erreur:", err);

  // Erreur Mongoose CastError
  if (err.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: "Ressource non trouvée - ID invalide",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }

  // Erreur de validation Mongoose
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      success: false,
      message: "Erreur de validation",
      errors: messages,
    });
  }

  // Erreur de duplication MongoDB
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(400).json({
      success: false,
      message: `Cette valeur pour ${field} existe déjà dans la base de données`,
    });
  }

  // Erreur JWT
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      message: "Token invalide. Veuillez vous reconnecter.",
    });
  }

  // Erreur JWT expirée
  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      message: "Session expirée. Veuillez vous reconnecter.",
    });
  }

  // Erreur CORS
  if (err.message === "Non autorisé par CORS") {
    return res.status(403).json({
      success: false,
      message: "Accès refusé - Origine non autorisée",
    });
  }

  // Erreur de taille de fichier
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      success: false,
      message: "Fichier trop volumineux. Maximum 5 MB.",
    });
  }

  // Erreur générique
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || "Erreur serveur interne",
    error: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
});

// =====================================
// DÉMARRAGE DU SERVEUR
// =====================================

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════╗
║                                                   ║
║         🏥 CHU YAOUNDÉ - BACKEND API 🏥          ║
║                                                   ║
╠═══════════════════════════════════════════════════╣
║                                                   ║
║   📍 Environnement: ${(process.env.NODE_ENV || "development").padEnd(30)}  ║
║   🔌 Port:          ${PORT.toString().padEnd(30)}  ║
║   ✅ Statut:        OPÉRATIONNEL                  ║
║   🕐 Démarrage:     ${new Date().toLocaleString("fr-FR").padEnd(30)}  ║
║                                                   ║
╚═══════════════════════════════════════════════════╝
  `);

  console.log(`\n🌐 API accessible sur: http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health\n`);
});

// Gestion de l'arrêt gracieux
process.on("unhandledRejection", (err) => {
  console.error("❌ ERREUR NON GÉRÉE (Unhandled Rejection):", err);
  server.close(() => {
    console.log("🛑 Serveur arrêté suite à une erreur non gérée");
    process.exit(1);
  });
});

process.on("uncaughtException", (err) => {
  console.error("❌ EXCEPTION NON CAPTURÉE:", err);
  console.log("🛑 Arrêt du serveur...");
  process.exit(1);
});

process.on("SIGTERM", () => {
  console.log("📡 Signal SIGTERM reçu. Fermeture gracieuse du serveur...");
  server.close(() => {
    console.log("✅ Serveur arrêté proprement");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("\n📡 Signal SIGINT reçu (Ctrl+C). Fermeture du serveur...");
  server.close(() => {
    console.log("✅ Serveur arrêté proprement");
    process.exit(0);
  });
});

module.exports = app;
