/**
 * MODÈLE PERSONNEL — CHU YAOUNDÉ
 * Stocké dans MongoDB (persistant), photos sur Cloudinary.
 */

const mongoose = require("mongoose");

const PersonnelSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Le nom est requis"],
      trim: true,
    },
    poste: {
      type: String,
      required: [true, "Le poste est requis"],
      trim: true,
    },
    photo: {
      type: String, // URL Cloudinary absolue
      default: null,
    },
    cloudinaryId: {
      type: String, // public_id Cloudinary (pour suppression)
      default: null,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform: (doc, ret) => {
        // Le frontend (admin + accueil) utilise "id"
        ret.id = ret._id.toString();
        delete ret._id;
        return ret;
      },
    },
  },
);

PersonnelSchema.index({ order: 1 });

module.exports = mongoose.model("Personnel", PersonnelSchema);
