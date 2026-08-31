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
    const multer = require("multer");
    const path = require("path");
    const fs = require("fs");

    const storage = multer.diskStorage({
      destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, "../uploads/documents");
        if (!fs.existsSync(uploadPath))
          fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
      },
      filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const name = path
          .basename(file.originalname, ext)
          .replace(/[^a-z0-9]/gi, "-")
          .toLowerCase()
          .slice(0, 40);
        cb(null, Date.now() + "-" + name + ext);
      },
    });

    const pdfUpload = multer({
      storage,
      fileFilter: (req, file, cb) => {
        if (file.mimetype === "application/pdf") cb(null, true);
        else cb(new Error("Seuls les fichiers PDF sont acceptés"), false);
      },
      limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
    }).single("pdf");

    pdfUpload(req, res, next);
  },
  (req, res) => {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "Aucun PDF reçu" });
    }
    const pdfUrl = `/uploads/documents/${req.file.filename}`;
    res.status(200).json({
      success: true,
      message: "PDF uploadé avec succès",
      url: pdfUrl,
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
