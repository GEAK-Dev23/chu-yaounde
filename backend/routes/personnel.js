/**
 * ================================================
 * ROUTES PERSONNEL — CHU YAOUNDÉ
 * ================================================
 * CRUD complet + upload photo (Cloudinary)
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
const path = require("path");
const fs = require("fs");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");
const { protect, authorize } = require("../middleware/auth");

// ─── Config Cloudinary ─────────────────────────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ─── Stockage des données (JSON sur disque) ────────────────────────────────────
const DATA_FILE = path.join(__dirname, "../uploads/personnel/personnel.json");

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function readData() {
  ensureDir(path.dirname(DATA_FILE));
  if (!fs.existsSync(DATA_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  } catch {
    return [];
  }
}

function writeData(data) {
  ensureDir(path.dirname(DATA_FILE));
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
}

// ─── Multer → Cloudinary ───────────────────────────────────────────────────────
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "chu-yaounde/personnel",
    allowed_formats: "jpg,jpeg,png,webp",
    transformation: [{ width: 400, height: 500, crop: "fill", quality: "auto" }],
  },
});

const photoUpload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Format non supporté. Utilisez JPG, PNG ou WEBP."), false);
  },
  limits: { fileSize: 5 * 1024 * 1024 },
}).single("photo");

// ─── GET /api/personnel ────────────────────────────────────────────────────────
router.get("/", (req, res) => {
  try {
    const list = readData().sort((a, b) => (a.order || 0) - (b.order || 0));
    res.json({ success: true, count: list.length, data: list });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── POST /api/personnel ───────────────────────────────────────────────────────
router.post("/", protect, authorize("admin"), (req, res) => {
  try {
    const { name, poste } = req.body;
    if (!name || !name.trim())
      return res.status(400).json({ success: false, message: "Le nom est requis" });
    if (!poste || !poste.trim())
      return res.status(400).json({ success: false, message: "Le poste est requis" });

    const list = readData();
    const membre = {
      id: `p_${Date.now()}`,
      name: name.trim(),
      poste: poste.trim(),
      photo: null,
      cloudinaryId: null,
      order: list.length,
      createdAt: new Date().toISOString(),
    };
    list.push(membre);
    writeData(list);
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

    const list = readData();
    const idx = list.findIndex((m) => m.id === req.params.id);
    if (idx === -1)
      return res.status(404).json({ success: false, message: "Membre introuvable" });

    if (!req.file)
      return res.status(400).json({ success: false, message: "Aucune photo reçue" });

    // Supprimer l'ancienne photo sur Cloudinary
    if (list[idx].cloudinaryId) {
      try {
        await cloudinary.uploader.destroy(list[idx].cloudinaryId);
      } catch (e) {
        console.error("Erreur suppression Cloudinary:", e.message);
      }
    }

    list[idx].photo = req.file.path;            // URL Cloudinary
    list[idx].cloudinaryId = req.file.filename; // public_id Cloudinary
    writeData(list);
    res.json({ success: true, data: list[idx] });
  });
});

// ─── PUT /api/personnel/:id ────────────────────────────────────────────────────
router.put("/:id", protect, authorize("admin"), (req, res) => {
  try {
    const list = readData();
    const idx = list.findIndex((m) => m.id === req.params.id);
    if (idx === -1)
      return res.status(404).json({ success: false, message: "Membre introuvable" });

    const { name, poste, order } = req.body;
    if (name !== undefined) list[idx].name = name.trim();
    if (poste !== undefined) list[idx].poste = poste.trim();
    if (order !== undefined) list[idx].order = parseInt(order);

    writeData(list);
    res.json({ success: true, data: list[idx] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── DELETE /api/personnel/:id ────────────────────────────────────────────────
router.delete("/:id", protect, authorize("admin"), async (req, res) => {
  try {
    const list = readData();
    const idx = list.findIndex((m) => m.id === req.params.id);
    if (idx === -1)
      return res.status(404).json({ success: false, message: "Membre introuvable" });

    // Supprimer la photo sur Cloudinary
    if (list[idx].cloudinaryId) {
      try {
        await cloudinary.uploader.destroy(list[idx].cloudinaryId);
      } catch (e) {
        console.error("Erreur suppression Cloudinary:", e.message);
      }
    }

    const [removed] = list.splice(idx, 1);
    writeData(list);
    res.json({ success: true, data: removed });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
