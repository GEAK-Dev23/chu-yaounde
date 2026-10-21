/**
 * ================================================
 * ROUTES DOCUMENTS
 * ================================================
 */

const express = require("express");
const router = express.Router();
const Document = require("../models/Document");
const { protect, authorize } = require("../middleware/auth");
const { validateMongoId, validate } = require("../middleware/validation");

/**
 * @route   POST /api/documents/upload-pdf
 * @desc    Uploader un PDF pour un document (formulaire, appel d'offres, rapport)
 * @access  Private (admin)
 */
router.post(
  "/upload-pdf",
  protect,
  authorize("admin"),
  (req, res, next) => {
    const cloudinary = require("cloudinary").v2;
    const { CloudinaryStorage } = require("multer-storage-cloudinary");
    const multer = require("multer");
    const storage = new CloudinaryStorage({
      cloudinary,
      params: {
        folder: "chu-yaounde/documents",
        resource_type: "raw",
        allowed_formats: ["pdf"],
      },
    });
    const pdfUpload = multer({
      storage,
      fileFilter: (req, file, cb) => {
        if (file.mimetype === "application/pdf") cb(null, true);
        else cb(new Error("Seuls les fichiers PDF sont acceptés"), false);
      },
      limits: { fileSize: 20 * 1024 * 1024 },
    }).single("pdf");
    pdfUpload(req, res, next);
  },
  (req, res) => {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "Aucun PDF reçu" });
    }
    res.status(200).json({
      success: true,
      message: "PDF uploadé avec succès",
      url: req.file.path,
      filename: req.file.filename,
    });
  },
);

/**
 * @route   GET /api/documents
 * @desc    Liste des documents
 * @access  Private
 */
router.get("/", protect, async (req, res) => {
  try {
    const { category, page = 1, limit = 20 } = req.query;

    const query = {};
    if (category) query.category = category;

    // Si patient, voir seulement ses documents
    if (req.user.role === "patient") {
      query.userId = req.user._id;
    }

    const skip = (page - 1) * limit;

    const documents = await Document.find(query)
      .sort("-uploadedAt")
      .limit(parseInt(limit))
      .skip(skip)
      .populate("uploadedBy", "firstName lastName");

    const total = await Document.countDocuments(query);

    res.status(200).json({
      success: true,
      count: documents.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: documents,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des documents",
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/documents/:id
 * @desc    Détails d'un document
 * @access  Private
 */
router.get("/:id", validateMongoId, validate, protect, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id).populate(
      "uploadedBy",
      "firstName lastName",
    );

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document non trouvé",
      });
    }

    // Vérifier les permissions
    if (
      req.user.role === "patient" &&
      document.userId?.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Accès non autorisé",
      });
    }

    res.status(200).json({
      success: true,
      data: document,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération du document",
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/documents
 * @desc    Upload un document
 * @access  Private
 */
router.post("/", protect, async (req, res) => {
  try {
    const { title, description, category, fileUrl, fileType, fileSize } =
      req.body;

    const document = await Document.create({
      title,
      description,
      category,
      fileUrl,
      fileType,
      fileSize,
      userId: req.user._id,
      uploadedBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: "Document uploadé avec succès",
      data: document,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de l'upload",
      error: error.message,
    });
  }
});

/**
 * @route   DELETE /api/documents/:id
 * @desc    Supprimer un document
 * @access  Private
 */
router.delete("/:id", validateMongoId, validate, protect, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document non trouvé",
      });
    }

    // Vérifier les permissions
    if (
      req.user.role !== "admin" &&
      document.uploadedBy?.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Accès non autorisé",
      });
    }

    await document.deleteOne();

    res.status(200).json({
      success: true,
      message: "Document supprimé",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la suppression",
      error: error.message,
    });
  }
});

module.exports = router;
