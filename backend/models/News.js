/**
 * MODÈLE ACTUALITÉ - NEWS
 */

const mongoose = require("mongoose");

const NewsSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Le titre est requis"],
      trim: true,
    },
    content: {
      type: String,
      required: [true, "Le contenu est requis"],
    },
    excerpt: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      enum: ["actualite", "evenement", "publication"],
      default: "actualite",
    },
    image: {
      type: String,
    },
    pdf: {
      type: String,
    },
    authorName: {
      type: String,
      trim: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    published: {
      type: Boolean,
      default: false,
    },
    publishedAt: {
      type: Date,
    },
    views: {
      type: Number,
      default: 0,
    },
    featured: {
      type: Boolean,
      default: false,
    },
    // Champs spécifiques aux événements
    eventStartDate: {
      type: Date,
    },
    eventEndDate: {
      type: Date,
    },
    eventLocation: {
      type: String,
      trim: true,
    },
    eventType: {
      type: String,
      enum: ["conference", "seminar", "workshop", "training"],
      default: "conference",
    },

    // Champs spécifiques aux publications scientifiques
    specialty: {
      type: String,
      enum: [
        "cardiology",
        "oncology",
        "neurology",
        "pediatrics",
        "surgery",
        "general",
      ],
      default: "general",
    },
    publicationType: {
      type: String,
      enum: ["journal", "conference", "thesis", "book"],
      default: "journal",
    },
  },
  {
    timestamps: true,
  },
);

NewsSchema.index({ published: 1, publishedAt: -1 });
NewsSchema.index({ category: 1 });
NewsSchema.index({ featured: 1 });

// Route virtuelle: /api/news/latest
NewsSchema.statics.getLatest = function (limit = 3) {
  return this.find({ published: true, publishedAt: { $lte: new Date() } })
    .sort({ publishedAt: -1 })
    .limit(limit)
    .populate("author", "firstName lastName");
};

module.exports = mongoose.model("News", NewsSchema);
