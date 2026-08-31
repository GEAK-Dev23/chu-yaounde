#!/bin/bash
# ================================================
# DÉMARRAGE LOCAL - CHU YAOUNDÉ
# ================================================
# Ce script démarre le backend (API) et sert le frontend en local
# MongoDB Atlas en ligne est utilisé automatiquement via le fichier .env

set -e

echo ""
echo "╔═══════════════════════════════════════════╗"
echo "║     🏥 CHU YAOUNDÉ - DÉMARRAGE LOCAL     ║"
echo "╚═══════════════════════════════════════════╝"
echo ""

# Vérifications préalables
command -v node >/dev/null 2>&1 || { echo "❌ Node.js n'est pas installé. Installez Node.js >= 18"; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "❌ npm n'est pas installé."; exit 1; }

NODE_VER=$(node -v | sed 's/v//' | cut -d. -f1)
if [ "$NODE_VER" -lt 18 ]; then
  echo "❌ Node.js >= 18 requis. Version actuelle: $(node -v)"; exit 1
fi

echo "✅ Node.js $(node -v) détecté"

# Installation des dépendances backend
echo ""
echo "📦 Installation des dépendances backend..."
cd "$(dirname "$0")/backend"

if [ ! -d "node_modules" ]; then
  npm install
  echo "✅ Dépendances installées"
else
  echo "✅ Dépendances déjà installées"
fi

# Vérifier le fichier .env
if [ ! -f ".env" ]; then
  echo "❌ Fichier .env manquant! Copiez .env.example en .env et configurez-le."
  exit 1
fi

# Vérifier la variable MONGO_URI
if grep -q "MONGO_URI=mongodb+srv://" .env; then
  echo "✅ MongoDB Atlas configuré dans .env"
else
  echo "⚠️  Vérifiez que MONGO_URI est bien configuré dans backend/.env"
fi

echo ""
echo "🚀 Démarrage du serveur backend sur http://localhost:5000 ..."
echo "   (Utilisation de MongoDB Atlas - connexion en ligne)"
echo ""

# Démarrer le backend en arrière-plan
npm run dev &
BACKEND_PID=$!
echo "   Backend PID: $BACKEND_PID"

# Attendre que le backend soit prêt
sleep 3

# Servir le frontend
echo ""
echo "🌐 Démarrage du serveur frontend..."

cd "$(dirname "$0")/frontend"

# Utiliser npx serve ou python selon ce qui est disponible
if command -v npx >/dev/null 2>&1; then
  echo "   Frontend accessible sur http://localhost:8080"
  echo ""
  echo "╔═══════════════════════════════════════════╗"
  echo "║  ✅ Sites accessible sur:                 ║"
  echo "║     http://localhost:8080                 ║"
  echo "║  ✅ API sur: http://localhost:5000        ║"
  echo "║  🛑 Ctrl+C pour arrêter                   ║"
  echo "╚═══════════════════════════════════════════╝"
  echo ""
  npx serve -p 8080 . || npx http-server -p 8080 .
elif command -v python3 >/dev/null 2>&1; then
  echo "   Frontend accessible sur http://localhost:8080"
  echo ""
  echo "╔═══════════════════════════════════════════╗"
  echo "║  ✅ Sites accessible sur:                 ║"
  echo "║     http://localhost:8080                 ║"
  echo "║  ✅ API sur: http://localhost:5000        ║"
  echo "║  🛑 Ctrl+C pour arrêter                   ║"
  echo "╚═══════════════════════════════════════════╝"
  echo ""
  python3 -m http.server 8080
else
  echo "❌ Aucun serveur frontend disponible."
  echo "   Installez 'serve' : npm install -g serve"
  echo "   Puis relancez ce script."
  kill $BACKEND_PID 2>/dev/null
  exit 1
fi

# Nettoyage à l'arrêt
trap "echo ''; echo '🛑 Arrêt...'; kill $BACKEND_PID 2>/dev/null; exit 0" INT TERM
wait $BACKEND_PID
