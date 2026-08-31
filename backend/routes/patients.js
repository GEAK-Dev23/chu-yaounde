/**
 * ROUTES PATIENTS
 * Gestion de l'espace patient avec persistance MongoDB
 */

const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const Patient = require("../models/Patient");
const Appointment = require("../models/Appointment");

// Service de notifications
let sendAppointmentConfirmation;
let sendEmail;
try {
  const notifications = require("../utils/notifications");
  sendAppointmentConfirmation = notifications.sendAppointmentConfirmation;
  sendEmail = notifications.sendEmail;
} catch (error) {
  console.warn("⚠️  Service de notifications non disponible dans patients.js");
  sendAppointmentConfirmation = async () => {
    console.log("Notification simulée");
  };
  sendEmail = async () => {
    console.log("Email simulé");
  };
}

// ─── Middleware : authentification patient ─────────
const protectPatient = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ success: false, message: "Non autorisé - token manquant" });
    }
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.type !== "patient") {
      return res
        .status(401)
        .json({ success: false, message: "Token invalide" });
    }
    const patient = await Patient.findById(decoded.id).select("-password");
    if (!patient) {
      return res
        .status(401)
        .json({ success: false, message: "Patient non trouvé" });
    }
    if (!patient.isActive) {
      return res
        .status(403)
        .json({ success: false, message: "Compte désactivé" });
    }
    req.patient = patient;
    next();
  } catch (error) {
    return res
      .status(401)
      .json({ success: false, message: "Token invalide ou expiré" });
  }
};

// ─── Helper : données patient sans mot de passe ───
const safePatient = (p) => {
  const obj = p.toObject ? p.toObject() : { ...p };
  delete obj.password;
  return obj;
};

// ─────────────────────────────────────────────────
// @route   POST /api/patients/register
// @access  Public
// ─────────────────────────────────────────────────
router.post("/register", async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      dateOfBirth,
      gender,
      phone,
      email,
      address,
      password,
      bloodGroup,
      emergencyContact,
    } = req.body;

    if (
      !firstName ||
      !lastName ||
      !dateOfBirth ||
      !gender ||
      !phone ||
      !email ||
      !address ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "Veuillez remplir tous les champs obligatoires",
      });
    }

    // Vérifier doublon email ou téléphone
    const existing = await Patient.findOne({
      $or: [{ email: email.toLowerCase() }, { phone }],
    });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Un compte avec cet email ou numéro de téléphone existe déjà",
      });
    }

    const patient = await Patient.create({
      firstName,
      lastName,
      dateOfBirth: new Date(dateOfBirth),
      gender,
      phone,
      email,
      address,
      password, // hashé automatiquement par le pre-save hook
      bloodGroup: bloodGroup || "",
      emergencyContact: emergencyContact || "",
    });

    const token = jwt.sign(
      { id: patient._id, email: patient.email, type: "patient" },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE },
    );

    res.status(201).json({
      success: true,
      message: "Inscription réussie! Bienvenue au CHU de Yaoundé",
      token,
      data: { patient: safePatient(patient) },
    });
  } catch (error) {
    console.error("Erreur inscription patient:", error);
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `Cette valeur pour ${field} est déjà utilisée`,
      });
    }
    res.status(500).json({
      success: false,
      message: "Erreur lors de l'inscription",
      error: error.message,
    });
  }
});

// ─────────────────────────────────────────────────
// @route   POST /api/patients/login
// @access  Public
// ─────────────────────────────────────────────────
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Email et mot de passe requis" });
    }

    // Récupérer avec le mot de passe (select: false par défaut)
    const patient = await Patient.findOne({
      email: email.toLowerCase(),
    }).select("+password");
    if (!patient) {
      return res
        .status(401)
        .json({ success: false, message: "Identifiants invalides" });
    }

    const isMatch = await patient.matchPassword(password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Identifiants invalides" });
    }

    if (!patient.isActive) {
      return res.status(403).json({
        success: false,
        message: "Votre compte a été désactivé. Contactez l'administration.",
      });
    }

    // Mettre à jour lastLogin
    patient.lastLogin = new Date();
    await patient.save({ validateBeforeSave: false });

    const token = jwt.sign(
      { id: patient._id, email: patient.email, type: "patient" },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE },
    );

    res.status(200).json({
      success: true,
      message: "Connexion réussie",
      token,
      data: { patient: safePatient(patient) },
    });
  } catch (error) {
    console.error("Erreur connexion patient:", error);
    res
      .status(500)
      .json({ success: false, message: "Erreur lors de la connexion" });
  }
});

// ─────────────────────────────────────────────────
// @route   GET /api/patients/profile
// @access  Privé (patient)
// ─────────────────────────────────────────────────
router.get("/profile", protectPatient, (req, res) => {
  res
    .status(200)
    .json({ success: true, data: { patient: safePatient(req.patient) } });
});

// ─────────────────────────────────────────────────
// @route   PUT /api/patients/profile
// @access  Privé (patient)
// ─────────────────────────────────────────────────
router.put("/profile", protectPatient, async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      phone,
      address,
      bloodGroup,
      emergencyContact,
      currentPassword,
      newPassword,
    } = req.body;

    const patient = await Patient.findById(req.patient._id).select("+password");

    // Changement de mot de passe
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          message: "Le mot de passe actuel est requis",
        });
      }
      const isMatch = await patient.matchPassword(currentPassword);
      if (!isMatch) {
        return res
          .status(400)
          .json({ success: false, message: "Mot de passe actuel incorrect" });
      }
      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message:
            "Le nouveau mot de passe doit contenir au moins 6 caractères",
        });
      }
      patient.password = newPassword; // re-hashé par le hook
    }

    // Mise à jour des champs autorisés
    if (firstName) patient.firstName = firstName.trim();
    if (lastName) patient.lastName = lastName.trim();
    if (phone) patient.phone = phone.trim();
    if (address) patient.address = address.trim();
    if (bloodGroup !== undefined) patient.bloodGroup = bloodGroup;
    if (emergencyContact !== undefined)
      patient.emergencyContact = emergencyContact.trim();

    await patient.save();

    res.status(200).json({
      success: true,
      message: "Profil mis à jour avec succès",
      data: { patient: safePatient(patient) },
    });
  } catch (error) {
    console.error("Erreur mise à jour profil:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour du profil",
    });
  }
});

// ─────────────────────────────────────────────────
// @route   POST /api/patients/appointments
// @access  Privé (patient)
// ─────────────────────────────────────────────────
router.post("/appointments", protectPatient, async (req, res) => {
  try {
    const { service, appointmentDate, appointmentTime, reason } = req.body;

    if (!service || !appointmentDate || !appointmentTime) {
      return res.status(400).json({
        success: false,
        message: "Service, date et heure sont requis",
      });
    }

    const apptDateTime = new Date(`${appointmentDate}T${appointmentTime}`);
    if (apptDateTime <= new Date()) {
      return res.status(400).json({
        success: false,
        message: "La date du rendez-vous doit être dans le futur",
      });
    }

    const appointment = await Appointment.create({
      patient: {
        firstName: req.patient.firstName,
        lastName: req.patient.lastName,
        email: req.patient.email,
        phone: req.patient.phone,
        birthDate: req.patient.dateOfBirth,
      },
      service,
      doctor: { id: "to-be-assigned", name: "À confirmer", specialty: service },
      appointmentDate: new Date(appointmentDate),
      appointmentTime,
      duration: 30,
      reason: reason || "",
      status: "pending",
      createdBy: "patient",
      ipAddress: req.ip,
    });

    // Envoyer la confirmation par email
    try {
      if (sendAppointmentConfirmation) {
        await sendAppointmentConfirmation(appointment);
      }
    } catch (emailError) {
      console.error("Erreur envoi email confirmation RDV:", emailError.message);
      // Ne pas bloquer la réponse si l'email échoue
    }

    res.status(201).json({
      success: true,
      message:
        "Rendez-vous créé avec succès! Vous serez contacté pour confirmation.",
      data: {
        appointment: {
          id: appointment._id,
          service,
          date: appointmentDate,
          time: appointmentTime,
          status: "pending",
          reason,
        },
      },
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

// ─────────────────────────────────────────────────
// @route   GET /api/patients/appointments
// @access  Privé (patient)
// ─────────────────────────────────────────────────
router.get("/appointments", protectPatient, async (req, res) => {
  try {
    const appointments = await Appointment.find({
      "patient.email": req.patient.email,
    }).sort({ appointmentDate: -1 });

    res
      .status(200)
      .json({ success: true, count: appointments.length, data: appointments });
  } catch (error) {
    console.error("Erreur récupération rendez-vous:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des rendez-vous",
    });
  }
});

// ─────────────────────────────────────────────────
// @route   GET /api/patients/slots
// @access  Public
// ─────────────────────────────────────────────────
router.get("/slots", async (req, res) => {
  try {
    const { date, service } = req.query;
    if (!date)
      return res
        .status(400)
        .json({ success: false, message: "La date est requise" });

    const slotDuration = parseInt(process.env.APPOINTMENT_SLOT_DURATION) || 30;
    const slots = [];
    for (let hour = 8; hour < 17; hour++) {
      for (let minute = 0; minute < 60; minute += slotDuration) {
        slots.push({
          time: `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`,
          available: true,
        });
      }
    }

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const existing = await Appointment.find({
      appointmentDate: { $gte: startOfDay, $lte: endOfDay },
      ...(service && { service }),
      status: { $in: ["pending", "confirmed"] },
    });

    existing.forEach((apt) => {
      const slot = slots.find((s) => s.time === apt.appointmentTime);
      if (slot) slot.available = false;
    });

    res
      .status(200)
      .json({ success: true, date, slots: slots.filter((s) => s.available) });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des créneaux",
    });
  }
});

// ─────────────────────────────────────────────────
// @route   GET /api/patients/messages
// @access  Privé (patient)
// ─────────────────────────────────────────────────
router.get("/messages", protectPatient, async (req, res) => {
  try {
    const patient = await Patient.findById(req.patient._id).select("messages");
    const messages = (patient.messages || []).sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    );
    res
      .status(200)
      .json({ success: true, count: messages.length, data: messages });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des messages",
    });
  }
});

// ─────────────────────────────────────────────────
// @route   POST /api/patients/messages
// @access  Privé (patient)
// ─────────────────────────────────────────────────
router.post("/messages", protectPatient, async (req, res) => {
  try {
    const { subject, content } = req.body;
    if (!subject || !content) {
      return res
        .status(400)
        .json({ success: false, message: "Sujet et message sont requis" });
    }

    const patient = await Patient.findById(req.patient._id);
    const message = {
      subject: subject.trim(),
      content: content.trim(),
      from: "patient",
      read: false,
      reply: null,
    };
    patient.messages.unshift(message);
    await patient.save();

    // Notifier l'administration par email
    try {
      if (sendEmail) {
        const adminMsg = `
📬 Nouveau message d'un patient - Espace Patient

De : ${patient.firstName} ${patient.lastName}
Email : ${patient.email}
${patient.phone ? "Téléphone : " + patient.phone : ""}

Sujet : ${subject.trim()}

Message :
${content.trim()}

---
Envoyé le : ${new Date().toLocaleString("fr-FR")}
        `.trim();

        // Email à l'admin
        await sendEmail({
          email:
            process.env.ADMIN_NOTIFICATION_EMAIL || process.env.EMAIL_USERNAME,
          subject: `📬 Message patient - ${subject.trim()} (${patient.firstName} ${patient.lastName})`,
          message: adminMsg,
        });

        // Email de confirmation au patient
        const confirmMsg = `
Bonjour ${patient.firstName} ${patient.lastName},

Votre message a bien été reçu par l'équipe médicale du CHU Yaoundé.

Sujet : ${subject.trim()}

L'équipe médicale vous répondra dans les 24-48h ouvrées.

Merci de votre confiance.

CHU Yaoundé - Excellence en santé, enseignement et recherche
📞 651 94 80 64 | 📧 chudeyaounde@gmail.com
        `.trim();

        await sendEmail({
          email: patient.email,
          subject: "✉️ Message bien reçu - CHU Yaoundé",
          message: confirmMsg,
        });
      }
    } catch (emailError) {
      console.error("Erreur envoi email message patient:", emailError.message);
      // Ne pas bloquer la réponse si l'email échoue
    }

    res.status(201).json({
      success: true,
      message:
        "Message envoyé avec succès. L'équipe médicale vous répondra dans les 24-48h.",
      data: { message: patient.messages[0] },
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Erreur lors de l'envoi du message" });
  }
});

module.exports = router;
