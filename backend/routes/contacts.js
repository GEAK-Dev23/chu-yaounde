/**
 * ================================================
 * ROUTES CONTACTS - MESSAGES
 * ================================================
 */

const express = require("express");
const router = express.Router();
const Contact = require("../models/Contact");
const { protect, authorize } = require("../middleware/auth");
const {
  validateContact,
  validate,
  validateMongoId,
  validatePagination,
} = require("../middleware/validation");

// Service de notifications
let sendContactConfirmation;
try {
  const notifications = require("../utils/notifications");
  sendContactConfirmation = notifications.sendContactConfirmation;
} catch (error) {
  console.warn("⚠️  Service de notifications non disponible");
  sendContactConfirmation = async () => {
    console.log("Notification simulée");
  };
}

/**
 * @route   POST /api/contacts
 * @desc    Envoyer un message de contact
 * @access  Public
 */
router.post("/", validateContact, validate, async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      subject,
      message,
      category,
      gdprConsent,
    } = req.body;

    // Créer le contact
    const contact = await Contact.create({
      firstName,
      lastName,
      email,
      phone,
      subject,
      message,
      gdprConsent: gdprConsent === true || gdprConsent === "true",
      status: "new",
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
    });

    // Envoyer confirmation
    try {
      if (sendContactConfirmation) {
        await sendContactConfirmation(contact);
      }
    } catch (error) {
      console.error("Erreur notification:", error.message);
    }

    res.status(201).json({
      success: true,
      message:
        "Votre message a été envoyé avec succès. Nous vous répondrons dans les plus brefs délais.",
      data: contact,
    });
  } catch (error) {
    console.error("Erreur création contact:", error);
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Erreur lors de l'envoi du message",
        errors: Object.values(error.errors).map((e) => e.message),
      });
    }
    res.status(500).json({
      success: false,
      message: "Erreur lors de l'envoi du message",
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/contacts
 * @desc    Liste des messages (admin)
 * @access  Private (admin/staff)
 */
router.get(
  "/",
  protect,
  authorize("admin", "staff"),
  validatePagination,
  validate,
  async (req, res) => {
    try {
      const {
        status,
        category,
        page = 1,
        limit = 20,
        sort = "-createdAt",
      } = req.query;

      const query = {};
      if (status) query.status = status;
      if (category) query.category = category;

      const skip = (page - 1) * limit;

      const contacts = await Contact.find(query)
        .sort(sort)
        .limit(parseInt(limit))
        .skip(skip);

      const total = await Contact.countDocuments(query);

      res.status(200).json({
        success: true,
        count: contacts.length,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        data: contacts,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Erreur lors de la récupération des messages",
        error: error.message,
      });
    }
  },
);

/**
 * @route   GET /api/contacts/:id
 * @desc    Détails d'un message
 * @access  Private (admin/staff)
 */
router.get(
  "/:id",
  validateMongoId,
  validate,
  protect,
  authorize("admin", "staff"),
  async (req, res) => {
    try {
      const contact = await Contact.findById(req.params.id);

      if (!contact) {
        return res.status(404).json({
          success: false,
          message: "Message non trouvé",
        });
      }

      // Marquer comme lu
      if (contact.status === "new") {
        contact.status = "read";
        await contact.save();
      }

      res.status(200).json({
        success: true,
        data: contact,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Erreur lors de la récupération du message",
        error: error.message,
      });
    }
  },
);

/**
 * @route   PUT /api/contacts/:id/reply
 * @desc    Répondre à un message
 * @access  Private (admin/staff)
 */
router.put(
  "/:id/reply",
  validateMongoId,
  validate,
  protect,
  authorize("admin", "staff"),
  async (req, res) => {
    try {
      const { reply } = req.body;

      if (!reply) {
        return res.status(400).json({
          success: false,
          message: "La réponse est requise",
        });
      }

      const contact = await Contact.findById(req.params.id);

      if (!contact) {
        return res.status(404).json({
          success: false,
          message: "Message non trouvé",
        });
      }

      contact.reply = reply;
      contact.repliedBy = req.user._id;
      contact.repliedAt = Date.now();
      contact.status = "replied";

      await contact.save();

      // Envoyer la réponse par email
      try {
        const { sendEmail } = require("../utils/notifications");
        await sendEmail({
          email: contact.email,
          subject: `Re: ${contact.subject}`,
          message: reply,
        });
      } catch (error) {
        console.error("Erreur envoi réponse:", error.message);
      }

      res.status(200).json({
        success: true,
        message: "Réponse envoyée avec succès",
        data: contact,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Erreur lors de l'envoi de la réponse",
        error: error.message,
      });
    }
  },
);

/**
 * @route   DELETE /api/contacts/:id
 * @desc    Supprimer un message
 * @access  Private (admin)
 */
router.delete(
  "/:id",
  validateMongoId,
  validate,
  protect,
  authorize("admin"),
  async (req, res) => {
    try {
      const contact = await Contact.findById(req.params.id);

      if (!contact) {
        return res.status(404).json({
          success: false,
          message: "Message non trouvé",
        });
      }

      await contact.deleteOne();

      res.status(200).json({
        success: true,
        message: "Message supprimé",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Erreur lors de la suppression",
        error: error.message,
      });
    }
  },
);

/**
 * @route   PATCH /api/contacts/:id
 * @desc    Mettre à jour le statut d'un contact (admin panel)
 * @access  Private (admin/staff)
 */
router.patch(
  "/:id",
  validateMongoId,
  validate,
  protect,
  authorize("admin", "staff"),
  async (req, res) => {
    try {
      const contact = await Contact.findById(req.params.id);
      if (!contact)
        return res
          .status(404)
          .json({ success: false, message: "Message non trouvé" });
      const allowed = ["status", "priority", "assignedTo", "notes"];
      allowed.forEach((f) => {
        if (req.body[f] !== undefined) contact[f] = req.body[f];
      });
      await contact.save();
      res.status(200).json({ success: true, data: contact });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Erreur mise à jour",
        error: error.message,
      });
    }
  },
);

/**
 * @route   PATCH /api/contacts/:id/reply
 * @desc    Répondre à un message (alias PATCH, accepte responseMessage ou reply)
 * @access  Private (admin/staff)
 */
router.patch(
  "/:id/reply",
  validateMongoId,
  validate,
  protect,
  authorize("admin", "staff"),
  async (req, res) => {
    try {
      const message = req.body.responseMessage || req.body.reply;
      if (!message)
        return res
          .status(400)
          .json({ success: false, message: "La réponse est requise" });
      const contact = await Contact.findById(req.params.id);
      if (!contact)
        return res
          .status(404)
          .json({ success: false, message: "Message non trouvé" });
      contact.responseMessage = message;
      contact.respondedBy = req.user.email;
      contact.respondedAt = Date.now();
      contact.status = "resolved";
      await contact.save();
      // Try to send email notification
      try {
        const { sendEmail } = require("../utils/notifications");
        await sendEmail({
          email: contact.email,
          subject: `Réponse CHU Yaoundé: ${contact.subject}`,
          message,
        });
      } catch (e) {
        console.error("Email reply error:", e.message);
      }
      res
        .status(200)
        .json({ success: true, message: "Réponse envoyée", data: contact });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Erreur lors de la réponse",
        error: error.message,
      });
    }
  },
);

module.exports = router;
