const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const Training = require("../models/Training");
const { protect, authorize } = require("../middleware/auth");
const upload = require("../middleware/upload");

// POST admin — upload image formation (doit être AVANT /:id)
router.post(
  "/upload-image",
  protect,
  authorize("admin"),
  (req, res, next) => {
    req.uploadFolder = "trainings";
    next();
  },
  upload.single("image"),
  (req, res) => {
    if (!req.file)
      return res
        .status(400)
        .json({ success: false, message: "Aucune image reçue" });
    res.json({
      success: true,
      message: "Image uploadée avec succès",
      url: `/uploads/trainings/${req.file.filename}`,
      filename: req.file.filename,
    });
  },
);

// GET public — formations actives
router.get("/", async (req, res) => {
  try {
    const trainings = await Training.find({ active: true }).sort("-createdAt");
    res.json({ success: true, count: trainings.length, data: trainings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET admin — toutes les formations
router.get("/admin/all", protect, authorize("admin"), async (req, res) => {
  try {
    const trainings = await Training.find().sort("-createdAt");
    res.json({ success: true, count: trainings.length, data: trainings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET public — détail
router.get("/:id", async (req, res) => {
  try {
    const training = await Training.findById(req.params.id);
    if (!training)
      return res
        .status(404)
        .json({ success: false, message: "Formation non trouvée" });
    res.json({ success: true, data: training });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST admin — créer
router.post("/", protect, authorize("admin"), async (req, res) => {
  try {
    const training = await Training.create(req.body);
    res.status(201).json({ success: true, data: training });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PUT admin — modifier
router.put("/:id", protect, authorize("admin"), async (req, res) => {
  try {
    const training = await Training.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!training)
      return res
        .status(404)
        .json({ success: false, message: "Formation non trouvée" });
    res.json({ success: true, data: training });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PATCH admin — activer/désactiver
router.patch("/:id/toggle", protect, authorize("admin"), async (req, res) => {
  try {
    const training = await Training.findById(req.params.id);
    if (!training)
      return res
        .status(404)
        .json({ success: false, message: "Formation non trouvée" });
    training.active = !training.active;
    await training.save();
    res.json({ success: true, data: training });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE admin
router.delete("/:id", protect, authorize("admin"), async (req, res) => {
  try {
    await Training.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Formation supprimée" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
