/**
 * ================================================
 * ROUTES CONCOURS (CONTESTS)
 * ================================================
 */

const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const Contest = require("../models/Contest");
const { protect, authorize } = require("../middleware/auth");

// GET public — concours actifs
router.get("/", async (req, res) => {
  try {
    const contests = await Contest.find({ active: true }).sort("-createdAt");
    res.json({ success: true, count: contests.length, data: contests });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET admin — tous les concours
router.get("/admin/all", protect, authorize("admin"), async (req, res) => {
  try {
    const contests = await Contest.find().sort("-createdAt");
    res.json({ success: true, count: contests.length, data: contests });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST admin — upload PDF programme (doit être AVANT /:id)
router.post(
  "/upload-pdf",
  protect,
  authorize("admin"),
  (req, res, next) => {
    const storage = multer.diskStorage({
      destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, "../uploads/contests/pdf");
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
      limits: { fileSize: 20 * 1024 * 1024 },
    }).single("pdf");
    pdfUpload(req, res, next);
  },
  (req, res) => {
    if (!req.file)
      return res
        .status(400)
        .json({ success: false, message: "Aucun PDF reçu" });
    res.json({
      success: true,
      message: "PDF uploadé avec succès",
      url: `/uploads/contests/pdf/${req.file.filename}`,
      filename: req.file.filename,
    });
  },
);

// GET public — détail
router.get("/:id", async (req, res) => {
  try {
    const contest = await Contest.findById(req.params.id);
    if (!contest)
      return res
        .status(404)
        .json({ success: false, message: "Concours non trouvé" });
    res.json({ success: true, data: contest });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST admin — créer
router.post("/", protect, authorize("admin"), async (req, res) => {
  try {
    const contest = await Contest.create(req.body);
    res.status(201).json({ success: true, data: contest });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PUT admin — modifier
router.put("/:id", protect, authorize("admin"), async (req, res) => {
  try {
    const contest = await Contest.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!contest)
      return res
        .status(404)
        .json({ success: false, message: "Concours non trouvé" });
    res.json({ success: true, data: contest });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PATCH admin — activer/désactiver
router.patch("/:id/toggle", protect, authorize("admin"), async (req, res) => {
  try {
    const contest = await Contest.findById(req.params.id);
    if (!contest)
      return res
        .status(404)
        .json({ success: false, message: "Concours non trouvé" });
    contest.active = !contest.active;
    await contest.save();
    res.json({ success: true, data: contest });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE admin
router.delete("/:id", protect, authorize("admin"), async (req, res) => {
  try {
    await Contest.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Concours supprimé" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
