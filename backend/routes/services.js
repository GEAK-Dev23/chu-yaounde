/**
 * ================================================
 * ROUTES SERVICES MÉDICAUX
 * ================================================
 */

const express = require("express");
const router = express.Router();
const Service = require("../models/Service");
const { protect, authorize } = require("../middleware/auth");
const {
  validateService,
  validate,
  validateMongoId,
} = require("../middleware/validation");

/**
 * @route   GET /api/services
 * @desc    Liste des services
 * @access  Public
 */
router.get("/", async (req, res) => {
  try {
    const { department, available } = req.query;

    const query = {};
    if (department) query.department = department;
    if (available !== undefined) query.available = available === "true";

    const services = await Service.find(query).sort("name");

    res.status(200).json({
      success: true,
      count: services.length,
      data: services,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des services",
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/services/featured
 * @desc    Services mis en avant
 * @access  Public
 */
router.get("/featured", async (req, res) => {
  try {
    const services = await Service.find({
      featured: true,
      available: true,
    }).sort("order");
    res.status(200).json({
      success: true,
      count: services.length,
      data: services,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des services",
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/services/:id
 * @desc    Détails d'un service
 * @access  Public
 */
router.get("/:id", validateMongoId, validate, async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service non trouvé",
      });
    }

    res.status(200).json({
      success: true,
      data: service,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération du service",
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/services
 * @desc    Créer un service
 * @access  Private (admin)
 */
router.post(
  "/",
  protect,
  authorize("admin"),
  validateService,
  validate,
  async (req, res) => {
    try {
      const service = await Service.create(req.body);

      res.status(201).json({
        success: true,
        message: "Service créé avec succès",
        data: service,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Erreur lors de la création",
        error: error.message,
      });
    }
  },
);

/**
 * @route   PUT /api/services/:id
 * @desc    Modifier un service
 * @access  Private (admin)
 */
router.put(
  "/:id",
  validateMongoId,
  validate,
  protect,
  authorize("admin"),
  async (req, res) => {
    try {
      const service = await Service.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      });

      if (!service) {
        return res.status(404).json({
          success: false,
          message: "Service non trouvé",
        });
      }

      res.status(200).json({
        success: true,
        message: "Service mis à jour",
        data: service,
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
 * @route   DELETE /api/services/:id
 * @desc    Supprimer un service
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
      const service = await Service.findById(req.params.id);

      if (!service) {
        return res.status(404).json({
          success: false,
          message: "Service non trouvé",
        });
      }

      await service.deleteOne();

      res.status(200).json({
        success: true,
        message: "Service supprimé",
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

// Upload image service
const upload = require("../middleware/upload");
router.post(
  "/upload-image",
  protect,
  authorize("admin"),
  function (req, res, next) {
    req.uploadFolder = "services";
    next();
  },
  upload.single("image"),
  function (req, res) {
    if (!req.file)
      return res
        .status(400)
        .json({ success: false, message: "Aucun fichier recu" });
    const imageUrl = "/uploads/services/" + req.file.filename;
    res.status(200).json({ success: true, data: { url: imageUrl } });
  },
);

module.exports = router;
