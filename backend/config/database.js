/**
 * ================================================
 * CONFIGURATION BASE DE DONNÉES MONGODB
 * ================================================
 */

const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // Options Mongoose 8.x
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log(`
╔═══════════════════════════════════════════════════╗
║   ✅ MongoDB Connecté avec succès!                 ║
╠═══════════════════════════════════════════════════╣
║   Host: ${conn.connection.host.padEnd(42)} ║
║   DB:   ${conn.connection.name.padEnd(42)} ║
╚═══════════════════════════════════════════════════╝
    `);

    // Gestion des événements de connexion
    mongoose.connection.on("connected", () => {
      console.log("📡 Mongoose connecté à MongoDB");
    });

    mongoose.connection.on("error", (err) => {
      console.error("❌ Erreur de connexion MongoDB:", err);
    });

    mongoose.connection.on("disconnected", () => {
      console.log("⚠️  Mongoose déconnecté de MongoDB");
    });

    return conn;
  } catch (error) {
    console.error("❌ Erreur de connexion à MongoDB:", error.message);
    console.error("Détails:", error);
    process.exit(1);
  }
};

module.exports = connectDB;
