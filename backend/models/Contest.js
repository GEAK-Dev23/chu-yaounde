/**
 * ================================================
 * MODÈLE CONCOURS (CONTEST)
 * ================================================
 */

const mongoose = require("mongoose");

const ContestSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Le titre est obligatoire"],
    trim: true,
  },
  icon: {
    type: String,
    default: "fa-file-medical",
  },
  description: {
    type: String,
    required: [true, "La description est obligatoire"],
  },
  examDate: {
    type: String,
    default: "",
  },
  registrationDeadline: {
    type: String,
    default: "",
  },
  subjects: {
    type: String,
    default: "",
  },
  status: {
    type: String,
    enum: ["open", "soon", "closed"],
    default: "soon",
  },
  registerEmail: {
    type: String,
    default: "",
  },
  registerLink: {
    type: String,
    default: "",
  },
  programPdf: {
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

module.exports = mongoose.model("Contest", ContestSchema);
