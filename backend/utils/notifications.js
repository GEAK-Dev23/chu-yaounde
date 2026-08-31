/**
 * ================================================
 * SERVICE DE NOTIFICATIONS
 * ================================================
 */

const nodemailer = require("nodemailer");

// ========================================
// Configuration Email
// ========================================
let emailTransporter = null;

if (process.env.EMAIL_USERNAME && process.env.EMAIL_PASSWORD) {
  emailTransporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === "true",
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
  console.log("✅ Service email initialisé");
} else {
  console.log("ℹ️  Email non configuré - Les emails sont désactivés");
}

// ========================================
// Configuration SMS (Twilio) - OPTIONNEL
// ========================================
const twilio = require("twilio");
let twilioClient = null;

if (
  process.env.TWILIO_ACCOUNT_SID &&
  process.env.TWILIO_AUTH_TOKEN &&
  process.env.TWILIO_ACCOUNT_SID.startsWith("AC")
) {
  try {
    twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN,
    );
    console.log("✅ Twilio initialisé avec succès");
  } catch (error) {
    console.warn("⚠️  Erreur Twilio:", error.message);
    console.warn("Les SMS ne seront pas disponibles");
  }
} else {
  console.log("ℹ️  Twilio non configuré - Les SMS sont désactivés");
}

// ========================================
// Fonction d'envoi d'email
// ========================================
exports.sendEmail = async (options) => {
  if (!emailTransporter) {
    console.log("📧 Email simulé (non envoyé):", options.subject);
    return { success: false, message: "Service email non configuré" };
  }

  const mailOptions = {
    from: `${process.env.EMAIL_FROM_NAME || "CHU Yaoundé"} <${process.env.EMAIL_FROM || process.env.EMAIL_USERNAME}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html || options.message,
  };

  try {
    const info = await emailTransporter.sendMail(mailOptions);
    console.log("✅ Email envoyé:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("❌ Erreur envoi email:", error.message);
    return { success: false, error: error.message };
  }
};

// ========================================
// Fonction d'envoi de SMS
// ========================================
exports.sendSMS = async (to, message) => {
  if (!twilioClient) {
    console.log("📱 SMS simulé (non envoyé) à", to);
    return { success: false, message: "Service SMS non disponible" };
  }

  try {
    const result = await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: to,
    });
    console.log("✅ SMS envoyé:", result.sid);
    return { success: true, sid: result.sid };
  } catch (error) {
    console.error("❌ Erreur envoi SMS:", error.message);
    return { success: false, error: error.message };
  }
};

// ========================================
// Notification d'urgence
// ========================================
exports.sendEmergencyNotification = async (emergency) => {
  const message = `
🚨 URGENCE SIGNALÉE

Type: ${emergency.emergencyType}
Gravité: ${emergency.severity}
Patient: ${emergency.firstName} ${emergency.lastName} (${emergency.age} ans, ${emergency.gender})
Téléphone: ${emergency.phone}

Symptômes: ${emergency.symptoms}

Signalé le: ${new Date(emergency.arrivalTime).toLocaleString("fr-FR")}
  `.trim();

  // Email aux administrateurs
  if (emailTransporter && process.env.ADMIN_NOTIFICATION_EMAIL) {
    await exports.sendEmail({
      email: process.env.ADMIN_NOTIFICATION_EMAIL,
      subject: `🚨 URGENCE: ${emergency.emergencyType}`,
      message: message,
    });
  }

  // SMS si configuré et activé
  if (
    twilioClient &&
    process.env.EMERGENCY_SMS_ENABLED === "true" &&
    process.env.ADMIN_PHONE
  ) {
    await exports.sendSMS(process.env.ADMIN_PHONE, message.substring(0, 160));
  }

  console.log("📢 Notification d'urgence envoyée");
};

// ========================================
// Notification de rendez-vous
// ========================================
exports.sendAppointmentConfirmation = async (appointment) => {
  const dateStr = new Date(appointment.appointmentDate).toLocaleDateString(
    "fr-FR",
    {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    },
  );

  // Email de confirmation au patient
  const patientMessage = `
✅ Rendez-vous enregistré - CHU Yaoundé

Bonjour ${appointment.patient.firstName} ${appointment.patient.lastName},

Votre demande de rendez-vous a bien été enregistrée. Notre équipe vous contactera pour confirmer le créneau.

📋 Récapitulatif :
📅 Date souhaitée : ${dateStr}
🕐 Heure souhaitée : ${appointment.appointmentTime}
👨‍⚕️ Médecin : ${appointment.doctor.name}
🏥 Service : ${appointment.service}
${appointment.reason ? "📝 Motif : " + appointment.reason : ""}

ℹ️ Merci de vous présenter 10 minutes avant l'heure prévue, muni de votre pièce d'identité et de votre carnet de santé.

En cas d'urgence, appelez le : 651 94 80 64

CHU Yaoundé - Excellence en santé, enseignement et recherche
  `.trim();

  await exports.sendEmail({
    email: appointment.patient.email,
    subject: "✅ Rendez-vous enregistré - CHU Yaoundé",
    message: patientMessage,
  });

  // Notification à l'administration
  if (process.env.ADMIN_NOTIFICATION_EMAIL) {
    const adminMessage = `
🔔 Nouvelle demande de rendez-vous

Patient : ${appointment.patient.firstName} ${appointment.patient.lastName}
Email : ${appointment.patient.email}
Téléphone : ${appointment.patient.phone}
Date de naissance : ${new Date(appointment.patient.birthDate).toLocaleDateString("fr-FR")}

📅 Date souhaitée : ${dateStr}
🕐 Heure : ${appointment.appointmentTime}
👨‍⚕️ Médecin : ${appointment.doctor.name}
🏥 Service : ${appointment.service}
${appointment.reason ? "📝 Motif : " + appointment.reason : ""}

Statut : En attente de confirmation
    `.trim();

    await exports.sendEmail({
      email: process.env.ADMIN_NOTIFICATION_EMAIL,
      subject: `🔔 Nouveau RDV - ${appointment.patient.firstName} ${appointment.patient.lastName}`,
      message: adminMessage,
    });
  }
};

// ========================================
// Notification de contact
// ========================================
exports.sendContactConfirmation = async (contact) => {
  // Email de confirmation à l'expéditeur
  const senderMessage = `
Bonjour ${contact.firstName} ${contact.lastName},

Nous avons bien reçu votre message concernant : "${contact.subject}"

Notre équipe vous répondra dans les plus brefs délais (généralement sous 24-48h ouvrées).

Merci de votre confiance.

CHU Yaoundé - Excellence en santé, enseignement et recherche
📞 651 94 80 64 | 📧 chudeyaounde@gmail.com
  `.trim();

  await exports.sendEmail({
    email: contact.email,
    subject: "✉️ Message bien reçu - CHU Yaoundé",
    message: senderMessage,
  });

  // Notification à l'administration avec le contenu du message
  if (process.env.ADMIN_NOTIFICATION_EMAIL) {
    const adminMessage = `
📬 Nouveau message de contact

De : ${contact.firstName} ${contact.lastName}
Email : ${contact.email}
${contact.phone ? "Téléphone : " + contact.phone : ""}
Sujet : ${contact.subject}

Message :
${contact.message}

---
Reçu le : ${new Date().toLocaleString("fr-FR")}
    `.trim();

    await exports.sendEmail({
      email: process.env.ADMIN_NOTIFICATION_EMAIL,
      subject: `📬 Nouveau contact - ${contact.subject} (${contact.firstName} ${contact.lastName})`,
      message: adminMessage,
    });
  }
};
