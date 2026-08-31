/**
 * ================================================
 * MODÈLE STAGE (INTERNSHIP)
 * ================================================
 */

const mongoose = require("mongoose");

const InternshipSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Le titre est obligatoire"],
    trim: true,
  },
  icon: {
    type: String,
    default: "fa-stethoscope",
  },
  description: {
    type: String,
    required: [true, "La description est obligatoire"],
  },
  details: {
    type: String,
    default: "",
  },
  duration: {
    type: String,
    default: "",
  },
  level: {
    type: String,
    default: "",
  },
  supervision: {
    type: String,
    default: "",
  },
  applyEmail: {
    type: String,
    default: "",
  },
  applyLink: {
    type: String,
    default: "",
  },
  active: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Internship", InternshipSchema);
