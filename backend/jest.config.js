/**
 * Configuration Jest pour la suite de tests fonctionnels du backend.
 *
 * Ces tests sont des tests d'intégration "boîte noire" : ils envoient
 * de vraies requêtes HTTP au serveur (voir tests/helpers.js), qui lui-même
 * communique avec la vraie base MongoDB Atlas. Un délai plus long que
 * la valeur par défaut de Jest (5000 ms) est donc nécessaire.
 */
module.exports = {
  testEnvironment: "node",
  testMatch: ["**/tests/**/*.test.js"],
  testTimeout: 30000,
  verbose: true,
  // Ces tests sont des tests d'intégration qui envoient de vraies requêtes
  // HTTP à UN SEUL serveur Express (mono-thread) déjà démarré. Si Jest les
  // exécute en parallèle (comportement par défaut : plusieurs fichiers de
  // test = plusieurs workers simultanés), toutes ces requêtes se bousculent
  // sur le même event loop et peuvent geler le serveur, provoquant des
  // timeouts en cascade même sur des routes triviales comme /health.
  // On force donc une exécution en série, fichier par fichier.
  maxWorkers: 1,
};
