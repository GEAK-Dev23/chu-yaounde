/**
 * ================================================
 * ROUTES RENDEZ-VOUS - APPOINTMENTS
 * ================================================
 */

const express = require("express");
const router = express.Router();
const Appointment = require("../models/Appointment");
const { protect, authorize } = require("../middleware/auth");
const {
  validateAppointment,
  validate,
  validateMongoId,
  validatePagination,
} = require("../middleware/validation");

// Service de notifications (optionnel)
let sendAppointmentConfirmation;
try {
  const notifications = require("../utils/notifications");
  sendAppointmentConfirmation = notifications.sendAppointmentConfirmation;
} catch (error) {
  console.warn("⚠️  Service de notifications non disponible");
  sendAppointmentConfirmation = async () => {
    console.log("Notification simulée (service non configuré)");
  };
}

/**
 * @route   GET /api/appointments
 * @desc    Liste des rendez-vous
 * @access  Private
 */
router.get("/", protect, validatePagination, validate, async (req, res) => {
  try {
    const {
      status,
      service,
      date,
      page = 1,
      limit = 10,
      sort = "-appointmentDate",
    } = req.query;

    // Construire la requête
    const query = {};

    // Si l'utilisateur est un patient, ne montrer que ses rendez-vous
    if (req.user.role === "patient") {
      query["patient.email"] = req.user.email;
    }

    // Filtres
    if (status) query.status = status;
    if (service) query.service = service;
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      query.appointmentDate = { $gte: startDate, $lte: endDate };
    }

    // Pagination
    const skip = (page - 1) * limit;

    // Récupérer les rendez-vous
    const appointments = await Appointment.find(query)
      .sort(sort)
      .limit(parseInt(limit))
      .skip(skip);

    // Compter le total
    const total = await Appointment.countDocuments(query);

    res.status(200).json({
      success: true,
      count: appointments.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: appointments,
    });
  } catch (error) {
    console.error("Erreur récupération rendez-vous:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des rendez-vous",
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/appointments
 * @desc    Créer un rendez-vous
 * @access  Public
 */
router.post("/", validateAppointment, validate, async (req, res) => {
  try {
    const {
      patient,
      service,
      doctor,
      appointmentDate,
      appointmentTime,
      duration,
      reason,
    } = req.body;

    // Vérifier la disponibilité du créneau
    const isAvailable = await Appointment.isSlotAvailable(
      doctor.id,
      appointmentDate,
      appointmentTime,
    );

    if (!isAvailable) {
      return res.status(400).json({
        success: false,
        message: "Ce créneau n'est plus disponible",
      });
    }

    // Créer le rendez-vous
    const appointment = await Appointment.create({
      patient,
      service,
      doctor,
      appointmentDate,
      appointmentTime,
      duration: duration || 30,
      reason,
      status: "pending",
      createdBy: req.user ? req.user.role : "patient",
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
    });

    // Envoyer la confirmation par email
    try {
      if (sendAppointmentConfirmation) {
        await sendAppointmentConfirmation(appointment);
      }
    } catch (error) {
      console.error("Erreur notification:", error.message);
      // Ne pas bloquer si la notification échoue
    }

    res.status(201).json({
      success: true,
      message: "Rendez-vous créé avec succès",
      data: appointment,
    });
  } catch (error) {
    console.error("Erreur création rendez-vous:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la création du rendez-vous",
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/appointments/:id
 * @desc    Détails d'un rendez-vous
 * @access  Private
 */
router.get("/:id", validateMongoId, validate, protect, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Rendez-vous non trouvé",
      });
    }

    // Vérifier les autorisations
    if (
      req.user.role === "patient" &&
      appointment.patient.email !== req.user.email
    ) {
      return res.status(403).json({
        success: false,
        message: "Accès non autorisé",
      });
    }

    res.status(200).json({
      success: true,
      data: appointment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération du rendez-vous",
      error: error.message,
    });
  }
});

/**
 * @route   PUT /api/appointments/:id
 * @desc    Modifier un rendez-vous
 * @access  Private
 */
router.put("/:id", validateMongoId, validate, protect, async (req, res) => {
  try {
    let appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Rendez-vous non trouvé",
      });
    }

    // Vérifier les autorisations
    if (
      req.user.role === "patient" &&
      appointment.patient.email !== req.user.email
    ) {
      return res.status(403).json({
        success: false,
        message: "Accès non autorisé",
      });
    }

    // Ne pas permettre de modifier un rendez-vous annulé ou complété
    if (["cancelled", "completed"].includes(appointment.status)) {
      return res.status(400).json({
        success: false,
        message: `Impossible de modifier un rendez-vous ${appointment.status}`,
      });
    }

    // Champs modifiables
    const allowedFields = [
      "appointmentDate",
      "appointmentTime",
      "reason",
      "notes",
    ];

    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    // Si changement de date/heure, vérifier la disponibilité
    if (updates.appointmentDate || updates.appointmentTime) {
      const newDate = updates.appointmentDate || appointment.appointmentDate;
      const newTime = updates.appointmentTime || appointment.appointmentTime;

      const isAvailable = await Appointment.isSlotAvailable(
        appointment.doctor.id,
        newDate,
        newTime,
      );

      if (!isAvailable) {
        return res.status(400).json({
          success: false,
          message: "Ce nouveau créneau n'est pas disponible",
        });
      }
    }

    appointment = await Appointment.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: "Rendez-vous mis à jour avec succès",
      data: appointment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour",
      error: error.message,
    });
  }
});

/**
 * @route   DELETE /api/appointments/:id
 * @desc    Annuler un rendez-vous
 * @access  Private
 */
router.delete("/:id", validateMongoId, validate, protect, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Rendez-vous non trouvé",
      });
    }

    // Vérifier les autorisations
    if (
      req.user.role === "patient" &&
      appointment.patient.email !== req.user.email
    ) {
      return res.status(403).json({
        success: false,
        message: "Accès non autorisé",
      });
    }

    // Vérifier si l'annulation est possible (24h avant)
    const hoursBeforeAppointment =
      (new Date(appointment.appointmentDate) - new Date()) / (1000 * 60 * 60);
    const minHours = parseInt(process.env.APPOINTMENT_CANCELLATION_HOURS) || 24;

    if (hoursBeforeAppointment < minHours && req.user.role === "patient") {
      return res.status(400).json({
        success: false,
        message: `Les annulations doivent être faites au moins ${minHours}h à l'avance`,
      });
    }

    // Annuler le rendez-vous
    await appointment.cancel(
      req.body.reason || "Annulation par le patient",
      req.user.role,
    );

    res.status(200).json({
      success: true,
      message: "Rendez-vous annulé avec succès",
      data: appointment,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Erreur lors de l'annulation",
        errors: Object.values(error.errors).map((e) => e.message),
      });
    }
    res.status(500).json({
      success: false,
      message: "Erreur lors de l'annulation",
      error: error.message,
    });
  }
});

/**
 * @route   PUT /api/appointments/:id/confirm
 * @desc    Confirmer un rendez-vous (staff uniquement)
 * @access  Private (staff/admin)
 */
router.put(
  "/:id/confirm",
  validateMongoId,
  validate,
  protect,
  authorize("admin", "doctor", "nurse", "staff"),
  async (req, res) => {
    try {
      const appointment = await Appointment.findById(req.params.id);

      if (!appointment) {
        return res.status(404).json({
          success: false,
          message: "Rendez-vous non trouvé",
        });
      }

      await appointment.confirm();

      res.status(200).json({
        success: true,
        message: "Rendez-vous confirmé",
        data: appointment,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Erreur lors de la confirmation",
        error: error.message,
      });
    }
  },
);

/**
 * @route   GET /api/appointments/available-slots
 * @desc    Créneaux disponibles
 * @access  Public
 */
router.get("/slots/available", async (req, res) => {
  try {
    const { doctorId, date, service } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: "La date est requise",
      });
    }

    // Horaires de travail (à adapter selon vos besoins)
    const workingHours = {
      start: 8, // 8h
      end: 17, // 17h
      slotDuration: parseInt(process.env.APPOINTMENT_SLOT_DURATION) || 30,
    };

    // Générer tous les créneaux possibles
    const slots = [];
    for (let hour = workingHours.start; hour < workingHours.end; hour++) {
      for (let minute = 0; minute < 60; minute += workingHours.slotDuration) {
        const time = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
        slots.push({
          time,
          available: true,
        });
      }
    }

    // Récupérer les rendez-vous existants pour cette date
    const existingAppointments = await Appointment.find({
      ...(doctorId && { "doctor.id": doctorId }),
      appointmentDate: new Date(date),
      status: { $in: ["pending", "confirmed"] },
    });

    // Marquer les créneaux occupés
    existingAppointments.forEach((apt) => {
      const slot = slots.find((s) => s.time === apt.appointmentTime);
      if (slot) {
        slot.available = false;
      }
    });

    res.status(200).json({
      success: true,
      date,
      doctorId,
      slots: slots.filter((s) => s.available),
      totalSlots: slots.length,
      availableSlots: slots.filter((s) => s.available).length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des créneaux",
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/appointments/stats/overview
 * @desc    Statistiques des rendez-vous (admin)
 * @access  Private (admin/staff)
 */
router.get(
  "/stats/overview",
  protect,
  authorize("admin", "doctor", "nurse", "staff"),
  async (req, res) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const stats = {
        total: await Appointment.countDocuments(),
        pending: await Appointment.countDocuments({ status: "pending" }),
        confirmed: await Appointment.countDocuments({ status: "confirmed" }),
        completed: await Appointment.countDocuments({ status: "completed" }),
        cancelled: await Appointment.countDocuments({ status: "cancelled" }),
        today: await Appointment.countDocuments({
          appointmentDate: {
            $gte: today,
            $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
          },
        }),
        byService: {},
      };

      // Statistiques par service — récupération dynamique depuis la BDD
      const Service = require("../models/Service");
      const allServices = await Service.find({}, "slug name").lean();
      for (const svc of allServices) {
        const slug = svc.slug || svc.name;
        if (slug) {
          stats.byService[slug] = await Appointment.countDocuments({
            service: slug,
          });
        }
      }

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Erreur lors de la récupération des statistiques",
        error: error.message,
      });
    }
  },
);

/**
 * @route   PATCH /api/appointments/:id/confirm
 * @desc    Confirmer un rendez-vous (alias PATCH pour admin panel)
 * @access  Private (staff/admin)
 */
router.patch(
  "/:id/confirm",
  validateMongoId,
  validate,
  protect,
  authorize("admin", "doctor", "nurse", "staff"),
  async (req, res) => {
    try {
      const appointment = await Appointment.findById(req.params.id);
      if (!appointment)
        return res
          .status(404)
          .json({ success: false, message: "Rendez-vous non trouvé" });
      await appointment.confirm();
      res.status(200).json({
        success: true,
        message: "Rendez-vous confirmé",
        data: appointment,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Erreur lors de la confirmation",
        error: error.message,
      });
    }
  },
);

/**
 * @route   PATCH /api/appointments/:id/cancel
 * @desc    Annuler un rendez-vous (alias PATCH pour admin panel)
 * @access  Private (staff/admin)
 */
router.patch(
  "/:id/cancel",
  validateMongoId,
  validate,
  protect,
  authorize("admin", "doctor", "nurse", "staff"),
  async (req, res) => {
    try {
      const appointment = await Appointment.findById(req.params.id);
      if (!appointment)
        return res
          .status(404)
          .json({ success: false, message: "Rendez-vous non trouvé" });
      const { reason, cancelledBy } = req.body;
      await appointment.cancel(
        reason || "Annulé par l'administration",
        cancelledBy || "hospital",
      );

      // Envoyer email d'annulation au patient
      try {
        const { sendEmail } = require("../utils/notifications");
        const dateStr = new Date(
          appointment.appointmentDate,
        ).toLocaleDateString("fr-FR", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });
        await sendEmail({
          email: appointment.patient.email,
          subject: "❌ Rendez-vous annulé - CHU Yaoundé",
          message:
            `Bonjour ${appointment.patient.firstName} ${appointment.patient.lastName},\n\nNous vous informons que votre rendez-vous a été annulé.\n\n📋 Rendez-vous concerné :\n📅 Date : ${dateStr}\n🕐 Heure : ${appointment.appointmentTime}\n🏥 Service : ${appointment.service}\n👨‍⚕️ Médecin : ${appointment.doctor?.name || "Non précisé"}\n\n${reason ? "📝 Motif d'annulation : " + reason + "\n\n" : ""}Pour reprendre un rendez-vous, rendez-vous sur notre site ou contactez-nous au 651 94 80 64.\n\nNous nous excusons pour la gêne occasionnée.\n\nCHU Yaoundé - Excellence en santé, enseignement et recherche`.trim(),
        });
      } catch (emailErr) {
        console.error("Erreur envoi email annulation:", emailErr.message);
        // Ne pas bloquer si l'email échoue
      }

      res.status(200).json({
        success: true,
        message: "Rendez-vous annulé",
        data: appointment,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Erreur lors de l'annulation",
        error: error.message,
      });
    }
  },
);

module.exports = router;
