/**
 * ================================================
 * SCRIPT SEED - CRÉATION COMPTE ADMIN INITIAL
 * CHU Yaoundé
 * ================================================
 * Usage: node database/seed/admin-user.js
 * (depuis le dossier /backend)
 */

require("dotenv").config({
  path: require("path").join(__dirname, "../../backend/.env"),
});

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// Connexion MongoDB
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connecté");
  } catch (err) {
    console.error("❌ Erreur connexion MongoDB:", err.message);
    process.exit(1);
  }
}

// Schéma User simplifié (compatible avec le modèle existant)
const UserSchema = new mongoose.Schema(
  {
    firstName: String,
    lastName: String,
    email: { type: String, lowercase: true },
    password: { type: String, select: false },
    role: { type: String, default: "admin" },
    phone: String,
    isActive: { type: Boolean, default: true },
    lastLogin: Date,
  },
  { timestamps: true },
);

const User = mongoose.models.User || mongoose.model("User", UserSchema);

async function seedAdmin() {
  await connectDB();

  const adminEmail = process.env.ADMIN_EMAIL || "admin@chu-yaounde.cm";
  const adminPassword = process.env.ADMIN_DEFAULT_PASSWORD || "Admin@CHU2024!";

  // Vérifier si admin existe déjà
  const existing = await User.findOne({
    email: adminEmail.toLowerCase(),
  }).select("+password");

  if (existing) {
    console.log(`ℹ️  Un compte admin existe déjà: ${adminEmail}`);
    console.log(
      "   Souhaitez-vous le réinitialiser ? (Exécutez avec --reset pour forcer)",
    );

    if (process.argv.includes("--reset")) {
      const salt = await bcrypt.genSalt(
        parseInt(process.env.BCRYPT_ROUNDS) || 10,
      );
      existing.password = await bcrypt.hash(adminPassword, salt);
      existing.isActive = true;
      await existing.save();
      console.log("✅ Mot de passe admin réinitialisé");
    }
  } else {
    // Créer le compte admin
    const salt = await bcrypt.genSalt(
      parseInt(process.env.BCRYPT_ROUNDS) || 10,
    );
    const hashedPassword = await bcrypt.hash(adminPassword, salt);

    await User.create({
      firstName: "Administrateur",
      lastName: "CHU",
      email: adminEmail.toLowerCase(),
      password: hashedPassword,
      role: "admin",
      phone: "+237 222 23 40 30",
      isActive: true,
    });

    console.log("✅ Compte administrateur créé avec succès!");
  }

  console.log("\n📋 Informations de connexion:");
  console.log(`   URL Admin:    http://localhost:8080/admin-panel/`);
  console.log(`   Email:        ${adminEmail}`);
  console.log(`   Mot de passe: ${adminPassword}`);
  console.log(
    "\n⚠️  IMPORTANT: Changez ce mot de passe après la première connexion!",
  );

  await mongoose.disconnect();
  process.exit(0);
}

seedAdmin().catch((err) => {
  console.error("❌ Erreur:", err.message);
  process.exit(1);
});
