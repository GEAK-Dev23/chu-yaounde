require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    const User = require("./models/User");

    const hash = await bcrypt.hash("Admin@2024", 10);

    await User.deleteOne({ email: "admin@chu.cm" });
    await User.create({
      firstName: "Admin",
      lastName: "CHU",
      email: "admin@chu.cm",
      password: hash,
      role: "admin",
    });

    console.log("✅ Admin créé avec succès !");
    console.log("Email: admin@chu.cm");
    console.log("Mot de passe: Admin@2024");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Erreur:", err);
    process.exit(1);
  });
