/**
 * ================================================
 * MIDDLEWARE D'AUTHENTIFICATION JWT
 * ================================================
 */

const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * Protège les routes - Vérifie le token JWT
 */
exports.protect = async (req, res, next) => {
  try {
    let token;

    // 1. Vérifier si le token existe dans les headers
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }
    // 2. Ou dans les cookies
    else if (req.cookies.token) {
      token = req.cookies.token;
    }

    // Vérifier que le token existe
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Non autorisé - Aucun token fourni",
      });
    }

    try {
      // 3. Vérifier et décoder le token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 4. Récupérer l'utilisateur
      req.user = await User.findById(decoded.id).select("-password");

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Utilisateur non trouvé",
        });
      }

      // Vérifier si l'utilisateur est actif
      if (req.user.status === "inactive") {
        return res.status(401).json({
          success: false,
          message: "Compte désactivé",
        });
      }

      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: "Token invalide ou expiré",
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur d'authentification",
      error: error.message,
    });
  }
};

/**
 * Vérifier les rôles autorisés
 */
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Non authentifié",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Accès refusé - Rôle ${req.user.role} non autorisé`,
      });
    }

    next();
  };
};

/**
 * Middleware optionnel - Ne bloque pas si pas de token
 */
exports.optional = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies.token) {
      token = req.cookies.token;
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id).select("-password");
      } catch (error) {
        // Token invalide mais on continue quand même
        req.user = null;
      }
    }

    next();
  } catch (error) {
    next();
  }
};

/**
 * Vérifier si l'utilisateur est admin
 */
exports.isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Accès réservé aux administrateurs",
    });
  }
  next();
};

/**
 * Vérifier si l'utilisateur est staff médical
 */
exports.isStaff = (req, res, next) => {
  if (
    !req.user ||
    !["admin", "doctor", "nurse", "staff"].includes(req.user.role)
  ) {
    return res.status(403).json({
      success: false,
      message: "Accès réservé au personnel médical",
    });
  }
  next();
};

/**
 * Générer un token JWT
 */
exports.generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "30d",
  });
};

/**
 * Envoyer la réponse avec le token
 */
exports.sendTokenResponse = (user, statusCode, res) => {
  // Créer le token
  const token = exports.generateToken(user._id);

  const options = {
    expires: new Date(
      Date.now() +
        (parseInt(process.env.JWT_COOKIE_EXPIRE) || 30) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  };

  // Retirer le mot de passe de l'objet user
  const userResponse = user.toObject();
  delete userResponse.password;

  res.status(statusCode).cookie("token", token, options).json({
    success: true,
    token,
    user: userResponse,
  });
};
