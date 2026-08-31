/**
 * MODÈLE PATIENT
 * Persistance des comptes patients dans MongoDB Atlas
 */

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const MessageSchema = new mongoose.Schema(
  {
    subject: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    from: { type: String, enum: ["patient", "staff"], default: "patient" },
    read: { type: Boolean, default: false },
    reply: { type: String, default: null },
  },
  { timestamps: true },
);

const PatientSchema = new mongoose.Schema(
  {
    dossierNumber: {
      type: String,
      unique: true,
    },
    firstName: {
      type: String,
      required: [true, "Le prénom est requis"],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, "Le nom est requis"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "L'email est requis"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Email invalide"],
    },
    password: {
      type: String,
      required: [true, "Le mot de passe est requis"],
      minlength: [6, "Le mot de passe doit contenir au moins 6 caractères"],
      select: false, // jamais renvoyé par défaut
    },
    phone: {
      type: String,
      required: [true, "Le téléphone est requis"],
      trim: true,
    },
    dateOfBirth: {
      type: Date,
      required: [true, "La date de naissance est requise"],
    },
    gender: {
      type: String,
      enum: ["M", "F", "Autre"],
      required: [true, "Le genre est requis"],
    },
    address: {
      type: String,
      required: [true, "L'adresse est requise"],
      trim: true,
    },
    bloodGroup: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", ""],
      default: "",
    },
    emergencyContact: {
      type: String,
      trim: true,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
    messages: [MessageSchema],
    // Références légères (les RDV complets sont dans la collection Appointment)
    medicalHistory: { type: [String], default: [] },
    documents: { type: [String], default: [] },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// ─── Index ────────────────────────────────────────
// Note: email et dossierNumber sont déjà indexés via unique:true
PatientSchema.index({ phone: 1 });

// ─── Virtual : nom complet ─────────────────────────
PatientSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// ─── Génération automatique du numéro de dossier ──
PatientSchema.pre("save", async function (next) {
  // Générer le numéro de dossier à la création
  if (this.isNew && !this.dossierNumber) {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 100000)
      .toString()
      .padStart(5, "0");
    this.dossierNumber = `CHU${year}${random}`;
  }
  // Hasher le mot de passe si modifié
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ─── Méthode : vérifier le mot de passe ───────────
PatientSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("Patient", PatientSchema);
