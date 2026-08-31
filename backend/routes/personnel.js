/**
 * ================================================
 * ROUTES PERSONNEL — CHU YAOUNDÉ
 * ================================================
 * CRUD complet + upload photo (disque local)
 * Routes exposées :
 *   GET    /api/personnel          → liste publique
 *   POST   /api/personnel          → créer (admin)
 *   PUT    /api/personnel/:id      → modifier (admin)
 *   DELETE /api/personnel/:id      → supprimer (admin)
 *   POST   /api/personnel/:id/photo → uploader photo (admin)
 * ================================================
 */

"use strict";

const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { protect, authorize } = require("../middleware/auth");

// ─── Stockage des données en mémoire (JSON sur disque) ────────────────────────
// Persistance légère sans nouveau modèle Mongoose
const DATA_FILE = path.join(__dirname, "../uploads/personnel/personnel.json");
const PHOTO_DIR = path.join(__dirname, "../uploads/personnel/photos");

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

// ─── Multer pour photos ────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    ensureDir(PHOTO_DIR);
    cb(null, PHOTO_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-personnel${ext}`);
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
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
}).single("photo");

// ─── GET /api/personnel ────────────────────────────────────────────────────────
// Liste publique, triée par ordre
router.get("/", (req, res) => {
  try {
    const list = readData().sort((a, b) => (a.order || 0) - (b.order || 0));
    res.json({ success: true, count: list.length, data: list });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── POST /api/personnel ───────────────────────────────────────────────────────
// Créer un membre (sans photo, photo uploadée séparément)
router.post("/", protect, authorize("admin"), (req, res) => {
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

    const list = readData();
    const membre = {
      id: `p_${Date.now()}`,
      name: name.trim(),
      poste: poste.trim(),
      photo: null,
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
// Uploader / remplacer la photo d'un membre
router.post("/:id/photo", protect, authorize("admin"), (req, res) => {
  photoUpload(req, res, (err) => {
    if (err)
      return res.status(400).json({ success: false, message: err.message });

    const list = readData();
    const idx = list.findIndex((m) => m.id === req.params.id);
    if (idx === -1)
      return res
        .status(404)
        .json({ success: false, message: "Membre introuvable" });

    // Supprimer l'ancienne photo si elle existe
    if (list[idx].photo) {
      const oldPath = path.join(PHOTO_DIR, path.basename(list[idx].photo));
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    if (!req.file)
      return res
        .status(400)
        .json({ success: false, message: "Aucune photo reçue" });

    list[idx].photo = `/uploads/personnel/photos/${req.file.filename}`;
    writeData(list);
    res.json({ success: true, data: list[idx] });
  });
});

// ─── PUT /api/personnel/:id ────────────────────────────────────────────────────
// Modifier nom / poste / ordre
router.put("/:id", protect, authorize("admin"), (req, res) => {
  try {
    const list = readData();
    const idx = list.findIndex((m) => m.id === req.params.id);
    if (idx === -1)
      return res
        .status(404)
        .json({ success: false, message: "Membre introuvable" });

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
router.delete("/:id", protect, authorize("admin"), (req, res) => {
  try {
    const list = readData();
    const idx = list.findIndex((m) => m.id === req.params.id);
    if (idx === -1)
      return res
        .status(404)
        .json({ success: false, message: "Membre introuvable" });

    // Supprimer la photo du disque
    if (list[idx].photo) {
      const photoPath = path.join(PHOTO_DIR, path.basename(list[idx].photo));
      if (fs.existsSync(photoPath)) fs.unlinkSync(photoPath);
    }

    const [removed] = list.splice(idx, 1);
    writeData(list);
    res.json({ success: true, data: removed });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
