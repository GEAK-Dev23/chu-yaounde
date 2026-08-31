/**
 * ================================================
 * ROUTES ADMINISTRATION
 * ================================================
 */

const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Appointment = require("../models/Appointment");
const Contact = require("../models/Contact");
const Emergency = require("../models/Emergency");
const News = require("../models/News");
const Service = require("../models/Service");
const { protect, authorize } = require("../middleware/auth");

/**
 * @route   GET /api/admin/dashboard
 * @desc    Tableau de bord admin
 * @access  Private (admin)
 */
router.get("/dashboard", protect, authorize("admin"), async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Statistiques générales
    const stats = {
      users: {
        total: await User.countDocuments(),
        patients: await User.countDocuments({ role: "patient" }),
        staff: await User.countDocuments({
          role: { $in: ["doctor", "nurse", "staff"] },
        }),
        admins: await User.countDocuments({ role: "admin" }),
        newThisMonth: await User.countDocuments({
          createdAt: {
            $gte: new Date(today.getFullYear(), today.getMonth(), 1),
          },
        }),
      },
      appointments: {
        total: await Appointment.countDocuments(),
        pending: await Appointment.countDocuments({ status: "pending" }),
        confirmed: await Appointment.countDocuments({ status: "confirmed" }),
        today: await Appointment.countDocuments({
          appointmentDate: {
            $gte: today,
            $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
          },
        }),
      },
      emergencies: {
        total: await Emergency.countDocuments(),
        pending: await Emergency.countDocuments({ status: "pending" }),
        inProgress: await Emergency.countDocuments({ status: "in_progress" }),
        today: await Emergency.countDocuments({
          reportedAt: { $gte: today },
        }),
      },
      contacts: {
        total: await Contact.countDocuments(),
        unread: await Contact.countDocuments({ status: "new" }),
        pending: await Contact.countDocuments({ status: "read" }),
        new: await Contact.countDocuments({ status: "new" }),
      },
      news: {
        total: await News.countDocuments(),
        published: await News.countDocuments({ published: true }),
        draft: await News.countDocuments({ published: false }),
      },
      services: {
        total: await Service.countDocuments(),
        active: await Service.countDocuments({ available: true }),
      },
    };

    // Dernières activités
    const recentAppointments = await Appointment.find()
      .sort("-createdAt")
      .limit(5);

    const recentContacts = await Contact.find().sort("-createdAt").limit(5);

    const recentEmergencies = await Emergency.find()
      .sort("-reportedAt")
      .limit(5);

    res.status(200).json({
      success: true,
      data: {
        stats,
        recent: {
          appointments: recentAppointments,
          contacts: recentContacts,
          emergencies: recentEmergencies,
        },
      },
    });
  } catch (error) {
    console.error("Erreur dashboard admin:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des données",
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/admin/stats/overview
 * @desc    Statistiques globales
 * @access  Private (admin)
 */
router.get("/stats/overview", protect, authorize("admin"), async (req, res) => {
  try {
    const { period = "month" } = req.query;

    let startDate = new Date();
    if (period === "week") {
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === "month") {
      startDate.setMonth(startDate.getMonth() - 1);
    } else if (period === "year") {
      startDate.setFullYear(startDate.getFullYear() - 1);
    }

    const stats = {
      period,
      appointments: {
        total: await Appointment.countDocuments({
          createdAt: { $gte: startDate },
        }),
        byStatus: {
          pending: await Appointment.countDocuments({
            createdAt: { $gte: startDate },
            status: "pending",
          }),
          confirmed: await Appointment.countDocuments({
            createdAt: { $gte: startDate },
            status: "confirmed",
          }),
          completed: await Appointment.countDocuments({
            createdAt: { $gte: startDate },
            status: "completed",
          }),
          cancelled: await Appointment.countDocuments({
            createdAt: { $gte: startDate },
            status: "cancelled",
          }),
        },
      },
      emergencies: {
        total: await Emergency.countDocuments({
          reportedAt: { $gte: startDate },
        }),
        byStatus: {
          pending: await Emergency.countDocuments({
            reportedAt: { $gte: startDate },
            status: "pending",
          }),
          resolved: await Emergency.countDocuments({
            reportedAt: { $gte: startDate },
            status: "resolved",
          }),
        },
      },
      newUsers: await User.countDocuments({
        createdAt: { $gte: startDate },
      }),
      messages: await Contact.countDocuments({
        createdAt: { $gte: startDate },
      }),
    };

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
});

/**
 * @route   GET /api/admin/logs
 * @desc    Logs système (si implémenté)
 * @access  Private (admin)
 */
router.get("/logs", protect, authorize("admin"), async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: "Logs système (à implémenter)",
      data: [],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur",
      error: error.message,
    });
  }
});

module.exports = router;
