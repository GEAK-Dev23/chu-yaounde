/**
 * ================================================
 * MIDDLEWARE DE VALIDATION
 * ================================================
 */

const { body, param, query, validationResult } = require("express-validator");

/**
 * Gère les résultats de validation
 */
exports.validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Erreur de validation",
      errors: errors.array().map((err) => ({
        field: err.path,
        message: err.msg,
      })),
    });
  }
  next();
};

/**
 * Validation pour la création de rendez-vous
 */
exports.validateAppointment = [
  body("patient.firstName")
    .trim()
    .notEmpty()
    .withMessage("Le prénom est requis")
    .isLength({ max: 50 })
    .withMessage("Prénom trop long"),

  body("patient.lastName")
    .trim()
    .notEmpty()
    .withMessage("Le nom est requis")
    .isLength({ max: 50 })
    .withMessage("Nom trop long"),

  body("patient.email")
    .trim()
    .isEmail()
    .withMessage("Email invalide")
    .normalizeEmail(),

  body("patient.phone")
    .trim()
    .notEmpty()
    .withMessage("Le téléphone est requis")
    .matches(/^[+]?[\d\s()./-]{7,20}$/)
    .withMessage("Numéro de téléphone invalide"),

  body("patient.birthDate")
    .notEmpty()
    .withMessage("La date de naissance est requise")
    .isISO8601()
    .withMessage("Format de date invalide"),

  body("service")
    .notEmpty()
    .withMessage("Le service est requis")
    .custom(async (value) => {
      // Validation dynamique : vérifier que le service existe et est disponible en BDD
      const Service = require("../models/Service");
      const svc = await Service.findOne({ slug: value, available: true });
      if (!svc) {
        throw new Error("Service invalide ou non disponible");
      }
      return true;
    }),

  body("doctor.id").notEmpty().withMessage("Le médecin est requis"),

  body("doctor.name").notEmpty().withMessage("Le nom du médecin est requis"),

  body("appointmentDate")
    .notEmpty()
    .withMessage("La date du rendez-vous est requise")
    .isISO8601()
    .withMessage("Format de date invalide")
    .custom((value) => {
      const date = new Date(value);
      // Comparer uniquement les dates (sans l'heure) pour accepter le jour même
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (date < today) {
        throw new Error("La date doit être aujourd'hui ou dans le futur");
      }
      return true;
    }),

  body("appointmentTime")
    .notEmpty()
    .withMessage("L'heure est requise")
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage("Format d'heure invalide (HH:MM)"),

  body("reason")
    .optional()
    .isLength({ max: 500 })
    .withMessage("Motif trop long (max 500 caractères)"),
];

/**
 * Validation pour le contact
 */
exports.validateContact = [
  body("firstName")
    .trim()
    .notEmpty()
    .withMessage("Le prénom est requis")
    .isLength({ max: 50 })
    .withMessage("Prénom trop long"),

  body("lastName")
    .trim()
    .notEmpty()
    .withMessage("Le nom est requis")
    .isLength({ max: 50 })
    .withMessage("Nom trop long"),

  body("email").trim().isEmail().withMessage("Email invalide").normalizeEmail(),

  body("phone")
    .optional()
    .trim()
    .matches(/^[+]?[\d\s()./-]{7,20}$/)
    .withMessage("Numéro de téléphone invalide"),

  body("subject")
    .trim()
    .notEmpty()
    .withMessage("Le sujet est requis")
    .isIn([
      "appointment",
      "information",
      "emergency",
      "complaint",
      "partnership",
      "other",
    ])
    .withMessage("Sujet invalide"),

  body("message")
    .trim()
    .notEmpty()
    .withMessage("Le message est requis")
    .isLength({ min: 10, max: 2000 })
    .withMessage("Le message doit contenir entre 10 et 2000 caractères"),

  body("gdprConsent")
    .custom((value) => value === true || value === "true")
    .withMessage("Vous devez accepter la politique de confidentialité"),

  body("category")
    .optional()
    .isIn([
      "information",
      "appointment",
      "complaint",
      "suggestion",
      "emergency",
      "other",
    ])
    .withMessage("Catégorie invalide"),
];

/**
 * Validation pour les urgences
 */
exports.validateEmergency = [
  body("firstName").trim().notEmpty().withMessage("Le prénom est requis"),

  body("lastName").trim().notEmpty().withMessage("Le nom est requis"),

  body("age")
    .notEmpty()
    .withMessage("L'âge est requis")
    .isInt({ min: 0, max: 150 })
    .withMessage("L'âge invalide"),

  body("gender")
    .notEmpty()
    .withMessage("Le sexe est requis")
    .isIn(["M", "F", "Autre"])
    .withMessage("Sexe invalide"),

  body("phone")
    .trim()
    .notEmpty()
    .withMessage("Le téléphone est requis")
    .matches(/^[+]?[\d\s()./-]{7,20}$/)
    .withMessage("Numéro de téléphone invalide"),

  body("symptoms")
    .trim()
    .notEmpty()
    .withMessage("Les symptômes sont requis")
    .isLength({ max: 500 })
    .withMessage("Description trop longue (max 500 caractères)"),

  body("emergencyType")
    .notEmpty()
    .withMessage("Le type d'urgence est requis")
    .isIn(["cardiac", "trauma", "neurological", "respiratory", "other"])
    .withMessage("Type d'urgence invalide"),

  body("severity")
    .notEmpty()
    .withMessage("Le niveau de gravité est requis")
    .isInt({ min: 1, max: 5 })
    .withMessage("Niveau de gravité invalide (1 à 5)"),
];

/**
 * Validation pour l'inscription
 */
exports.validateRegister = [
  body("firstName")
    .trim()
    .notEmpty()
    .withMessage("Le prénom est requis")
    .isLength({ max: 50 })
    .withMessage("Prénom trop long"),

  body("lastName")
    .trim()
    .notEmpty()
    .withMessage("Le nom est requis")
    .isLength({ max: 50 })
    .withMessage("Nom trop long"),

  body("email")
    .trim()
    .isEmail()
    .withMessage("Email invalide")
    .normalizeEmail()
    .toLowerCase(),

  body("password")
    .isLength({ min: 8 })
    .withMessage("Le mot de passe doit contenir au moins 8 caractères")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre",
    ),

  body("phone")
    .optional()
    .trim()
    .matches(/^[+]?[\d\s()./-]{7,20}$/)
    .withMessage("Numéro de téléphone invalide"),

  body("role")
    .optional()
    .isIn(["patient", "doctor", "nurse", "admin", "staff"])
    .withMessage("Rôle invalide"),
];

/**
 * Validation pour la connexion
 */
exports.validateLogin = [
  body("email").trim().isEmail().withMessage("Email invalide").normalizeEmail(),

  body("password").notEmpty().withMessage("Le mot de passe est requis"),
];

/**
 * Validation pour les actualités
 */
exports.validateNews = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Le titre est requis")
    .isLength({ max: 200 })
    .withMessage("Titre trop long"),

  body("content")
    .trim()
    .notEmpty()
    .withMessage("Le contenu est requis")
    .isLength({ min: 10 })
    .withMessage("Le contenu doit contenir au moins 10 caractères"),

  body("category")
    .optional()
    .isIn(["actualite", "evenement", "publication"])
    .withMessage("Catégorie invalide (actualite, evenement, publication)"),

  body("excerpt")
    .optional()
    .isLength({ max: 500 })
    .withMessage("L'extrait est trop long"),

  body("tags")
    .optional()
    .isArray()
    .withMessage("Les tags doivent être un tableau"),

  body("published")
    .optional()
    .isBoolean()
    .withMessage("Le statut de publication doit être un booléen"),

  body("authorName")
    .optional()
    .isLength({ max: 150 })
    .withMessage("Le nom de l'auteur est trop long"),

  body("pdf")
    .optional()
    .isString()
    .withMessage("Le PDF doit être un chemin valide"),
];

/**
 * Validation pour les services
 */
exports.validateService = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Le nom du service est requis")
    .isLength({ max: 100 })
    .withMessage("Nom trop long"),

  body("description")
    .optional()
    .trim()
    .isLength({ min: 5 })
    .withMessage("La description doit contenir au moins 5 caractères"),

  body("department").optional().trim(),

  body("available")
    .optional()
    .isBoolean()
    .withMessage("La disponibilité doit être un booléen"),
];

/**
 * Validation de l'ID MongoDB
 */
exports.validateMongoId = [param("id").isMongoId().withMessage("ID invalide")];

/**
 * Validation de la pagination
 */
exports.validatePagination = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("La page doit être un nombre positif"),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("La limite doit être entre 1 et 100"),

  query("sort")
    .optional()
    .isString()
    .withMessage("Le tri doit être une chaîne"),
];

/**
 * Sanitize HTML pour éviter les injections XSS
 */
exports.sanitizeHtml = (req, res, next) => {
  const fieldsToSanitize = ["content", "message", "description", "notes"];

  fieldsToSanitize.forEach((field) => {
    if (req.body[field]) {
      // Enlever les balises script et autres contenus dangereux
      req.body[field] = req.body[field]
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
        .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
        .replace(/on\w+\s*=\s*"[^"]*"/gi, "")
        .replace(/on\w+\s*=\s*'[^']*'/gi, "");
    }
  });

  next();
};
