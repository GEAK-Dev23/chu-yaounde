/**
 * ================================================
 * ROUTES STAGES (INTERNSHIPS)
 * ================================================
 */

const express = require("express");
const router = express.Router();
const Internship = require("../models/Internship");
const { protect, authorize } = require("../middleware/auth");

// GET public — stages actifs
router.get("/", async (req, res) => {
  try {
    const internships = await Internship.find({ active: true }).sort(
      "-createdAt",
    );
    res.json({ success: true, count: internships.length, data: internships });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET admin — tous les stages
router.get("/admin/all", protect, authorize("admin"), async (req, res) => {
  try {
    const internships = await Internship.find().sort("-createdAt");
    res.json({ success: true, count: internships.length, data: internships });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET public — détail
router.get("/:id", async (req, res) => {
  try {
    const internship = await Internship.findById(req.params.id);
    if (!internship)
      return res
        .status(404)
        .json({ success: false, message: "Stage non trouvé" });
    res.json({ success: true, data: internship });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST admin — créer
router.post("/", protect, authorize("admin"), async (req, res) => {
  try {
    const internship = await Internship.create(req.body);
    res.status(201).json({ success: true, data: internship });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PUT admin — modifier
router.put("/:id", protect, authorize("admin"), async (req, res) => {
  try {
    const internship = await Internship.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true },
    );
    if (!internship)
      return res
        .status(404)
        .json({ success: false, message: "Stage non trouvé" });
    res.json({ success: true, data: internship });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PATCH admin — activer/désactiver
router.patch("/:id/toggle", protect, authorize("admin"), async (req, res) => {
  try {
    const internship = await Internship.findById(req.params.id);
    if (!internship)
      return res
        .status(404)
        .json({ success: false, message: "Stage non trouvé" });
    internship.active = !internship.active;
    await internship.save();
    res.json({ success: true, data: internship });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE admin
router.delete("/:id", protect, authorize("admin"), async (req, res) => {
  try {
    await Internship.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Stage supprimé" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
