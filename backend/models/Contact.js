/**
 * MODÈLE CONTACT - CONTACT MESSAGE
 * Gestion des messages de contact institutionnel
 */

const mongoose = require("mongoose");

const ContactSchema = new mongoose.Schema(
  {
    // Informations expéditeur
    firstName: {
      type: String,
      required: [true, "Le prénom est requis"],
      trim: true,
      maxlength: [50, "Prénom trop long"],
    },
    lastName: {
      type: String,
      required: [true, "Le nom est requis"],
      trim: true,
      maxlength: [50, "Nom trop long"],
    },
    email: {
      type: String,
      required: [true, "L'email est requis"],
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Email invalide"],
    },
    phone: {
      type: String,
      match: [
        /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/,
        "Téléphone invalide",
      ],
    },

    // Contenu du message
    subject: {
      type: String,
      required: [true, "Le sujet est requis"],
      enum: {
        values: [
          "appointment",
          "information",
          "emergency",
          "complaint",
          "partnership",
          "other",
        ],
        message: "Sujet invalide",
      },
    },
    message: {
      type: String,
      required: [true, "Le message est requis"],
      minlength: [10, "Le message doit contenir au moins 10 caractères"],
      maxlength: [2000, "Message trop long (max 2000 caractères)"],
    },

    // Statut de traitement
    status: {
      type: String,
      enum: ["new", "read", "in_progress", "replied", "resolved", "closed"],
      default: "new",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },

    // Gestion
    assignedTo: {
      type: String, // Email ou ID de l'administrateur
    },
    responseMessage: {
      type: String,
      maxlength: [2000, "Réponse trop longue"],
    },
    respondedAt: Date,
    respondedBy: String,

    // Notifications
    autoResponseSent: {
      type: Boolean,
      default: false,
    },
    adminNotified: {
      type: Boolean,
      default: false,
    },
    responseEmailSent: {
      type: Boolean,
      default: false,
    },

    // Métadonnées
    category: {
      type: String,
      enum: [
        "general",
        "medical",
        "administrative",
        "technical",
        "complaint",
        "suggestion",
      ],
      default: "general",
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    notes: {
      type: String,
      maxlength: [1000, "Notes trop longues"],
    },

    // Tracking
    ipAddress: String,
    userAgent: String,
    referrer: String,

    // Consentement
    gdprConsent: {
      type: Boolean,
      required: [true, "Le consentement RGPD est requis"],
      validate: {
        validator: function (v) {
          return v === true;
        },
        message: "Vous devez accepter la politique de confidentialité",
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Index pour recherches
ContactSchema.index({ email: 1 });
ContactSchema.index({ status: 1, priority: -1 });
ContactSchema.index({ createdAt: -1 });
ContactSchema.index({ subject: 1 });

// Virtual pour le nom complet
ContactSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Méthode pour marquer comme lu
ContactSchema.methods.markAsRead = function (adminEmail) {
  this.status = "read";
  this.assignedTo = adminEmail;
  return this.save();
};

// Méthode pour répondre
ContactSchema.methods.respond = async function (responseMessage, respondedBy) {
  this.status = "resolved";
  this.responseMessage = responseMessage;
  this.respondedAt = Date.now();
  this.respondedBy = respondedBy;
  this.responseEmailSent = false; // Sera mis à true après envoi email
  return this.save();
};

// Méthode pour classer par priorité basée sur le sujet
ContactSchema.pre("save", function (next) {
  if (this.isNew) {
    // Auto-définir la priorité basée sur le sujet
    const priorityMap = {
      emergency: "urgent",
      complaint: "high",
      appointment: "medium",
      information: "low",
      partnership: "medium",
      other: "low",
    };

    if (!this.priority || this.priority === "medium") {
      this.priority = priorityMap[this.subject] || "medium";
    }

    // Auto-définir la catégorie
    const categoryMap = {
      emergency: "medical",
      appointment: "medical",
      complaint: "complaint",
      information: "general",
      partnership: "administrative",
      other: "general",
    };

    if (!this.category || this.category === "general") {
      this.category = categoryMap[this.subject] || "general";
    }
  }
  next();
});

// Méthode statique pour obtenir les statistiques
ContactSchema.statics.getStats = async function () {
  const stats = await this.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  const priorityStats = await this.aggregate([
    {
      $group: {
        _id: "$priority",
        count: { $sum: 1 },
      },
    },
  ]);

  return {
    byStatus: stats,
    byPriority: priorityStats,
    total: await this.countDocuments(),
  };
};

module.exports = mongoose.model("Contact", ContactSchema);
