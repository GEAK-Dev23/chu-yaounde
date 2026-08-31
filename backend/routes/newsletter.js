/**
 * ================================================
 * ROUTES NEWSLETTER
 * ================================================
 * Abonnement, désabonnement et gestion admin
 */

const express = require("express");
const router = express.Router();
const Newsletter = require("../models/Newsletter");
const { protect, authorize } = require("../middleware/auth");

/**
 * @route   POST /api/newsletter/subscribe
 * @desc    S'abonner à la newsletter
 * @access  Public
 */
router.post("/subscribe", async (req, res) => {
  try {
    const { email, nom } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: "Email requis" });
    }

    // Vérifier si l'email existe déjà
    let subscriber = await Newsletter.findOne({ email: email.toLowerCase() });

    if (subscriber) {
      if (subscriber.isActive) {
        return res.status(400).json({
          success: false,
          message: "Cet email est déjà abonné à la newsletter",
        });
      } else {
        // Réactiver l'abonnement
        subscriber.isActive = true;
        subscriber.unsubscribedAt = null;
        subscriber.confirmedAt = new Date();
        await subscriber.save();

        return res.status(200).json({
          success: true,
          message: "Votre abonnement a été réactivé avec succès",
        });
      }
    }

    // Créer un nouvel abonné
    subscriber = await Newsletter.create({
      email: email.toLowerCase(),
      nom: nom || "",
      isActive: true,
      confirmedAt: new Date(),
      source: "website",
    });

    res.status(201).json({
      success: true,
      message: "Merci pour votre abonnement à la newsletter du CHU Yaoundé !",
      data: { email: subscriber.email },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Cet email est déjà abonné",
      });
    }
    res.status(500).json({
      success: false,
      message: "Erreur lors de l'abonnement",
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/newsletter/unsubscribe
 * @desc    Se désabonner de la newsletter
 * @access  Public
 */
router.post("/unsubscribe", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: "Email requis" });
    }

    const subscriber = await Newsletter.findOne({ email: email.toLowerCase() });

    if (!subscriber || !subscriber.isActive) {
      return res.status(404).json({
        success: false,
        message: "Email non trouvé dans notre liste d'abonnés",
      });
    }

    subscriber.isActive = false;
    subscriber.unsubscribedAt = new Date();
    await subscriber.save();

    res.status(200).json({
      success: true,
      message: "Vous avez été désabonné avec succès",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors du désabonnement",
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/newsletter
 * @desc    Liste de tous les abonnés (admin)
 * @access  Private (admin)
 */
router.get("/", protect, authorize("admin"), async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const skip = (page - 1) * limit;

    const query = {};
    if (status === "active") query.isActive = true;
    if (status === "inactive") query.isActive = false;
    if (search) {
      query.$or = [
        { email: { $regex: search, $options: "i" } },
        { nom: { $regex: search, $options: "i" } },
      ];
    }

    const [subscribers, total] = await Promise.all([
      Newsletter.find(query)
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(skip),
      Newsletter.countDocuments(query),
    ]);

    const totalActive = await Newsletter.countDocuments({ isActive: true });
    const totalInactive = await Newsletter.countDocuments({ isActive: false });

    res.status(200).json({
      success: true,
      count: subscribers.length,
      total,
      totalActive,
      totalInactive,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: subscribers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des abonnés",
      error: error.message,
    });
  }
});

/**
 * @route   DELETE /api/newsletter/:id
 * @desc    Supprimer un abonné (admin)
 * @access  Private (admin)
 */
router.delete("/:id", protect, authorize("admin"), async (req, res) => {
  try {
    const subscriber = await Newsletter.findByIdAndDelete(req.params.id);

    if (!subscriber) {
      return res
        .status(404)
        .json({ success: false, message: "Abonné non trouvé" });
    }

    res.status(200).json({
      success: true,
      message: "Abonné supprimé",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la suppression",
      error: error.message,
    });
  }
});

/**
 * @route   PATCH /api/newsletter/:id/toggle
 * @desc    Activer/désactiver un abonné (admin)
 * @access  Private (admin)
 */
router.patch("/:id/toggle", protect, authorize("admin"), async (req, res) => {
  try {
    const subscriber = await Newsletter.findById(req.params.id);

    if (!subscriber) {
      return res
        .status(404)
        .json({ success: false, message: "Abonné non trouvé" });
    }

    subscriber.isActive = !subscriber.isActive;
    if (!subscriber.isActive) {
      subscriber.unsubscribedAt = new Date();
    } else {
      subscriber.unsubscribedAt = null;
      subscriber.confirmedAt = new Date();
    }
    await subscriber.save();

    res.status(200).json({
      success: true,
      message: subscriber.isActive ? "Abonné réactivé" : "Abonné désactivé",
      data: subscriber,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur",
      error: error.message,
    });
  }
});

module.exports = router;
