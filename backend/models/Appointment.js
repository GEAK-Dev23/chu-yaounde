/**
 * MODÈLE RENDEZ-VOUS - APPOINTMENT
 * Gestion des rendez-vous médicaux
 */

const mongoose = require("mongoose");
const moment = require("moment-timezone");

const AppointmentSchema = new mongoose.Schema(
  {
    // Informations patient
    patient: {
      firstName: {
        type: String,
        required: [true, "Le prénom du patient est requis"],
        trim: true,
        maxlength: [50, "Prénom trop long"],
      },
      lastName: {
        type: String,
        required: [true, "Le nom du patient est requis"],
        trim: true,
        maxlength: [50, "Nom trop long"],
      },
      email: {
        type: String,
        required: [true, "L'email est requis"],
        lowercase: true,
        match: [
          /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
          "Email invalide",
        ],
      },
      phone: {
        type: String,
        required: [true, "Le téléphone est requis"],
        match: [/^[+]?[\d\s()./-]{7,20}$/, "Téléphone invalide"],
      },
      birthDate: {
        type: Date,
        required: [true, "La date de naissance est requise"],
      },
    },

    // Détails du rendez-vous
    service: {
      type: String,
      required: [true, "Le service est requis"],
      trim: true,
    },
    doctor: {
      id: {
        type: String,
        required: [true, "L'identifiant du médecin est requis"],
      },
      name: {
        type: String,
        required: [true, "Le nom du médecin est requis"],
      },
      specialty: String,
    },

    // Date et heure
    appointmentDate: {
      type: Date,
      required: [true, "La date du rendez-vous est requise"],
    },
    appointmentTime: {
      type: String,
      required: [true, "L'heure du rendez-vous est requise"],
      match: [
        /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
        "Format d'heure invalide (HH:MM)",
      ],
    },
    duration: {
      type: Number,
      default: 30, // minutes
      min: 15,
      max: 120,
    },

    // Motif
    reason: {
      type: String,
      maxlength: [500, "Motif trop long (max 500 caractères)"],
    },

    // Statut
    status: {
      type: String,
      enum: ["confirmed", "pending", "cancelled", "completed", "no_show"],
      default: "pending",
    },

    // Notifications
    confirmationSent: {
      type: Boolean,
      default: false,
    },
    reminderSent: {
      type: Boolean,
      default: false,
    },

    // Annulation
    cancellationReason: String,
    cancelledAt: Date,
    cancelledBy: {
      type: String,
      enum: ["patient", "hospital", "system", "admin", "staff"],
    },

    // Métadonnées
    notes: {
      type: String,
      maxlength: [1000, "Notes trop longues"],
    },
    createdBy: {
      type: String,
      default: "patient",
    },
    ipAddress: String,
    userAgent: String,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Index composé pour éviter les doublons
AppointmentSchema.index(
  {
    "doctor.id": 1,
    appointmentDate: 1,
    appointmentTime: 1,
  },
  {
    unique: true,
    partialFilterExpression: { status: { $ne: "cancelled" } },
  },
);

// Index pour recherches
AppointmentSchema.index({ "patient.email": 1 });
AppointmentSchema.index({ appointmentDate: 1 });
AppointmentSchema.index({ status: 1 });

// Virtual pour le nom complet du patient
AppointmentSchema.virtual("patient.fullName").get(function () {
  return `${this.patient.firstName} ${this.patient.lastName}`;
});

// Virtual pour la date formatée
AppointmentSchema.virtual("formattedDate").get(function () {
  return moment(this.appointmentDate).format("DD/MM/YYYY");
});

// Méthode pour confirmer le rendez-vous
AppointmentSchema.methods.confirm = function () {
  this.status = "confirmed";
  this.confirmationSent = true;
  return this.save();
};

// Méthode pour annuler le rendez-vous
AppointmentSchema.methods.cancel = function (reason, cancelledBy = "patient") {
  this.status = "cancelled";
  this.cancellationReason = reason;
  this.cancelledAt = Date.now();
  this.cancelledBy = cancelledBy;
  return this.save();
};

// Méthode statique pour vérifier la disponibilité
AppointmentSchema.statics.isSlotAvailable = async function (
  doctorId,
  date,
  time,
) {
  const existing = await this.findOne({
    "doctor.id": doctorId,
    appointmentDate: date,
    appointmentTime: time,
    status: { $in: ["pending", "confirmed"] },
  });
  return !existing;
};

// Middleware pré-save pour validation avancée
AppointmentSchema.pre("save", async function (next) {
  // Ne pas valider les dates lors d'une annulation ou confirmation
  if (!this.isNew) {
    return next();
  }

  if (this.isNew) {
    // Vérifier que le rendez-vous n'est pas dans le passé
    const appointmentDateTime = moment(this.appointmentDate)
      .hours(parseInt(this.appointmentTime.split(":")[0]))
      .minutes(parseInt(this.appointmentTime.split(":")[1]));

    if (appointmentDateTime.isBefore(moment())) {
      return next(new Error("Le rendez-vous ne peut pas être dans le passé"));
    }

    // Vérifier la limite de réservation (60 jours par défaut)
    const maxAdvanceDays =
      parseInt(process.env.APPOINTMENT_BOOKING_ADVANCE_DAYS) || 60;
    const maxDate = moment().add(maxAdvanceDays, "days");

    if (appointmentDateTime.isAfter(maxDate)) {
      return next(
        new Error(
          `Vous ne pouvez réserver que ${maxAdvanceDays} jours à l'avance`,
        ),
      );
    }
  }
  next();
});

module.exports = mongoose.model("Appointment", AppointmentSchema);
