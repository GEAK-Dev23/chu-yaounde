/**
 * ================================================
 * ROUTES PERSONNEL — CHU YAOUNDÉ
 * ================================================
 * Données : MongoDB (modèle Personnel) → persistant sur Render
 * Photos  : Cloudinary
 * Routes exposées :
 *   GET    /api/personnel           → liste publique
 *   POST   /api/personnel           → créer (admin)
 *   PUT    /api/personnel/:id       → modifier (admin)
 *   DELETE /api/personnel/:id       → supprimer (admin)
 *   POST   /api/personnel/:id/photo → uploader photo (admin)
 * ================================================
 */

"use strict";

const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");
const { protect, authorize } = require("../middleware/auth");
const Personnel = require("../models/Personnel");

// ─── Config Cloudinary ─────────────────────────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ─── Multer → Cloudinary ───────────────────────────────────────────────────────
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "chu-yaounde/personnel",
    allowed_formats: "jpg,jpeg,png,webp",
    transformation: [
      { width: 400, height: 500, crop: "fill", quality: "auto" },
    ],
  },
});

const photoUpload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else
      cb(new Error("Format non supporté. Utilisez JPG, PNG ou WEBP."), false);
  },
  limits: { fileSize: 5 * 1024 * 1024 },
}).single("photo");

// ─── Helpers ───────────────────────────────────────────────────────────────────
const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

async function destroyCloudinary(publicId) {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (e) {
    console.error("Erreur suppression Cloudinary:", e.message);
  }
}

// ─── GET /api/personnel ────────────────────────────────────────────────────────
router.get("/", async (req, res) => {
  try {
    const list = await Personnel.find().sort({ order: 1, createdAt: 1 });
    res.json({ success: true, count: list.length, data: list });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── POST /api/personnel ───────────────────────────────────────────────────────
router.post("/", protect, authorize("admin"), async (req, res) => {
  try {
    const { name, poste } = req.body;
    if (!name || !name.trim())
      return res
        .status(400)
        .json({ success: false, message: "Le nom est requis" });
    if (!poste || !poste.trim())
      return res
        .status(400)
        .json({ success: false, message: "Le poste est requis" });

    const count = await Personnel.countDocuments();
    const membre = await Personnel.create({
      name: name.trim(),
      poste: poste.trim(),
      order: count,
    });
    res.status(201).json({ success: true, data: membre });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── POST /api/personnel/:id/photo ────────────────────────────────────────────
router.post("/:id/photo", protect, authorize("admin"), (req, res) => {
  photoUpload(req, res, async (err) => {
    if (err)
      return res.status(400).json({ success: false, message: err.message });

    try {
      if (!req.file)
        return res
          .status(400)
          .json({ success: false, message: "Aucune photo reçue" });

      const membre = isValidId(req.params.id)
        ? await Personnel.findById(req.params.id)
        : null;

      if (!membre) {
        // Membre inexistant : supprimer la photo qui vient d'être envoyée
        await destroyCloudinary(req.file.filename);
        return res
          .status(404)
          .json({ success: false, message: "Membre introuvable" });
      }

      // Supprimer l'ancienne photo sur Cloudinary
      await destroyCloudinary(membre.cloudinaryId);

      membre.photo = req.file.path; // URL Cloudinary
      membre.cloudinaryId = req.file.filename; // public_id Cloudinary
      await membre.save();

      res.json({ success: true, data: membre });
    } catch (e) {
      res.status(500).json({ success: false, message: e.message });
    }
  });
});

// ─── PUT /api/personnel/:id ────────────────────────────────────────────────────
router.put("/:id", protect, authorize("admin"), async (req, res) => {
  try {
    if (!isValidId(req.params.id))
      return res
        .status(404)
        .json({ success: false, message: "Membre introuvable" });

    const membre = await Personnel.findById(req.params.id);
    if (!membre)
      return res
        .status(404)
        .json({ success: false, message: "Membre introuvable" });

    const { name, poste, order } = req.body;
    if (name !== undefined) membre.name = String(name).trim();
    if (poste !== undefined) membre.poste = String(poste).trim();
    if (order !== undefined && !isNaN(parseInt(order)))
      membre.order = parseInt(order);

    await membre.save();
    res.json({ success: true, data: membre });
  } catch (err) {
    const status = err.name === "ValidationError" ? 400 : 500;
    res.status(status).json({ success: false, message: err.message });
  }
});

// ─── DELETE /api/personnel/:id ────────────────────────────────────────────────
router.delete("/:id", protect, authorize("admin"), async (req, res) => {
  try {
    if (!isValidId(req.params.id))
      return res
        .status(404)
        .json({ success: false, message: "Membre introuvable" });

    const membre = await Personnel.findByIdAndDelete(req.params.id);
    if (!membre)
      return res
        .status(404)
        .json({ success: false, message: "Membre introuvable" });

    await destroyCloudinary(membre.cloudinaryId);
    res.json({ success: true, data: membre });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
