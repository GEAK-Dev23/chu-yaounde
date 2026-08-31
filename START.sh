#!/bin/bash

# ==========================================
# SCRIPT DE DÉMARRAGE - CHU YAOUNDÉ
# ==========================================

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}"
echo "╔═══════════════════════════════════════╗"
echo "║     CHU Yaoundé - Démarrage          ║"
echo "╚═══════════════════════════════════════╝"
echo -e "${NC}"

# Vérifier si le backend est installé
if [ ! -d "backend/node_modules" ]; then
    echo -e "${RED}❌ Dépendances backend non installées!${NC}"
    echo -e "${YELLOW}⚠️  Veuillez d'abord exécuter: ./INSTALL.sh${NC}"
    exit 1
fi

# Démarrer le backend en arrière-plan
echo -e "${BLUE}🚀 Démarrage du backend sur le port 5000...${NC}"
cd backend
npm start &
BACKEND_PID=$!
cd ..

# Attendre que le backend démarre
echo -e "${YELLOW}⏳ Attente du démarrage du backend (5 secondes)...${NC}"
sleep 5

# Vérifier si le backend est accessible
if curl -s http://localhost:5000/health > /dev/null; then
    echo -e "${GREEN}✅ Backend opérationnel!${NC}"
else
    echo -e "${RED}❌ Le backend n'a pas pu démarrer${NC}"
    echo -e "${YELLOW}⚠️  Vérifiez les logs ci-dessus${NC}"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

# Démarrer le frontend
echo ""
echo -e "${BLUE}🌐 Démarrage du frontend sur le port 8080...${NC}"
cd frontend

# Vérifier Python
if command -v python3 &> /dev/null; then
    python3 -m http.server 8080 &
elif command -v python &> /dev/null; then
    python -m http.server 8080 &
else
    echo -e "${RED}❌ Python n'est pas installé!${NC}"
    echo -e "${YELLOW}⚠️  Installez Python ou utilisez une autre méthode pour servir le frontend${NC}"
    kill $BACKEND_PID
    exit 1
fi

FRONTEND_PID=$!
cd ..

sleep 2

echo ""
echo -e "${GREEN}╔═══════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  🎉 Application démarrée avec succès! ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}📊 Informations:${NC}"
echo -e "   Backend:  ${GREEN}http://localhost:5000${NC}"
echo -e "   Frontend: ${GREEN}http://localhost:8080${NC}"
echo -e "   Health:   ${GREEN}http://localhost:5000/health${NC}"
echo ""
echo -e "${YELLOW}⌨️  Pour arrêter les serveurs:${NC}"
echo -e "   Appuyez sur ${RED}Ctrl+C${NC}"
echo ""
echo -e "${BLUE}🌐 Ouvrez votre navigateur:${NC}"
echo -e "   ${GREEN}http://localhost:8080${NC}"
echo ""

# Fonction pour nettoyer à l'arrêt
cleanup() {
    echo ""
    echo -e "${YELLOW}🛑 Arrêt des serveurs...${NC}"
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo -e "${GREEN}✅ Serveurs arrêtés${NC}"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Attendre
wait
