/**
 * ================================================
 * HELPERS PARTAGÉS POUR LES TESTS
 * ================================================
 *
 * Ces tests fonctionnent en "boîte noire" : ils envoient de vraies
 * requêtes HTTP au serveur backend, exactement comme le ferait le
 * navigateur. Cela veut dire que le serveur (`npm start` ou
 * `npm run dev`) doit être démarré et joignable AVANT de lancer
 * `npm test`.
 *
 * Comme le serveur utilise la vraie base MongoDB Atlas définie dans
 * .env, toutes les données créées par ces tests sont clairement
 * préfixées par TEST_TAG pour être faciles à repérer (et à
 * supprimer manuellement depuis le panel admin si besoin).
 */

const request = require("supertest");

// URL du serveur à tester. Modifiable via variable d'environnement si besoin,
// par exemple : TEST_BASE_URL=http://localhost:5000 npm test
const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:5000";

// Identifiants admin : ceux créés par database/seed/admin-user.js
// (valeurs par défaut si les variables d'environnement ne sont pas positionnées)
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "chudeyaounde@gmail.com";
const ADMIN_PASSWORD = process.env.ADMIN_DEFAULT_PASSWORD || "Admin@2024Change";

// Étiquette unique par exécution, pour repérer/nettoyer les données de test
const TEST_TAG = `TEST-AUTO-${Date.now()}`;

function api() {
  return request(BASE_URL);
}

let cachedAdminToken = null;

/**
 * Se connecte avec le compte admin seedé et met le token en cache
 * pour ne pas se reconnecter à chaque test.
 * Retourne `null` si la connexion échoue (le test appelant doit alors
 * gérer le cas gracieusement plutôt que planter).
 */
async function getAdminToken() {
  if (cachedAdminToken) return cachedAdminToken;

  const res = await api()
    .post("/api/auth/login")
    .send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD });

  if (res.status === 200 && res.body && res.body.token) {
    cachedAdminToken = res.body.token;
  }

  return cachedAdminToken;
}

module.exports = {
  api,
  BASE_URL,
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  TEST_TAG,
  getAdminToken,
};
