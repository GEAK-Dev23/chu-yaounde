/**
 * ================================================
 * MODÈLE FORMATION (TRAINING)
 * ================================================
 */

const mongoose = require("mongoose");

const TrainingSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Le titre est obligatoire"],
    trim: true,
  },
  category: {
    type: String,
    required: [true, "La catégorie est obligatoire"],
    trim: true,
  },
  description: {
    type: String,
    required: [true, "La description est obligatoire"],
  },
  image: {
    type: String,
    default: "",
  },
  duration: {
    type: String,
    default: "",
  },
  places: {
    type: Number,
    default: 0,
  },
  nextSession: {
    type: String,
    default: "",
  },
  registerEmail: {
    type: String,
    default: "",
  },
  registerLink: {
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

module.exports = mongoose.model("Training", TrainingSchema);
