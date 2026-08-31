/**
 * ================================================
 * ROUTES URGENCES - EMERGENCIES
 * ================================================
 */

const express = require("express");
const router = express.Router();
const Emergency = require("../models/Emergency");
const { protect, authorize } = require("../middleware/auth");
const {
  validateEmergency,
  validate,
  validateMongoId,
} = require("../middleware/validation");

// Service de notifications (optionnel)
let sendNotification;
try {
  const notifications = require("../utils/notifications");
  sendNotification = notifications.sendEmergencyNotification;
} catch (error) {
  console.warn("⚠️  Service de notifications non disponible");
  sendNotification = async () => {
    console.log("Notification simulée (service non configuré)");
  };
}

/**
 * @route   POST /api/emergencies
 * @desc    Signaler une urgence
 * @access  Public
 */
router.post("/", validateEmergency, validate, async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      age,
      gender,
      phone,
      symptoms,
      emergencyType,
      severity,
    } = req.body;

    // Créer l'urgence (le statut par défaut "waiting" et la priorité
    // auto-calculée à partir de la gravité sont gérés par le modèle)
    const emergency = await Emergency.create({
      firstName,
      lastName,
      age,
      gender,
      phone,
      symptoms,
      emergencyType,
      severity,
    });

    // Envoyer les notifications
    try {
      if (sendNotification) {
        await sendNotification(emergency);
      }
    } catch (error) {
      console.error("Erreur notification urgence:", error.message);
      // Ne pas bloquer si la notification échoue
    }

    res.status(201).json({
      success: true,
      message: "Urgence signalée avec succès. Les secours ont été alertés.",
      data: emergency,
      emergencyNumber: process.env.EMERGENCY_PHONE || "119",
    });
  } catch (error) {
    console.error("Erreur signalement urgence:", error);
    // Une erreur de validation Mongoose est une erreur du CLIENT (400),
    // pas une erreur serveur (500)
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Erreur lors du signalement de l'urgence",
        errors: Object.values(error.errors).map((e) => e.message),
      });
    }
    res.status(500).json({
      success: false,
      message: "Erreur lors du signalement de l'urgence",
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/emergencies
 * @desc    Liste des urgences (staff uniquement)
 * @access  Private (staff/admin)
 */
router.get(
  "/",
  protect,
  authorize("admin", "doctor", "nurse", "staff"),
  async (req, res) => {
    try {
      const {
        status,
        severity,
        emergencyType,
        page = 1,
        limit = 20,
        sort = "-reportedAt",
      } = req.query;

      // Construire la requête
      const query = {};
      if (status) query.status = status;
      if (severity) query.severity = severity;
      if (emergencyType) query.emergencyType = emergencyType;

      // Pagination
      const skip = (page - 1) * limit;

      // Récupérer les urgences
      const emergencies = await Emergency.find(query)
        .sort(sort)
        .limit(parseInt(limit))
        .skip(skip);

      // Compter le total
      const total = await Emergency.countDocuments(query);

      res.status(200).json({
        success: true,
        count: emergencies.length,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        data: emergencies,
      });
    } catch (error) {
      console.error("Erreur récupération urgences:", error);
      res.status(500).json({
        success: false,
        message: "Erreur lors de la récupération des urgences",
        error: error.message,
      });
    }
  },
);

/**
 * @route   GET /api/emergencies/:id
 * @desc    Détails d'une urgence
 * @access  Private (staff/admin)
 */
router.get(
  "/:id",
  validateMongoId,
  validate,
  protect,
  authorize("admin", "doctor", "nurse", "staff"),
  async (req, res) => {
    try {
      const emergency = await Emergency.findById(req.params.id);

      if (!emergency) {
        return res.status(404).json({
          success: false,
          message: "Urgence non trouvée",
        });
      }

      res.status(200).json({
        success: true,
        data: emergency,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Erreur lors de la récupération de l'urgence",
        error: error.message,
      });
    }
  },
);

/**
 * @route   PUT /api/emergencies/:id/status
 * @desc    Mettre à jour le statut d'une urgence
 * @access  Private (staff/admin)
 */
router.put(
  "/:id/status",
  validateMongoId,
  validate,
  protect,
  authorize("admin", "doctor", "nurse", "staff"),
  async (req, res) => {
    try {
      const { status, notes, respondedBy } = req.body;

      // Valider le statut
      const validStatuses = [
        "pending",
        "dispatched",
        "in_progress",
        "resolved",
        "cancelled",
      ];

      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Statut invalide. Valeurs possibles: ${validStatuses.join(", ")}`,
        });
      }

      const emergency = await Emergency.findById(req.params.id);

      if (!emergency) {
        return res.status(404).json({
          success: false,
          message: "Urgence non trouvée",
        });
      }

      // Mettre à jour
      emergency.status = status;
      if (notes) emergency.notes = notes;
      if (respondedBy) emergency.respondedBy = respondedBy;

      // Enregistrer l'heure de résolution
      if (status === "resolved") {
        emergency.resolvedAt = Date.now();
      }

      await emergency.save();

      res.status(200).json({
        success: true,
        message: "Statut mis à jour avec succès",
        data: emergency,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Erreur lors de la mise à jour",
        error: error.message,
      });
    }
  },
);

/**
 * @route   DELETE /api/emergencies/:id
 * @desc    Supprimer une urgence (admin uniquement)
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
      const emergency = await Emergency.findById(req.params.id);

      if (!emergency) {
        return res.status(404).json({
          success: false,
          message: "Urgence non trouvée",
        });
      }

      await emergency.deleteOne();

      res.status(200).json({
        success: true,
        message: "Urgence supprimée",
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

/**
 * @route   GET /api/emergencies/stats/overview
 * @desc    Statistiques des urgences (admin)
 * @access  Private (admin/staff)
 */
router.get(
  "/stats/overview",
  protect,
  authorize("admin", "doctor", "nurse", "staff"),
  async (req, res) => {
    try {
      const stats = {
        total: await Emergency.countDocuments(),
        pending: await Emergency.countDocuments({ status: "pending" }),
        inProgress: await Emergency.countDocuments({ status: "in_progress" }),
        resolved: await Emergency.countDocuments({ status: "resolved" }),
        bySeverity: {
          critical: await Emergency.countDocuments({ severity: "critical" }),
          high: await Emergency.countDocuments({ severity: "high" }),
          medium: await Emergency.countDocuments({ severity: "medium" }),
          low: await Emergency.countDocuments({ severity: "low" }),
        },
        today: await Emergency.countDocuments({
          reportedAt: {
            $gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        }),
      };

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Erreur lors de la récupération des statistiques",
        error: error.message,
      });
    }
  },
);

module.exports = router;
