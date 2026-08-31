/**
 * ================================================
 * SCRIPT SEED - SERVICES & PERSONNEL MÉDICAL
 * CHU Yaoundé
 * ================================================
 * Usage: node database/seed/services-data.js
 * (depuis le dossier /backend)
 *
 * Ce script peuple la base avec les services qui
 * s'affichent sur la page frontend /services.html
 * ET les médecins disponibles pour les rendez-vous.
 * Exécutez --reset pour tout réinitialiser.
 */

require("dotenv").config({
  path: require("path").join(__dirname, "../../backend/.env"),
});
const mongoose = require("mongoose");
const Service = require("../../backend/models/Service");

async function connectDB() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ MongoDB connecté");
}

const SERVICES = [
  // ── MÉDICAUX ────────────────────────────────────────────────
  {
    name: "Cardiologie",
    slug: "cardiology",
    category: "medical",
    department: "Médecine",
    description:
      "Prise en charge complète des maladies cardiovasculaires avec des technologies de pointe et une équipe spécialisée.",
    icon: "fas fa-heartbeat",
    features: [
      "Consultation",
      "Échographie cardiaque",
      "Holter ECG",
      "Stress test",
    ],
    hours: "Lun-Ven: 7h30-17h30",
    phone: "+237 672 59 26 95",
    location: "Bâtiment B, 1er étage",
    available: true,
    featured: true,
    order: 1,
    staff: [
      { id: "dr1", name: "Dr. Alain Mbarga", specialty: "Cardiologue" },
      {
        id: "dr2",
        name: "Dr. Marie Ngo",
        specialty: "Cardiologue Pédiatrique",
      },
    ],
  },
  {
    name: "Pédiatrie",
    slug: "pediatrics",
    category: "medical",
    department: "Médecine",
    description:
      "Soins spécialisés pour les enfants de 0 à 18 ans dans un environnement adapté et sécurisé.",
    icon: "fas fa-baby",
    features: [
      "Vaccination",
      "Suivi croissance",
      "Urgences pédiatriques",
      "Consultation spécialisée",
    ],
    hours: "Lun-Sam: 8h00-18h00",
    phone: "+237 672 59 26 95",
    location: "Bâtiment C, RDC",
    available: true,
    featured: true,
    order: 2,
    staff: [
      { id: "dr3", name: "Dr. Sophie Tchoupa", specialty: "Pédiatre" },
      { id: "dr4", name: "Dr. Jean Kana", specialty: "Pédiatre Néonatologue" },
    ],
  },
  {
    name: "Neurologie",
    slug: "neurology",
    category: "medical",
    department: "Médecine",
    description:
      "Diagnostic et traitement des maladies du système nerveux avec une expertise reconnue.",
    icon: "fas fa-brain",
    features: ["EEG", "EMG", "Consultation", "Imagerie cérébrale"],
    hours: "Lun-Ven: 8h00-16h00",
    phone: "+237 672 59 26 95",
    location: "Bâtiment A, 3e étage",
    available: true,
    featured: false,
    order: 3,
    staff: [{ id: "dr9", name: "Dr. Pierre Ndongo", specialty: "Neurologue" }],
  },
  {
    name: "Dermatologie",
    slug: "dermatology",
    category: "medical",
    department: "Médecine",
    description:
      "Soins des maladies de la peau, des cheveux et des ongles avec des traitements modernes.",
    icon: "fas fa-allergies",
    features: ["Consultation", "Cryothérapie", "Biopsie", "Traitement laser"],
    hours: "Lun-Ven: 8h00-17h00",
    phone: "+237 672 59 26 95",
    location: "Bâtiment B, 2e étage",
    available: true,
    featured: false,
    order: 4,
    staff: [
      { id: "dr12", name: "Dr. Linda Mbappe", specialty: "Dermatologue" },
    ],
  },
  {
    name: "Médecine Générale",
    slug: "general",
    category: "medical",
    department: "Médecine",
    description:
      "Consultations médicales générales et suivi des patients pour tous types de pathologies courantes.",
    icon: "fas fa-stethoscope",
    features: [
      "Consultation",
      "Bilan de santé",
      "Certificats médicaux",
      "Suivi chroniques",
    ],
    hours: "Lun-Sam: 7h30-18h00",
    phone: "+237 672 59 26 95",
    location: "Bâtiment A, RDC",
    available: true,
    featured: true,
    order: 5,
    staff: [
      { id: "dr7", name: "Dr. Marc Owona", specialty: "Médecin Généraliste" },
      { id: "dr8", name: "Dr. Claire Nkeng", specialty: "Médecin Généraliste" },
    ],
  },
  // ── CHIRURGICAUX ─────────────────────────────────────────────
  {
    name: "Chirurgie Générale",
    slug: "surgery",
    category: "surgical",
    department: "Chirurgie",
    description:
      "Interventions chirurgicales de routine et spécialisées avec des techniques modernes.",
    icon: "fas fa-user-md",
    features: [
      "Chirurgie ambulatoire",
      "Laparoscopie",
      "Chirurgie digestive",
      "Urgences chirurgicales",
    ],
    hours: "24h/24",
    phone: "+237 672 59 26 95",
    location: "Bâtiment D, 1er étage",
    available: true,
    featured: true,
    order: 6,
    staff: [
      { id: "dr5", name: "Dr. Paul Ndi", specialty: "Chirurgien Général" },
      {
        id: "dr6",
        name: "Dr. Alice Mballa",
        specialty: "Chirurgienne Cardiaque",
      },
    ],
  },
  {
    name: "Chirurgie Orthopédique",
    slug: "orthopedics",
    category: "surgical",
    department: "Chirurgie",
    description:
      "Traitement chirurgical des troubles musculo-squelettiques et traumatismes.",
    icon: "fas fa-bone",
    features: [
      "Prothèses",
      "Traumatologie",
      "Arthroscopie",
      "Chirurgie du rachis",
    ],
    hours: "Lun-Ven: 7h30-17h30",
    phone: "+237 672 59 26 95",
    location: "Bâtiment D, RDC",
    available: true,
    featured: false,
    order: 7,
    staff: [
      {
        id: "dr13",
        name: "Dr. Robert Abena",
        specialty: "Chirurgien Orthopédiste",
      },
    ],
  },
  // ── SPÉCIALISÉS ──────────────────────────────────────────────
  {
    name: "Dentisterie",
    slug: "dentistry",
    category: "specialized",
    department: "Spécialisé",
    description:
      "Soins dentaires complets : prévention, traitement et chirurgie bucco-dentaire.",
    icon: "fas fa-tooth",
    features: ["Détartrage", "Extraction", "Prothèses", "Orthodontie"],
    hours: "Lun-Ven: 8h00-17h00",
    phone: "+237 672 59 26 95",
    location: "Bâtiment E, RDC",
    available: true,
    featured: false,
    order: 8,
    staff: [{ id: "dr10", name: "Dr. Sarah Tchakoute", specialty: "Dentiste" }],
  },
  {
    name: "Ophtalmologie",
    slug: "ophthalmology",
    category: "specialized",
    department: "Spécialisé",
    description:
      "Diagnostic et traitement des maladies oculaires avec équipements de dernière génération.",
    icon: "fas fa-eye",
    features: ["Bilan visuel", "Fond d'œil", "Chirurgie LASER", "Glaucome"],
    hours: "Lun-Ven: 8h00-16h30",
    phone: "+237 672 59 26 95",
    location: "Bâtiment E, 1er étage",
    available: true,
    featured: false,
    order: 9,
    staff: [
      { id: "dr11", name: "Dr. David Fokou", specialty: "Ophtalmologue" },
    ],
  },
];

async function seedServices() {
  await connectDB();

  const reset = process.argv.includes("--reset");

  if (reset) {
    await Service.deleteMany({});
    console.log("🗑️  Services existants supprimés");
  }

  let created = 0;
  let skipped = 0;

  for (const serviceData of SERVICES) {
    const existing = await Service.findOne({ slug: serviceData.slug });
    if (existing && !reset) {
      // Mettre à jour le personnel si le service existe déjà
      await Service.findByIdAndUpdate(existing._id, {
        staff: serviceData.staff,
      });
      skipped++;
    } else if (!existing) {
      await Service.create(serviceData);
      created++;
    }
  }

  console.log(
    `✅ ${created} service(s) créé(s), ${skipped} déjà existant(s) (personnel mis à jour)`,
  );
  console.log("\n📋 Services disponibles:");
  SERVICES.forEach((s) =>
    console.log(`   • ${s.name} (${s.staff.length} médecin(s))`),
  );
  console.log(
    "\n💡 Astuce: Utilisez le panel admin pour ajouter/modifier le personnel de chaque service.",
  );
  console.log(
    "   Ces médecins apparaîtront dans la liste de sélection lors des prises de RDV.",
  );

  await mongoose.disconnect();
  process.exit(0);
}

seedServices().catch((err) => {
  console.error("❌ Erreur:", err.message);
  process.exit(1);
});
