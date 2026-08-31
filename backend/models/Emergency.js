/**
 * MODÈLE URGENCE - EMERGENCY
 * Gestion des cas d'urgence médicale
 */

const mongoose = require("mongoose");

const EmergencySchema = new mongoose.Schema(
  {
    // Informations patient
    firstName: {
      type: String,
      required: [true, "Le prénom est requis"],
      trim: true,
      maxlength: [50, "Le prénom ne peut excéder 50 caractères"],
    },
    lastName: {
      type: String,
      required: [true, "Le nom est requis"],
      trim: true,
      maxlength: [50, "Le nom ne peut excéder 50 caractères"],
    },
    age: {
      type: Number,
      required: [true, "L'âge est requis"],
      min: [0, "L'âge doit être positif"],
      max: [150, "L'âge invalide"],
    },
    gender: {
      type: String,
      enum: ["M", "F", "Autre"],
      required: [true, "Le sexe est requis"],
    },
    phone: {
      type: String,
      required: [true, "Le téléphone est requis"],
      match: [
        /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/,
        "Numéro de téléphone invalide",
      ],
    },

    // Détails de l'urgence
    severity: {
      type: Number,
      required: [true, "Le niveau de gravité est requis"],
      min: 1,
      max: 5,
      enum: [1, 2, 3, 4, 5],
    },
    symptoms: {
      type: String,
      required: [true, "Les symptômes sont requis"],
      maxlength: [500, "Description trop longue (max 500 caractères)"],
    },
    emergencyType: {
      type: String,
      enum: ["cardiac", "trauma", "neurological", "respiratory", "other"],
      required: [true, "Le type d'urgence est requis"],
    },

    // Tracking
    arrivalTime: {
      type: Date,
      default: Date.now,
    },
    triageTime: {
      type: Date,
    },
    treatmentStartTime: {
      type: Date,
    },
    dischargeTime: {
      type: Date,
    },

    // Statut
    status: {
      type: String,
      enum: [
        "waiting",
        "in_triage",
        "in_treatment",
        "discharged",
        "transferred",
        "deceased",
      ],
      default: "waiting",
    },
    priority: {
      type: String,
      enum: ["immediate", "very_urgent", "urgent", "standard", "non_urgent"],
      required: true,
    },

    // Informations médicales
    assignedDoctor: {
      type: String,
    },
    assignedNurse: {
      type: String,
    },
    diagnosis: {
      type: String,
      maxlength: [1000, "Diagnostic trop long"],
    },
    treatment: {
      type: String,
      maxlength: [1000, "Traitement trop long"],
    },

    // Notifications
    smsNotified: {
      type: Boolean,
      default: false,
    },
    emailNotified: {
      type: Boolean,
      default: false,
    },

    // Métadonnées
    notes: {
      type: String,
      maxlength: [2000, "Notes trop longues"],
    },
    createdBy: {
      type: String,
      default: "system",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Index pour recherche rapide
EmergencySchema.index({ status: 1, priority: 1 });
EmergencySchema.index({ arrivalTime: -1 });
EmergencySchema.index({ phone: 1 });

// Virtual pour temps d'attente
EmergencySchema.virtual("waitingTime").get(function () {
  if (this.triageTime && this.arrivalTime) {
    return Math.floor((this.triageTime - this.arrivalTime) / 60000); // minutes
  }
  if (this.status === "waiting") {
    return Math.floor((Date.now() - this.arrivalTime) / 60000);
  }
  return 0;
});

// Middleware pré-validation pour définir la priorité basée sur la gravité
// (doit tourner AVANT la validation, sinon le champ "priority" requis échoue)
EmergencySchema.pre("validate", function (next) {
  if (this.isNew || this.isModified("severity")) {
    const priorityMap = {
      5: "immediate",
      4: "very_urgent",
      3: "urgent",
      2: "standard",
      1: "non_urgent",
    };
    this.priority = priorityMap[this.severity];
  }
  next();
});

// Méthode pour marquer comme traité
EmergencySchema.methods.markAsTreated = function () {
  this.status = "in_treatment";
  this.treatmentStartTime = Date.now();
  return this.save();
};

// Méthode pour marquer le triage
EmergencySchema.methods.markAsTriaged = function () {
  this.status = "in_triage";
  this.triageTime = Date.now();
  return this.save();
};

module.exports = mongoose.model("Emergency", EmergencySchema);
