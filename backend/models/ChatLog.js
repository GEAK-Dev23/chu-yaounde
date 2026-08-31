/**
 * MODÈLE JOURNAL CHATBOT
 */

const mongoose = require("mongoose");

const ChatLogSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
    },
    userMessage: {
      type: String,
      required: true,
    },
    botResponse: {
      type: String,
      required: true,
    },
    intent: {
      type: String,
    },
    language: {
      type: String,
      enum: ["fr", "en"],
      default: "fr",
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    ipAddress: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

ChatLogSchema.index({ sessionId: 1 });
ChatLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model("ChatLog", ChatLogSchema);
