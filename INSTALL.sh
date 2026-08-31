#!/bin/bash

# ==========================================
# SCRIPT D'INSTALLATION - CHU YAOUNDÉ
# ==========================================

echo "╔═══════════════════════════════════════╗"
echo "║  Installation CHU Yaoundé v2.0       ║"
echo "╚═══════════════════════════════════════╝"
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages
success() {
    echo -e "${GREEN}✅ $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Vérifier Node.js
echo "Vérification de Node.js..."
if ! command -v node &> /dev/null; then
    error "Node.js n'est pas installé!"
    echo "Veuillez installer Node.js version 18 ou supérieure:"
    echo "https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    error "Node.js version $NODE_VERSION détectée. Version 18+ requise."
    exit 1
fi

success "Node.js $(node -v) détecté"

# Vérifier npm
echo "Vérification de npm..."
if ! command -v npm &> /dev/null; then
    error "npm n'est pas installé!"
    exit 1
fi

success "npm $(npm -v) détecté"

# Installation des dépendances backend
echo ""
echo "═══════════════════════════════════════"
echo "Installation des dépendances backend..."
echo "═══════════════════════════════════════"
cd backend

if [ ! -f "package.json" ]; then
    error "Fichier package.json introuvable dans le dossier backend!"
    exit 1
fi

npm install
if [ $? -eq 0 ]; then
    success "Dépendances backend installées"
else
    error "Échec de l'installation des dépendances backend"
    exit 1
fi

# Vérifier le fichier .env
if [ ! -f ".env" ]; then
    warning "Fichier .env manquant!"
    echo "Copie de .env.example vers .env..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        warning "Veuillez configurer le fichier backend/.env avant de démarrer"
    else
        error "Fichier .env.example introuvable!"
        exit 1
    fi
else
    success "Fichier .env détecté"
fi

cd ..

# Créer les dossiers nécessaires
echo ""
echo "Création des dossiers nécessaires..."
mkdir -p backend/uploads
mkdir -p backend/logs
success "Dossiers créés"

# Résumé
echo ""
echo "╔═══════════════════════════════════════╗"
echo "║  Installation terminée avec succès!  ║"
echo "╚═══════════════════════════════════════╝"
echo ""
echo "📝 PROCHAINES ÉTAPES:"
echo ""
echo "1. Configurer le fichier backend/.env si nécessaire"
echo ""
echo "2. Démarrer le backend:"
echo "   cd backend"
echo "   npm start"
echo ""
echo "3. Dans un nouveau terminal, démarrer le frontend:"
echo "   cd frontend"
echo "   python -m http.server 8080"
echo ""
echo "4. Ouvrir le navigateur:"
echo "   http://localhost:8080"
echo ""
echo "📖 Pour plus d'informations, consultez:"
echo "   - DEMARRAGE_RAPIDE.md"
echo "   - CORRECTIONS_CHU.md"
echo ""
success "Bonne installation! 🚀"
