/**
 * ================================================
 * ROUTES UTILISATEURS
 * ================================================
 */

const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { protect, authorize } = require("../middleware/auth");
const { validateMongoId, validate } = require("../middleware/validation");

/**
 * @route   GET /api/users
 * @desc    Liste des utilisateurs (admin)
 * @access  Private (admin)
 */
router.get("/", protect, authorize("admin"), async (req, res) => {
  try {
    const { role, status, page = 1, limit = 20 } = req.query;

    const query = {};
    if (role) query.role = role;
    if (status) query.status = status;

    const skip = (page - 1) * limit;

    const users = await User.find(query)
      .select("-password")
      .sort("-createdAt")
      .limit(parseInt(limit))
      .skip(skip);

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      count: users.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des utilisateurs",
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/users/:id
 * @desc    Détails d'un utilisateur
 * @access  Private (admin ou propriétaire)
 */
router.get("/:id", validateMongoId, validate, protect, async (req, res) => {
  try {
    // Vérifier les permissions
    if (
      req.user.role !== "admin" &&
      req.user._id.toString() !== req.params.id
    ) {
      return res.status(403).json({
        success: false,
        message: "Accès non autorisé",
      });
    }

    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur non trouvé",
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération de l'utilisateur",
      error: error.message,
    });
  }
});

/**
 * @route   PUT /api/users/:id
 * @desc    Modifier un utilisateur
 * @access  Private (admin ou propriétaire)
 */
router.put("/:id", validateMongoId, validate, protect, async (req, res) => {
  try {
    // Vérifier les permissions
    if (
      req.user.role !== "admin" &&
      req.user._id.toString() !== req.params.id
    ) {
      return res.status(403).json({
        success: false,
        message: "Accès non autorisé",
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur non trouvé",
      });
    }

    // Champs modifiables par l'utilisateur lui-même
    const userFields = ["firstName", "lastName", "phone", "address"];

    // Champs réservés admin
    const adminFields = ["role", "status"];

    const updates = {};

    // Autoriser les champs utilisateur
    userFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    // Autoriser les champs admin seulement pour admin
    if (req.user.role === "admin") {
      adminFields.forEach((field) => {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      });
    }

    const updatedUser = await User.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    }).select("-password");

    res.status(200).json({
      success: true,
      message: "Profil mis à jour",
      data: updatedUser,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour",
      error: error.message,
    });
  }
});

/**
 * @route   DELETE /api/users/:id
 * @desc    Supprimer un utilisateur
 * @access  Private (admin)
 */
router.delete(
  "/:id",
  validateMongoId,
  validate,
  protect,
  authorize("admin"),
  async (req, res) => {
    try {
      const user = await User.findById(req.params.id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Utilisateur non trouvé",
        });
      }

      // Empêcher la suppression du dernier admin
      if (user.role === "admin") {
        const adminCount = await User.countDocuments({ role: "admin" });
        if (adminCount <= 1) {
          return res.status(400).json({
            success: false,
            message: "Impossible de supprimer le dernier administrateur",
          });
        }
      }

      await user.deleteOne();

      res.status(200).json({
        success: true,
        message: "Utilisateur supprimé",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Erreur lors de la suppression",
        error: error.message,
      });
    }
  },
);

module.exports = router;
