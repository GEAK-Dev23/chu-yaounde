/**
 * MODÈLE DOCUMENT
 */

const mongoose = require("mongoose");

const DocumentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Le titre est requis"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      enum: ["formulaire", "rapport", "appel-offre", "guide", "autre"],
      default: "autre",
    },
    fileUrl: {
      type: String,
    },
    fileType: {
      type: String,
    },
    fileSize: {
      type: Number,
    },
    published: {
      type: Boolean,
      default: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    downloadCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

DocumentSchema.index({ category: 1 });
DocumentSchema.index({ published: 1 });

module.exports = mongoose.model("Document", DocumentSchema);
