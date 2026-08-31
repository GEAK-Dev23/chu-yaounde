/**
 * ================================================
 * ROUTES CHATBOT INTELLIGENT — CHU YAOUNDÉ
 * ================================================
 * Moteur   : Groq API (gratuit) — llama-3.1-8b-instant
 * Contexte : Données MongoDB en temps réel (cache 10 min)
 * Impact   : ZÉRO modification sur le frontend ou l'admin
 * Routes exposées (identiques à l'original) :
 *   POST /api/chatbot/message
 *   GET  /api/chatbot/suggestions
 *   GET  /api/chatbot/history/:sessionId
 *   POST /api/chatbot/refresh-cache  ← nouveau, optionnel
 * ================================================
 */

"use strict";

const express = require("express");
const router = express.Router();
const Groq = require("groq-sdk");

// Modèles Mongoose — lecture seule, aucune écriture sauf ChatLog
const ChatLog = require("../models/ChatLog");
const Service = require("../models/Service");
const News = require("../models/News");
const Training = require("../models/Training");
const Internship = require("../models/Internship");
const Contest = require("../models/Contest");
const Document = require("../models/Document");

const { optional } = require("../middleware/auth");

// ─────────────────────────────────────────────
// CLIENT GROQ — initialisé au premier appel
// (dotenv est chargé par server.js AVANT que les
//  routes soient utilisées — mais PAS au require())
// ─────────────────────────────────────────────
let _groq = null;
function getGroq() {
  if (!_groq) {
    const key = process.env.GROQ_API_KEY;
    if (!key) throw new Error("[Chatbot] GROQ_API_KEY manquante dans .env");
    _groq = new Groq({ apiKey: key });
  }
  return _groq;
}

// ─────────────────────────────────────────────
// CACHE EN MÉMOIRE
// Toutes les requêtes MongoDB sont mutualisées :
// un seul aller-retour DB toutes les CACHE_TTL ms,
// quel que soit le nombre d'utilisateurs simultanés.
// ─────────────────────────────────────────────
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes
let _cache = null;
let _cacheAt = 0;

// Coupe une chaîne à N caractères
const cut = (s, n = 120) => (s && s.length > n ? s.slice(0, n) + "…" : s || "");

// ─────────────────────────────────────────────
// buildLiveContext()
// Charge toutes les données utiles depuis MongoDB
// et les formate en texte brut pour le prompt.
// Les 6 requêtes sont lancées en parallèle.
// ─────────────────────────────────────────────
async function buildLiveContext() {
  if (_cache && Date.now() - _cacheAt < CACHE_TTL) return _cache;

  const [services, news, trainings, internships, contests, callsForTender] =
    await Promise.all([
      Service.find({ available: true })
        .select(
          "name description hours phone location department staff features",
        )
        .sort("name")
        .lean(),

      News.find({ published: true })
        .select("title excerpt publishedAt category")
        .sort("-publishedAt")
        .limit(8)
        .lean(),

      Training.find()
        .select(
          "title category description duration places nextSession registerEmail",
        )
        .lean(),

      Internship.find({ active: true })
        .select(
          "title description duration level supervision applyEmail applyLink",
        )
        .lean(),

      Contest.find({ active: true })
        .select(
          "title description examDate registrationDeadline subjects status registerEmail registerLink",
        )
        .sort("-createdAt")
        .lean(),

      Document.find({ category: "appel-offre", published: true })
        .select("title description fileUrl")
        .sort("-createdAt")
        .lean(),
    ]);

  const fmt = {
    services: services.length
      ? services
          .map((s) => {
            const staff = s.staff?.length
              ? `  Médecins : ${s.staff.map((m) => `${m.name}${m.specialty ? ` (${m.specialty})` : ""}`).join(", ")}`
              : "";
            const feats = s.features?.length
              ? `  Prestations : ${s.features.join(", ")}`
              : "";
            return [
              `• ${s.name}${s.department ? ` — ${s.department}` : ""}`,
              s.description ? `  ${cut(s.description)}` : "",
              s.hours ? `  Horaires : ${s.hours}` : "",
              s.location ? `  Lieu : ${s.location}` : "",
              s.phone ? `  Tél : ${s.phone}` : "",
              staff,
              feats,
            ]
              .filter(Boolean)
              .join("\n");
          })
          .join("\n\n")
      : "Aucun service disponible.",

    news: news.length
      ? news
          .map(
            (n) =>
              `• [${n.category}] ${n.title}${n.excerpt ? " — " + cut(n.excerpt, 100) : ""}`,
          )
          .join("\n")
      : "Aucune actualité récente.",

    trainings: trainings.length
      ? trainings
          .map((t) =>
            [
              `• ${t.title} (${t.category})`,
              t.duration ? `  Durée : ${t.duration}` : "",
              t.nextSession ? `  Prochaine session : ${t.nextSession}` : "",
              t.places ? `  Places : ${t.places}` : "",
              t.registerEmail ? `  Inscription : ${t.registerEmail}` : "",
            ]
              .filter(Boolean)
              .join("\n"),
          )
          .join("\n\n")
      : "Aucune formation disponible.",

    internships: internships.length
      ? internships
          .map((i) => {
            const contact = i.applyEmail
              ? `  Postuler par email : ${i.applyEmail}`
              : i.applyLink
                ? `  Postuler en ligne : ${i.applyLink}`
                : `  Postuler : chudeyaounde@gmail.com`;
            return [
              `• ${i.title}`,
              i.duration ? `  Durée : ${i.duration}` : "",
              i.level ? `  Niveau : ${i.level}` : "",
              i.supervision ? `  Encadrement : ${i.supervision}` : "",
              i.description ? `  ${cut(i.description)}` : "",
              contact,
            ]
              .filter(Boolean)
              .join("\n");
          })
          .join("\n\n")
      : "Aucun stage disponible.",

    contests: contests.length
      ? contests
          .map((c) => {
            const STATUS = {
              open: "Ouvert",
              soon: "Bientôt ouvert",
              closed: "Clôturé",
            };
            return [
              `• ${c.title} [${STATUS[c.status] || c.status}]`,
              c.description ? `  ${cut(c.description)}` : "",
              c.subjects ? `  Matières : ${c.subjects}` : "",
              c.examDate ? `  Date examen : ${c.examDate}` : "",
              c.registrationDeadline
                ? `  Clôture : ${c.registrationDeadline}`
                : "",
              c.registerEmail
                ? `  S'inscrire par email : ${c.registerEmail}`
                : "",
              c.registerLink ? `  S'inscrire en ligne : ${c.registerLink}` : "",
            ]
              .filter(Boolean)
              .join("\n");
          })
          .join("\n\n")
      : "Aucun concours en cours.",

    callsForTender: callsForTender.length
      ? callsForTender
          .map(
            (d) =>
              `• ${d.title}${d.description ? " — " + cut(d.description, 100) : ""} (téléchargeable sur /documents.html)`,
          )
          .join("\n")
      : "Aucun appel d'offres publié.",
  };

  _cache = fmt;
  _cacheAt = Date.now();
  return fmt;
}

// ─────────────────────────────────────────────
// buildSystemPrompt(ctx)
// ─────────────────────────────────────────────
function buildSystemPrompt(ctx) {
  return `\
Tu es l'assistant virtuel officiel du CHU de Yaoundé (Centre Hospitalier et Universitaire), Cameroun.
Réponds TOUJOURS dans la langue de l'utilisateur (français ou anglais).
Sois chaleureux, clair et précis.

Tu as DEUX rôles :
  A) Assistant du CHU de Yaoundé : informations sur les services, rendez-vous, urgences, actualités, stages, concours.
  B) Assistant médical général : tu peux répondre à des questions médicales générales (symptômes courants, maladies, médicaments, nutrition, hygiène, prévention, premiers secours, anatomie, etc.).

Règles pour le rôle médical général :
- Ne pose JAMAIS de diagnostic médical définitif. Précise toujours qu'une consultation médicale est nécessaire pour un diagnostic sür.
- Pour toute question médicale, donne une réponse informative, pédagogique et rassurante.
- Si la question médicale peut être prise en charge par un service du CHU, propose-le en fin de réponse.
- Pour les urgences médicales, rappelle immédiatement le numéro 651 94 80 64.
- Sois concis (4-6 phrases) sauf si l'utilisateur demande une explication détaillée.

━━━ INFOS GÉNÉRALES ━━━
Email : chudeyaounde@gmail.com | Urgences 24h/24 : 651 94 80 64
Horaires : Lun-Ven 7h30-17h30, Sam 8h-12h | Urgences : 24h/24 7j/7

━━━ SERVICES MÉDICAUX ━━━
${ctx.services}

━━━ ACTUALITÉS & PUBLICATIONS ━━━
${ctx.news}

━━━ FORMATIONS ━━━
${ctx.trainings}

━━━ STAGES ━━━
${ctx.internships}

━━━ CONCOURS & APPELS À CANDIDATURE ━━━
${ctx.contests}

━━━ APPELS D'OFFRES ━━━
${ctx.callsForTender}

━━━ GUIDE DU SITE WEB ━━━
/rendezvous.html      → RDV en 4 étapes : service → médecin → date/heure → confirmation email
/espace-patient.html  → Connexion patient : historique RDV, suivi des demandes
/urgences.html        → Déclaration urgence en ligne + appel direct 651 94 80 64
/actualites.html      → Actualités, événements, publications (filtrage par catégorie)
/services.html        → Liste complète services : horaires, médecins, prestations
/documents.html       → Téléchargement documents officiels et appels d'offres
/etudiants.html       → Stages, formations, concours ouverts
/infos-pratiques.html → Accès, transport, plan, tarifs, mutuelles acceptées
/contact.html         → Formulaire contact, adresse, carte
/presentation.html    → Histoire et mission du CHU

━━━ RÈGLES ━━━
1. Utilise TOUJOURS les données ci-dessus pour répondre.
2. Si une info est absente, dis-le et oriente vers le contact.
3. Urgence vitale → rappelle TOUJOURS le 651 94 80 64.
4. Pour guider, cite le chemin de la page (ex : /rendezvous.html).
5. IMPORTANT : La liste des services ci-dessus est la SEULE source de verite. Ne te base JAMAIS sur l'historique pour lister les services. Si des services apparaissent dans l'historique mais pas dans la liste ci-dessus, IGNORE-LES.
6. Quand on te demande la liste des services, cite-les TOUS sans en omettre aucun, uniquement ceux presents ci-dessus.
7. Ne donne les details complets (medecins, prestations, tel) que si l'utilisateur demande un service specifique.
8. Pour une question medicale generale (maladie, symptome, medicament, anatomie, nutrition, prevention...), reponds avec tes connaissances medicales generales. Termine en proposant le service CHU competent si pertinent.
9. Ne reponds PAS aux sujets sans lien avec la sante, la medecine ou le CHU (politique, sport, divertissement...). Redirige poliment vers ton domaine.`;
}

// ─────────────────────────────────────────────
// FALLBACK LOCAL
// Réponses si Groq est temporairement indisponible
// ─────────────────────────────────────────────
const FALLBACKS = [
  [
    ["urgence", "emergency", "911", "samu"],
    "🚨 Urgence : appelez immédiatement le 651 94 80 64 ou rendez-vous aux urgences du CHU.",
  ],
  [
    ["rendez-vous", "rdv", "appointment", "consulter"],
    "Pour prendre rendez-vous, allez sur /rendezvous.html et suivez les 4 étapes du formulaire.",
  ],
  [
    ["stage", "postuler", "candidature", "internship"],
    "Les offres de stage sont sur /etudiants.html. Pour postuler : chudeyaounde@gmail.com.",
  ],
  [
    ["concours", "appel d'offres", "appel offre"],
    "Consultez /etudiants.html pour les concours et /documents.html pour les appels d'offres.",
  ],
  [
    ["actualité", "publication", "article", "news"],
    "Retrouvez toutes nos actualités sur /actualites.html.",
  ],
  [
    ["horaire", "ouvert", "fermé", "heure"],
    "Horaires : Lun–Ven 7h30–17h30, Sam 8h–12h. Urgences 24h/24.",
  ],
  [
    ["service", "médecin", "spécialité", "doctor"],
    "Consultez /services.html pour la liste complète de nos services et médecins.",
  ],
  [
    ["espace patient", "connexion", "compte", "login"],
    "Accédez à votre espace patient sur /espace-patient.html avec votre email et mot de passe.",
  ],
  [
    ["bonjour", "salut", "hello", "bonsoir", "hi"],
    "Bonjour ! Je suis l'assistant du CHU Yaoundé. Je peux vous aider sur les services du CHU et répondre à vos questions médicales générales. Comment puis-je vous aider ?",
  ],
  [
    [
      "symptôme",
      "symptome",
      "maladie",
      "douleur",
      "fièvre",
      "fievre",
      "médicament",
      "medicament",
    ],
    "🏥 Pour vos questions médicales, je suis temporairement indisponible. Consultez un médecin du CHU ou appelez le 651 94 80 64.",
  ],
];

function getFallbackResponse(msg) {
  const m = msg.toLowerCase();
  for (const [keys, resp] of FALLBACKS) {
    if (keys.some((k) => m.includes(k))) return resp;
  }
  return "Je rencontre une difficulté technique. Contactez-nous au 651 94 80 64 ou à chudeyaounde@gmail.com.";
}

// ─────────────────────────────────────────────
// POST /api/chatbot/message  (interface inchangée)
// ─────────────────────────────────────────────
router.post("/message", optional, async (req, res) => {
  const { message, history = [], sessionId } = req.body;

  if (!message?.trim()) {
    return res
      .status(400)
      .json({ success: false, message: "Le message est requis." });
  }

  let botResponse = "";
  let intent = "groq_llm";

  try {
    const ctx = await buildLiveContext();

    // Detecter le type de question
    const msgLower = message.toLowerCase();
    const isListQuery = /services|liste|quels.*services|tous les/i.test(
      msgLower,
    );
    const isMedicalQuery =
      /sympt[oô]me|maladie|traitement|m[eé]dicament|douleur|fi[eè]vre|tension|diab[eè]te|cancer|vaccin|grossesse|nutrition|anatomie|chirurgie|antibiotique|infection|virus|bact[eé]rie|allergie|blessure|fracture|sang|pression|cardiaque|pulmonaire|digestif|neurologique|dermatologie|ophtalmologie|p[eé]diatrie|hypertension|premiers secours/i.test(
        msgLower,
      );

    // Pour les questions de liste, on n'injecte PAS l'historique :
    // les anciennes reponses bot contiennent des donnees potentiellement
    // obsoletes (ex: services supprimes) qui induisent le LLM en erreur.
    const historyMsgs = isListQuery
      ? []
      : (Array.isArray(history) ? history.slice(-4) : [])
          .filter((h) => h.text?.trim())
          .map((h) => ({
            role: h.sender === "user" ? "user" : "assistant",
            content: h.text,
          }));

    // Ajuster max_tokens selon la nature de la question
    const dynamicMaxTokens = isListQuery ? 1800 : isMedicalQuery ? 1500 : 1200;

    const completion = await getGroq().chat.completions.create({
      model: "llama-3.1-8b-instant",
      max_tokens: dynamicMaxTokens,
      temperature: 0.3,
      messages: [
        { role: "system", content: buildSystemPrompt(ctx) },
        ...historyMsgs,
        { role: "user", content: message.trim() },
      ],
    });

    botResponse =
      completion.choices[0]?.message?.content?.trim() ||
      getFallbackResponse(message);
  } catch (err) {
    console.error("[Chatbot] Groq error:", err.message);
    botResponse = getFallbackResponse(message);
    intent = "fallback";
  }

  // Log non bloquant
  ChatLog.create({
    sessionId: sessionId || `session_${Date.now()}`,
    userMessage: message,
    botResponse,
    intent,
    userId: req.user?._id ?? null,
    metadata: { userAgent: req.get("User-Agent"), ip: req.ip },
  }).catch((e) => console.error("[Chatbot] Log error:", e.message));

  res.json({
    success: true,
    data: { message: botResponse, intent, timestamp: new Date().toISOString() },
  });
});

// ─────────────────────────────────────────────
// GET /api/chatbot/suggestions  (inchangée)
// ─────────────────────────────────────────────
router.get("/suggestions", (_req, res) => {
  res.json({
    success: true,
    data: [
      "Comment prendre rendez-vous ?",
      "Quels sont vos horaires ?",
      "Quels services proposez-vous ?",
      "Comment déclarer une urgence ?",
      "Y a-t-il des stages disponibles ?",
      "Comment postuler pour un stage ?",
      "Y a-t-il des concours ouverts ?",
      "Comment accéder à l'espace patient ?",
    ],
  });
});

// ─────────────────────────────────────────────
// GET /api/chatbot/history/:sessionId  (inchangée)
// ─────────────────────────────────────────────
router.get("/history/:sessionId", async (req, res) => {
  try {
    const logs = await ChatLog.find({ sessionId: req.params.sessionId }).sort(
      "createdAt",
    );
    res.json({ success: true, count: logs.length, data: logs });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Erreur historique.",
      error: err.message,
    });
  }
});

// ─────────────────────────────────────────────
// POST /api/chatbot/refresh-cache
// Vide le cache pour forcer un rechargement immédiat
// depuis MongoDB (utile après modification admin).
// ─────────────────────────────────────────────
router.post("/refresh-cache", async (_req, res) => {
  _cache = null;
  _cacheAt = 0;
  try {
    await buildLiveContext();
    res.json({ success: true, message: "Cache rechargé." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
