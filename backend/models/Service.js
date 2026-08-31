/**
 * MODÈLE SERVICE MÉDICAL
 */

const mongoose = require("mongoose");

const StaffMemberSchema = new mongoose.Schema(
  {
    id: { type: String },
    name: { type: String, required: true, trim: true },
    specialty: { type: String, trim: true },
  },
  { _id: false },
);

const ServiceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Le nom du service est requis"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    longDescription: {
      type: String,
      trim: true,
    },
    department: {
      type: String,
      trim: true,
    },
    // Catégorie pour la page services frontend
    category: {
      type: String,
      enum: ["medical", "surgical", "technical", "specialized"],
      default: "medical",
    },
    // Slug pour le routing frontend (cardiology, pediatrics, etc.)
    slug: {
      type: String,
      trim: true,
      lowercase: true,
    },
    icon: {
      type: String,
      default: "fas fa-hospital",
    },
    image: {
      type: String,
    },
    // Fonctionnalités/prestations du service (affiché sur la page service)
    features: {
      type: [String],
      default: [],
    },
    available: {
      type: Boolean,
      default: true,
    },
    hours: {
      type: String,
      default: "Lun-Ven 8h-17h",
    },
    phone: {
      type: String,
    },
    location: {
      type: String,
    },
    featured: {
      type: Boolean,
      default: false,
    },
    order: {
      type: Number,
      default: 0,
    },
    // Personnel médical du service (médecins disponibles pour RDV)
    staff: {
      type: [StaffMemberSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

ServiceSchema.index({ name: 1 });
ServiceSchema.index({ department: 1 });
ServiceSchema.index({ featured: 1 });
ServiceSchema.index({ slug: 1 });

module.exports = mongoose.model("Service", ServiceSchema);
