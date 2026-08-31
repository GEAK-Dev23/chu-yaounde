/**
 * ROUTES PRÉSENTATION
 * Données pour la page de présentation du CHU
 */

const express = require("express");
const router = express.Router();

// @route   GET /api/presentation/data
// @desc    Obtenir les données de présentation
// @access  Public
router.get("/data", async (req, res) => {
  try {
    const presentationData = {
      success: true,
      data: {
        hero: {
          title: "CHU de Yaoundé",
          subtitle: "Centre Hospitalier Universitaire de Référence",
          description: "Excellence médicale, formation et recherche au service de votre santé",
          image: "/assets/images/presentation/hero-bg.jpg"
        },
        director: {
          name: "Pr. [Nom du Directeur]",
          title: "Directeur Général du CHU de Yaoundé",
          image: "/assets/images/presentation/DG.jpg",
          message: "Le CHU de Yaoundé est un établissement d'excellence médicale..."
        },
        stats: {
          patients: "30000+",
          medecins: "500+",
          services: "25+",
          lits: "800+"
        },
        history: {
          founded: "1958",
          description: "Le Centre Hospitalier Universitaire de Yaoundé est le plus grand hôpital du Cameroun..."
        },
        missions: [
          {
            icon: "fa-heartbeat",
            title: "Soins de Qualité",
            description: "Des soins médicaux de pointe avec des équipements modernes"
          },
          {
            icon: "fa-graduation-cap",
            title: "Formation",
            description: "Formation des futurs professionnels de santé"
          },
          {
            icon: "fa-microscope",
            title: "Recherche",
            description: "Recherche médicale innovante et développement"
          }
        ],
        excellence: [
          {
            title: "Cardiologie",
            description: "Service de cardiologie moderne",
            image: "/assets/images/presentation/e1.jpg"
          },
          {
            title: "Oncologie",
            description: "Traitement du cancer de pointe",
            image: "/assets/images/presentation/e2.jpg"
          },
          {
            title: "Pédiatrie",
            description: "Soins spécialisés pour enfants",
            image: "/assets/images/presentation/e3.jpg"
          }
        ]
      }
    };

    res.status(200).json(presentationData);
  } catch (error) {
    console.error("Erreur récupération données présentation:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des données de présentation"
    });
  }
});

// @route   GET /api/presentation/leadership
// @desc    Obtenir les informations sur la direction
// @access  Public
router.get("/leadership", async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: {
        director: {
          name: "Pr. [Nom]",
          title: "Directeur Général",
          bio: "Biographie...",
          image: "/assets/images/presentation/DG.jpg"
        },
        team: []
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur serveur"
    });
  }
});

module.exports = router;
