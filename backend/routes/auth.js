/**
 * ROUTES AUTHENTIFICATION
 * Connexion et gestion des utilisateurs admin
 */

const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const {
  protect,
  authorize,
  getSignedJwtToken,
  sendTokenResponse,
} = require("../middleware/auth");

// Modèle utilisateur simple (à étendre selon besoins)
const User = require("../models/User");

// @route   POST /api/auth/register
// @desc    Créer un compte administrateur
// @access  Private (admin uniquement)
router.post("/register", protect, authorize("admin"), async (req, res) => {
  try {
    const { email, password, role, firstName, lastName } = req.body;

    // Vérifier si l'utilisateur existe
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Cet email est déjà enregistré",
      });
    }

    // Hasher le mot de passe
    const salt = await bcrypt.genSalt(
      parseInt(process.env.BCRYPT_ROUNDS) || 10,
    );
    const hashedPassword = await bcrypt.hash(password, salt);

    // Créer l'utilisateur
    const user = await User.create({
      email: email.toLowerCase(),
      password: hashedPassword,
      role: role || "staff",
      firstName,
      lastName,
    });

    res.status(201).json({
      success: true,
      message: "Utilisateur créé avec succès",
      data: {
        id: user._id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Erreur création utilisateur:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la création de l'utilisateur",
    });
  }
});

// @route   POST /api/auth/login
// @desc    Connexion utilisateur
// @access  Public
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email et mot de passe requis",
      });
    }

    // Vérifier l'utilisateur
    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "+password",
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Identifiants invalides",
      });
    }

    // Vérifier le mot de passe
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Identifiants invalides",
      });
    }

    // Mettre à jour la dernière connexion
    user.lastLogin = Date.now();
    await user.save();

    // Envoyer le token
    sendTokenResponse(user, 200, res);
  } catch (error) {
    console.error("Erreur connexion:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la connexion",
    });
  }
});

// @route   GET /api/auth/me
// @desc    Obtenir l'utilisateur connecté
// @access  Private
router.get("/me", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Erreur récupération utilisateur:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération de l'utilisateur",
    });
  }
});

// @route   POST /api/auth/logout
// @desc    Déconnexion
// @access  Private
router.post("/logout", protect, (req, res) => {
  res.cookie("token", "none", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    message: "Déconnexion réussie",
  });
});

// @route   PUT /api/auth/updatepassword
// @desc    Mettre à jour le mot de passe
// @access  Private
router.put("/updatepassword", protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Mot de passe actuel et nouveau mot de passe requis",
      });
    }

    const user = await User.findById(req.user.id).select("+password");

    // Vérifier le mot de passe actuel
    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Mot de passe actuel incorrect",
      });
    }

    // Hasher le nouveau mot de passe
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (error) {
    console.error("Erreur mise à jour mot de passe:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour du mot de passe",
    });
  }
});

module.exports = router;
