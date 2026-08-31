/**
 * MODÈLE NEWSLETTER
 * Gestion des abonnés à la newsletter CHU Yaoundé
 */

const mongoose = require("mongoose");

const NewsletterSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "L'email est requis"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Email invalide"],
    },
    nom: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    confirmedAt: {
      type: Date,
    },
    unsubscribedAt: {
      type: Date,
    },
    source: {
      type: String,
      default: "website",
    },
  },
  {
    timestamps: true,
  },
);

NewsletterSchema.index({ email: 1 }, { unique: true });
NewsletterSchema.index({ isActive: 1 });

module.exports = mongoose.model("Newsletter", NewsletterSchema);
